import type { ApiSyncItemStatus, LocalOutboxStatus, ServerSyncStatus } from './enums'

export function localOutboxStatusToApiItemStatus(status: LocalOutboxStatus): ApiSyncItemStatus {
  if (status === 'queued') return 'pending'
  if (status === 'syncing') return 'processing'
  if (status === 'synced') return 'applied'
  if (status === 'conflict') return 'conflict'
  return 'rejected'
}

export function serverSyncStatusToApiItemStatus(status: ServerSyncStatus): ApiSyncItemStatus {
  if (status === 'pending') return 'pending'
  if (status === 'synced') return 'applied'
  if (status === 'conflict') return 'conflict'
  return 'rejected'
}

export function apiItemStatusToServerSyncStatus(status: ApiSyncItemStatus): ServerSyncStatus {
  if (status === 'applied') return 'synced'
  if (status === 'conflict') return 'conflict'
  if (status === 'rejected') return 'failed'
  return 'pending'
}
