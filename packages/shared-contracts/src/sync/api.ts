import type { ApiSyncItemStatus, LocalOutboxStatus, ServerSyncStatus, SyncEntityType, SyncMutationType } from './enums'

export type SyncMutationRecord = {
  id: string
  tenantId: string
  entityType: SyncEntityType
  entityId: string
  mutationType: SyncMutationType
  payload: unknown
  status: LocalOutboxStatus
  attempts: number
  errorMessage?: string
  createdAt: string
  updatedAt: string
  syncedAt?: string
}

export type SyncPushRequest = {
  tenantId: string
  branchId?: string | null
  deviceId: string
  mutations: Array<{
    clientMutationId?: string
    entityType: SyncEntityType
    entityId: string
    mutationType: SyncMutationType
    payload?: unknown
    status?: LocalOutboxStatus
  }>
}

export type SyncPushItemResult = {
  entityType: SyncEntityType
  entityId: string
  mutationType: SyncMutationType
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

export type SyncPullQuery = {
  tenantId: string
  branchId?: string
  since?: Date
}

export type SyncPullItem = {
  id: string
  entityType: SyncEntityType
  entityId: string
  mutationType: SyncMutationType
  payload: unknown
  transportStatus: ApiSyncItemStatus
  serverSyncStatus: ServerSyncStatus
  updatedAt: string
}

export type SyncPullResponse = {
  ok: true
  cursor: string | null
  items: SyncPullItem[]
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
