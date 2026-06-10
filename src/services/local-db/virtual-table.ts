import type { IndexableType, Table as DexieTable, UpdateSpec } from 'dexie'
import { getRuntimeTarget } from './runtime'
import { sqliteAdapter } from './adapters/sqlite.adapter'
import { tableEvents } from './events'

export class VirtualTableWrapper<T extends { id: string }> {
  private dexieTable: DexieTable<T, string>
  private tableName: string

  constructor(
    dexieTable: DexieTable<T, string>,
    tableName: string
  ) {
    this.dexieTable = dexieTable
    this.tableName = tableName
  }

  private get isSqlite() {
    const runtime = getRuntimeTarget()
    return runtime === 'desktop' || runtime === 'mobile'
  }

  async toArray(): Promise<T[]> {
    if (this.isSqlite) {
      return sqliteAdapter.storageTable<T>(this.tableName).toArray()
    }
    return this.dexieTable.toArray()
  }

  async get(id: string): Promise<T | undefined> {
    if (this.isSqlite) {
      return sqliteAdapter.storageTable<T>(this.tableName).get(id)
    }
    return this.dexieTable.get(id)
  }

  async put(item: T): Promise<string> {
    if (this.isSqlite) {
      await sqliteAdapter.storageTable<T>(this.tableName).put(item)
      tableEvents.emit(this.tableName)
      return item.id
    }
    return this.dexieTable.put(item)
  }

  async add(item: T): Promise<string> {
    if (this.isSqlite) {
      await sqliteAdapter.storageTable<T>(this.tableName).put(item)
      tableEvents.emit(this.tableName)
      return item.id
    }
    return this.dexieTable.add(item)
  }

  async update(id: string, changes: Partial<T>): Promise<number> {
    if (this.isSqlite) {
      await sqliteAdapter.storageTable<T>(this.tableName).update(id, changes)
      tableEvents.emit(this.tableName)
      return 1
    }
    return this.dexieTable.update(id, changes as unknown as UpdateSpec<T>)
  }

  async delete(id: string): Promise<void> {
    if (this.isSqlite) {
      await sqliteAdapter.storageTable<T>(this.tableName).delete(id)
      tableEvents.emit(this.tableName)
      return
    }
    return this.dexieTable.delete(id)
  }

  async clear(): Promise<void> {
    if (this.isSqlite) {
      await sqliteAdapter.storageTable<T>(this.tableName).clear()
      tableEvents.emit(this.tableName)
      return
    }
    return this.dexieTable.clear()
  }

  async count(): Promise<number> {
    if (this.isSqlite) {
      return sqliteAdapter.storageTable<T>(this.tableName).count()
    }
    return this.dexieTable.count()
  }

  async bulkPut(items: T[]): Promise<string> {
    if (this.isSqlite) {
      await sqliteAdapter.storageTable<T>(this.tableName).bulkPut(items)
      tableEvents.emit(this.tableName)
      return items.length > 0 ? items[items.length - 1].id : ''
    }
    return String(await this.dexieTable.bulkPut(items))
  }

  // Chainable queries proxy
  where(key: string) {
    return {
      equals: (val: string | number | boolean) => ({
        toArray: async (): Promise<T[]> => {
          if (this.isSqlite) {
            return sqliteAdapter.storageTable<T>(this.tableName).findBy(key, val)
          }
           return this.dexieTable.where(key).equals(val as IndexableType).toArray()
        },
        first: async (): Promise<T | undefined> => {
          if (this.isSqlite) {
            const rows = await sqliteAdapter.storageTable<T>(this.tableName).findBy(key, val)
            return rows[0]
          }
           return this.dexieTable.where(key).equals(val as IndexableType).first()
        },
        delete: async (): Promise<number> => {
          if (this.isSqlite) {
            const rows = await sqliteAdapter.storageTable<T>(this.tableName).findBy(key, val)
            for (const r of rows) {
              await sqliteAdapter.storageTable<T>(this.tableName).delete(r.id)
            }
            if (rows.length > 0) tableEvents.emit(this.tableName)
            return rows.length
          }
          return this.dexieTable.where(key).equals(val as IndexableType).delete()
        },
        count: async (): Promise<number> => {
          if (this.isSqlite) {
            const rows = await sqliteAdapter.storageTable<T>(this.tableName).findBy(key, val)
            return rows.length
          }
          return this.dexieTable.where(key).equals(val as IndexableType).count()
        },
        filter: (predicate: (item: T) => boolean) => ({
          toArray: async (): Promise<T[]> => {
            if (this.isSqlite) {
              const rows = await sqliteAdapter.storageTable<T>(this.tableName).findBy(key, val)
              return rows.filter(predicate)
            }
             return this.dexieTable.where(key).equals(val as IndexableType).filter(predicate).toArray()
          },
          first: async (): Promise<T | undefined> => {
            if (this.isSqlite) {
              const rows = await sqliteAdapter.storageTable<T>(this.tableName).findBy(key, val)
              return rows.filter(predicate)[0]
            }
             return this.dexieTable.where(key).equals(val as IndexableType).filter(predicate).first()
          },
          count: async (): Promise<number> => {
            if (this.isSqlite) {
              const rows = await sqliteAdapter.storageTable<T>(this.tableName).findBy(key, val)
              return rows.filter(predicate).length
            }
             return this.dexieTable.where(key).equals(val as IndexableType).filter(predicate).count()
          }
        })
      })
    }
  }

  orderBy(key: string) {
    return {
      reverse: () => ({
        toArray: async (): Promise<T[]> => {
          if (this.isSqlite) {
             return sqliteAdapter.storageTable<T>(this.tableName).orderBy(key, 'desc')
          }
          return this.dexieTable.orderBy(key).reverse().toArray()
        }
      }),
      toArray: async (): Promise<T[]> => {
        if (this.isSqlite) {
            return sqliteAdapter.storageTable<T>(this.tableName).orderBy(key, 'asc')
        }
        return this.dexieTable.orderBy(key).toArray()
      }
    }
  }
}
