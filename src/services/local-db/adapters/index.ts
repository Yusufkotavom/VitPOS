export type AdapterTable<T extends { id: string }> = {
  toArray(): Promise<T[]>
  get(id: string): Promise<T | undefined>
  put(row: T): Promise<unknown>
  delete(id: string): Promise<void>
  update(id: string, changes: Partial<T>): Promise<unknown>
  count(): Promise<number>
  bulkPut(rows: T[]): Promise<unknown>
  clear(): Promise<void>
  findBy(key: string, value: string | number | boolean): Promise<T[]>
  orderBy(key: string, direction: 'asc' | 'desc'): Promise<T[]>
}

export type LocalDbAdapterName = 'indexeddb' | 'sqlite'
export type LocalDbPlatform = 'web' | 'mobile' | 'desktop'

export type LocalDbAdapterMetadata = {
  name: LocalDbAdapterName
  platform: LocalDbPlatform
}

export type StorageTransactionMode = 'readonly' | 'readwrite'

export interface LocalDbAdapter {
  readonly metadata: LocalDbAdapterMetadata

  init(): Promise<void>
  teardown(): Promise<void>

  storageTable<T extends { id: string }>(name: string): AdapterTable<T>

  runInTransaction<T>(mode: StorageTransactionMode, tableNames: string[], scope: () => Promise<T>): Promise<T>
}

export const LOCAL_DB_TABLES = [
  'products',
  'productCategories',
  'customers',
  'salesOrders',
  'salesOrderItems',
  'payments',
  'stockMovements',
  'inventory',
  'cash',
  'settings',
  'shifts',
  'suppliers',
  'purchases',
  'purchaseItems',
  'returns',
  'returnItems',
  'serviceOrders',
  'outbox',
  'syncConflicts',
  'syncRuns',
] as const

export type LocalDbTableName = (typeof LOCAL_DB_TABLES)[number]
