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
        get(tbl, tblProp) {
          if (tblProp in tbl) {
             const val = (tbl as Record<string, unknown>)[tblProp as string];
             if (typeof val === 'function') {
               return val.bind(tbl)
             }
             return val
          }
          
          if (tblProp === 'add') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (item: unknown) => tbl.put(item as any)
          }
          
          // Fake Dexie where() emulation fallback if not implemented natively on adapter
          if (tblProp === 'where' && !('where' in tbl)) {
             return (column: string) => ({
                equals: (val: unknown) => {
                  return {
                     toArray: async () => {
                       const all = await tbl.toArray()
                       return all.filter((item: Record<string, unknown>) => item[column] === val)
                     },
                     first: async () => {
                       const all = await tbl.toArray()
                       return all.find((item: Record<string, unknown>) => item[column] === val)
                     },
                     count: async () => {
                       const all = await tbl.toArray()
                       return all.filter((item: Record<string, unknown>) => item[column] === val).length
                     },
                     delete: async () => {
                       const all = await tbl.toArray()
                       const toDelete = all.filter((item: Record<string, unknown>) => item[column] === val)
                       for (const item of toDelete) {
                         await tbl.delete((item as { id: string }).id)
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
      return async (mode: string, tables: unknown, scope: () => Promise<unknown>) => {
         let dexieMode = 'readonly'
         if (mode === 'rw' || mode === 'readwrite') dexieMode = 'readwrite'
         
         // extract table names from array of proxies
         const tableNames = Array.isArray(tables) 
           ? tables.map(t => typeof t === 'string' ? t : (t as { name?: string }).name || 'unknown')
           : typeof tables === 'string' ? [tables] : [(tables as { name?: string })?.name || 'unknown']
           
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
