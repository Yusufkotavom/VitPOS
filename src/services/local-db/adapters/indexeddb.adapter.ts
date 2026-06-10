import { type IndexableType, type Table, type UpdateSpec } from 'dexie'

import type {
  AdapterTable,
  LocalDbAdapter,
  LocalDbAdapterMetadata,
  StorageTransactionMode,
} from '@/services/local-db/adapters'
import { localDb } from '@/services/local-db/client'

type AnyRecord = { id: string }

class DexieAdapterTable<T extends AnyRecord> implements AdapterTable<T> {
  private source: Table<T, string>
  constructor(source: Table<T, string>) { this.source = source }
  toArray() { return this.source.toArray() }
  get(id: string) { return this.source.get(id) }
  put(row: T) { return this.source.put(row) }
  delete(id: string) { return this.source.delete(id) }
  update(id: string, changes: Partial<T>) { return this.source.update(id, changes as unknown as UpdateSpec<T>) }
  count() { return this.source.count() }
  bulkPut(rows: T[]) { return this.source.bulkPut(rows) }
  clear() { return this.source.clear() }
  findBy(key: string, value: string | number | boolean) { return this.source.where(key).equals(value as IndexableType).toArray() }
  orderBy(key: string, direction: 'asc' | 'desc') { 
    if (direction === 'desc') {
      return this.source.orderBy(key).reverse().toArray()
    }
    return this.source.orderBy(key).toArray()
  }
}

class DexieAdapter implements LocalDbAdapter {
  metadata: LocalDbAdapterMetadata = { name: 'indexeddb', platform: 'web' }

  async init(): Promise<void> {
    if (!localDb.isOpen()) await localDb.open()
  }

  async teardown(): Promise<void> {
    if (localDb.isOpen()) localDb.close()
  }

  storageTable<T extends AnyRecord>(name: string): AdapterTable<T> {
    const raw = (localDb as unknown as Record<string, Table<T, string> | undefined>)[name]
    if (!raw) throw new Error(`Unknown table: ${name}`)
    return new DexieAdapterTable<T>(raw)
  }

  async runInTransaction<T>(mode: StorageTransactionMode, tableNames: string[], scope: () => Promise<T>): Promise<T> {
    const tables = tableNames.map((name) => {
      const raw = (localDb as unknown as Record<string, Table<unknown, string> | undefined>)[name]
      if (!raw) throw new Error(`Unknown table: ${name}`)
      return raw
    })
    const dexieMode = mode === 'readwrite' ? 'rw' : 'r'
    return await localDb.transaction(dexieMode, tables, scope) as Promise<T>
  }
}

export const dexieAdapter = new DexieAdapter()

// Re-export for backward compatibility (most existing code imports from here)
export { localDb }
export type { VitposLocalDb } from '@/services/local-db/client'
// Keep type imports valid for callers that reference EntityTable shapes
export type {
  LocalCash, LocalCustomer, LocalInventory, LocalPayment, LocalProduct,
  LocalProductCategory, LocalPurchase, LocalPurchaseItem, LocalReturn,
  LocalReturnItem, LocalSalesOrder, LocalSalesOrderItem, LocalServiceOrder,
  LocalSetting, LocalShift, LocalStockMovement, LocalSupplier,
  OutboxItem, SyncConflict, SyncRun,
} from '@/services/local-db/schema'
