export type AdapterTable<T extends { id: string }> = {
  toArray(): Promise<T[]>
  get(id: string): Promise<T | undefined>
  put(row: T): Promise<unknown>
  delete(id: string): Promise<void>
  update(id: string, changes: Partial<T>): Promise<unknown>
  count(): Promise<number>
  bulkPut(rows: T[]): Promise<unknown>
  clear(): Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where?(column: string): any
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
  'cashCategories',
  'settings',
  'paymentMethods',
  'shifts',
  'suppliers',
  'purchases',
  'purchaseItems',
  'returns',
  'returnItems',
  'serviceOrders',
  'recipes',
  'productionBatches',
  'outbox',
  'syncConflicts',
  'syncRuns',
] as const

export type LocalDbTableName = (typeof LOCAL_DB_TABLES)[number]
