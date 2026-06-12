import { getLocalDbAdapter } from './adapters/factory'
import { LOCAL_DB_TABLES } from './adapters'
import type { AdapterTable } from './adapters'
import type { VitposLocalDb } from './dexie-instance'

export type { VitposLocalDb }

const KNOWN_TABLE_METHODS = [
  'name', '__tableName',
  'toArray', 'get', 'put', 'delete', 'update', 'count',
  'bulkGet', 'bulkPut', 'clear', 'where', 'add', 'orderBy',
]

function matches(item: Record<string, unknown>, column: string, val: unknown): boolean {
  if (column.startsWith('[') && column.endsWith(']') && Array.isArray(val)) {
    const cols = column.slice(1, -1).split('+')
    return cols.every((c, i) => item[c] === val[i])
  }
  return item[column] === val
}

function createLazyTableProxy(tableName: string): AdapterTable<{ id: string }> {
  let resolvedTable: AdapterTable<{ id: string }> | null = null

  const ensureTable = () => {
    if (!resolvedTable) {
      resolvedTable = getLocalDbAdapter().storageTable(tableName)
    }
    return resolvedTable
  }

  return new Proxy({} as AdapterTable<{ id: string }>, {
    has(_, prop) {
      return KNOWN_TABLE_METHODS.includes(prop as string)
    },
    get(_, prop) {
      if (prop === 'name' || prop === '__tableName') return tableName

      const tbl = ensureTable()

      if (prop in tbl) {
        const val = (tbl as Record<string, unknown>)[prop as string]
        if (typeof val === 'function') {
          if (['put', 'delete', 'update', 'bulkPut', 'clear'].includes(prop as string)) {
            return async (...args: unknown[]) => {
              const res = await (val.bind(tbl) as (...args: unknown[]) => Promise<unknown>)(...args)
              window.dispatchEvent(new CustomEvent('vitpos:db-mutate', { detail: { table: tableName, action: prop } }))
              return res
            }
          }
          return val.bind(tbl)
        }
        return val
      }

      if (prop === 'add') {
        return async (item: unknown) => {
          const res = await tbl.put(item as never)
          window.dispatchEvent(new CustomEvent('vitpos:db-mutate', { detail: { table: tableName, action: 'add' } }))
          return res
        }
      }

      if (prop === 'orderBy') {
        return (column: string) => {
          let reversed = false
          const collection = {
            reverse: () => { reversed = !reversed; return collection },
            toArray: async () => {
              const all = await tbl.toArray()
              const sorted = [...all].sort((a, b) => {
                const av = (a as Record<string, unknown>)[column]
                const bv = (b as Record<string, unknown>)[column]
                if (av == null) return 1
                if (bv == null) return -1
                if (av < bv) return -1
                if (av > bv) return 1
                return 0
              })
              return reversed ? sorted.reverse() : sorted
            },
            first: async () => (await collection.toArray())[0],
            count: async () => (await collection.toArray()).length,
            filter: (fn: (item: unknown) => boolean) => ({
              toArray: async () => (await collection.toArray()).filter(fn),
              first: async () => (await collection.toArray()).find(fn),
            }),
          }
          return collection
        }
      }

      if (prop === 'where' && !('where' in tbl)) {
        return (column: string) => ({
          equals: (val: unknown) => ({
            toArray: async () => {
              const all = await tbl.toArray()
              return all.filter((item: Record<string, unknown>) => matches(item, column, val))
            },
            first: async () => {
              const all = await tbl.toArray()
              return all.find((item: Record<string, unknown>) => matches(item, column, val))
            },
            count: async () => {
              const all = await tbl.toArray()
              return all.filter((item: Record<string, unknown>) => matches(item, column, val)).length
            },
            delete: async () => {
              const all = await tbl.toArray()
              const toDelete = all.filter((item: Record<string, unknown>) => matches(item, column, val))
              for (const item of toDelete) {
                await tbl.delete((item as { id: string }).id)
              }
            },
            filter: (fn: (item: unknown) => boolean) => ({
              toArray: async () => {
                const all = await tbl.toArray()
                return all.filter((item: Record<string, unknown>) => matches(item, column, val)).filter(fn)
              },
              first: async () => {
                const all = await tbl.toArray()
                return all.filter((item: Record<string, unknown>) => matches(item, column, val)).find(fn)
              },
            }),
          }),
        })
      }

      return undefined
    },
  })
}

export const localDb = new Proxy({} as VitposLocalDb, {
  get(_target, prop) {
    const adapter = getLocalDbAdapter()

    if (typeof prop === 'string' && LOCAL_DB_TABLES.includes(prop as unknown as typeof LOCAL_DB_TABLES[number])) {
      return createLazyTableProxy(prop)
    }

    if (prop === 'transaction') {
      return async (...args: unknown[]) => {
        const mode = args[0] as string
        const scope = args[args.length - 1] as () => Promise<unknown>
        const tablesArg = args.slice(1, args.length - 1)

        let dexieMode = 'readonly'
        if (mode === 'rw' || mode === 'readwrite') dexieMode = 'readwrite'

        const flatTables = Array.isArray(tablesArg[0]) && tablesArg.length === 1 ? tablesArg[0] : tablesArg

        const tableNames = flatTables.map(t => {
          if (typeof t === 'string') return t
          if (t && typeof t === 'object' && 'name' in t) return (t as { name: string }).name
          if (t && typeof t === 'object' && '__tableName' in t) return (t as { __tableName: string }).__tableName
          return 'unknown'
        })

        return adapter.runInTransaction(dexieMode as 'readonly' | 'readwrite', tableNames, scope)
      }
    }

    if (prop === 'open') return async () => adapter.init()
    if (prop === 'close') return async () => adapter.teardown()
    if (prop === 'isOpen') return () => true

    if (prop in adapter) {
      const val = (adapter as unknown as Record<string, unknown>)[prop as string]
      return typeof val === 'function' ? val.bind(adapter) : val
    }
  }
}) as unknown as VitposLocalDb
