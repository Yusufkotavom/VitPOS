export type ApiSyncEntityType = 'product' | 'customer' | 'sale' | 'payment' | 'stock_movement'
export type ApiSyncMutationType = 'create' | 'update' | 'delete'
export type ClientOutboxStatus = 'queued' | 'syncing' | 'synced' | 'failed'
export type ApiSyncItemStatus = 'pending' | 'processing' | 'applied' | 'conflict' | 'rejected'

export type SyncMutationInput = {
  entityId: string
  entityType: ApiSyncEntityType
  mutationType: ApiSyncMutationType
  clientMutationId?: string
  payload?: unknown
  status?: ClientOutboxStatus
}

export type SyncPushItemResult = {
  entityId: string
  entityType: ApiSyncEntityType
  mutationType: ApiSyncMutationType
  status: Exclude<ApiSyncItemStatus, 'pending' | 'processing'>
  message?: string
}

export type SyncPushResponse = {
  ok: true
  summary: {
    total: number
    applied: number
    conflict: number
    rejected: number
  }
  items: SyncPushItemResult[]
}

export function toApiSyncItemStatus(status: ClientOutboxStatus): ApiSyncItemStatus {
  if (status === 'queued') return 'pending'
  if (status === 'syncing') return 'processing'
  if (status === 'synced') return 'applied'
  return 'rejected'
}

export function buildSyncPushResponse(items: SyncPushItemResult[]): SyncPushResponse {
  return {
    ok: true,
    summary: {
      total: items.length,
      applied: items.filter((item) => item.status === 'applied').length,
      conflict: items.filter((item) => item.status === 'conflict').length,
      rejected: items.filter((item) => item.status === 'rejected').length,
    },
    items,
  }
}
