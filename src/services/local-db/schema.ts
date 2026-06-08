export type SyncEntityType = 'product' | 'customer' | 'sale' | 'payment' | 'stock_movement'
export type SyncMutationType = 'create' | 'update' | 'delete'
export type OutboxStatus = 'queued' | 'syncing' | 'synced' | 'failed'
export type ConflictStatus = 'open' | 'resolved'
export type ConflictResolution = 'use_local' | 'use_cloud' | 'manual_merge'

export type LocalProduct = {
  id: string
  name: string
  category: string
  type: 'Produk Fisik' | 'Jasa'
  price: string
  stock: string
  status: string
}

export type LocalCustomer = {
  id: string
  name: string
  phone: string
  city: string
  receivable: string
  orders: string
  status: string
}

export type LocalSalesOrder = {
  id: string
  code: string
  customer: string
  date: string
  total: string
  paid: string
  status: string
}

export type LocalPayment = {
  id: string
  ref: string
  source: string
  method: string
  amount: string
  date: string
  status: string
}

export type LocalInventory = {
  id: string
  product: string
  warehouse: string
  stockSystem: string
  stockSafe: string
  movement: string
  status: string
}

export type LocalCash = {
  id: string
  ref: string
  date: string
  account: string
  category: string
  income: string
  expense: string
  status: string
}

export type OutboxItem = {
  id: string
  entityType: SyncEntityType
  entityId: string
  mutationType: SyncMutationType
  payload: unknown
  status: OutboxStatus
  attempts: number
  errorMessage?: string
  createdAt: string
  updatedAt: string
  syncedAt?: string
}

export type SyncConflict = {
  id: string
  entityType: SyncEntityType
  entityId: string
  localValue: unknown
  cloudValue: unknown
  reason: 'version_mismatch' | 'deleted_remotely' | 'field_conflict'
  status: ConflictStatus
  resolution?: ConflictResolution
  createdAt: string
  resolvedAt?: string
}

export type SyncRun = {
  id: string
  startedAt: string
  finishedAt?: string
  status: 'running' | 'success' | 'failed'
  processed: number
  failed: number
}
