import { getLocalDbAdapter } from './adapters/factory'
import { LOCAL_DB_TABLES } from './adapters'
import type { VitposLocalDb } from './dexie-instance'

export type { VitposLocalDb }

export const localDb = new Proxy({} as VitposLocalDb, {
  get(_target, prop) {
    const adapter = getLocalDbAdapter()

    if (typeof prop === 'string' && LOCAL_DB_TABLES.includes(prop as unknown as typeof LOCAL_DB_TABLES[number])) {
      const table = adapter.storageTable(prop)

      return new Proxy(table, {
        has(tbl, tblProp) {
          return tblProp === 'name' || tblProp === '__tableName' || tblProp === 'orderBy' || tblProp in tbl
        },
        get(tbl, tblProp) {
          if (tblProp === 'name' || tblProp === '__tableName') {
            return prop
          }

          if (tblProp in tbl) {
             const val = (tbl as Record<string, unknown>)[tblProp as string];
             if (typeof val === 'function') {
               return val.bind(tbl)
             }
             return val
          }

          if (tblProp === 'add') {
            return (item: unknown) => tbl.put(item as never)
          }

          if (tblProp === 'orderBy') {
            return (column: string) => {
              let reversed = false
              const collection = {
                reverse: () => {
                  reversed = !reversed
                  return collection
                },
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
                first: async () => {
                  const arr = await collection.toArray()
                  return arr[0]
                },
                count: async () => {
                  const arr = await collection.toArray()
                  return arr.length
                },
                filter: (fn: (item: unknown) => boolean) => ({
                  toArray: async () => {
                    const arr = await collection.toArray()
                    return arr.filter(fn)
                  },
                  first: async () => {
                    const arr = await collection.toArray()
                    return arr.find(fn)
                  },
                }),
              }
              return collection
            }
          }

          function matches(item: Record<string, unknown>, column: string, val: unknown): boolean {
            if (column.startsWith('[') && column.endsWith(']') && Array.isArray(val)) {
              const cols = column.slice(1, -1).split('+')
              return cols.every((c, i) => item[c] === val[i])
            }
            return item[column] === val
          }

          if (tblProp === 'where' && !('where' in tbl)) {
             return (column: string) => ({
                equals: (val: unknown) => {
                  return {
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
                      filter: (fn: (item: unknown) => boolean) => {
                       return {
                         toArray: async () => {
                           const all = await tbl.toArray()
                           return all.filter((item: Record<string, unknown>) => matches(item, column, val)).filter(fn)
                         },
                         first: async () => {
                           const all = await tbl.toArray()
                           return all.filter((item: Record<string, unknown>) => matches(item, column, val)).find(fn)
                         }
                       }
                     }
                  }
                }
             })
          }
          return undefined
        }
      })
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
            if (typeof t === 'string') return t;
            if (t && typeof t === 'object' && 'name' in t) return (t as { name: string }).name;
            if (t && typeof t === 'object' && '__tableName' in t) return (t as { __tableName: string }).__tableName;
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
