import { getLocalDbAdapter } from './adapters/factory'
import { LOCAL_DB_TABLES } from './adapters'
import type { VitposLocalDb } from './dexie-instance'

export type { VitposLocalDb }

// Create the adapter first
const adapter = getLocalDbAdapter()

export const localDb = new Proxy(adapter, {
  get(target, prop) {
    if (typeof prop === 'string' && LOCAL_DB_TABLES.includes(prop as unknown as typeof LOCAL_DB_TABLES[number])) {
      // It's a table access!
      const table = target.storageTable(prop)
      
      // We wrap the table to make it Dexie compatible enough for existing code
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (item: any) => tbl.put(item)
          }
          
          // Fake Dexie orderBy() emulation
          if (tblProp === 'orderBy') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                filter: (fn: (item: any) => boolean) => ({
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

          // Fake Dexie where() emulation fallback if not implemented natively on adapter
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
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      filter: (fn: (item: any) => boolean) => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return async (...args: any[]) => {
         const mode = args[0] as string
         const scope = args[args.length - 1] as () => Promise<unknown>
         const tablesArg = args.slice(1, args.length - 1)
         
         let dexieMode = 'readonly'
         if (mode === 'rw' || mode === 'readwrite') dexieMode = 'readwrite'
         
         // Flatten tables if they passed an array as the second argument
         const flatTables = Array.isArray(tablesArg[0]) && tablesArg.length === 1 ? tablesArg[0] : tablesArg
         
          const tableNames = flatTables.map(t => {
            if (typeof t === 'string') return t;
            if (t && typeof t === 'object' && 'name' in t) return (t as { name: string }).name;
            if (t && typeof t === 'object' && '__tableName' in t) return (t as { __tableName: string }).__tableName;
            return 'unknown'
          })
           
         return target.runInTransaction(dexieMode as 'readonly' | 'readwrite', tableNames, scope)
      }
    }
    
    if (prop === 'open') return async () => target.init()
    if (prop === 'close') return async () => target.teardown()
    if (prop === 'isOpen') return () => true
    
    // Fallback to adapter method
    if (prop in target) {
      const val = (target as unknown as Record<string, unknown>)[prop as string]
      return typeof val === 'function' ? val.bind(target) : val
    }
  }
}) as unknown as VitposLocalDb
