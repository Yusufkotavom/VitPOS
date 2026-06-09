import type { ApiSyncItemStatus, LocalOutboxStatus, SyncMutationRecord, SyncPushItemResult } from '@kotacom/shared-contracts/sync'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isSyncEntityId(value: string) {
  return uuidPattern.test(value)
}

export function toLocalOutboxStatus(status: ApiSyncItemStatus): LocalOutboxStatus {
  if (status === 'applied') return 'synced'
  if (status === 'conflict') return 'conflict'
  if (status === 'processing') return 'syncing'
  return 'failed'
}

export function partitionSyncMutations(items: SyncMutationRecord[]) {
  const accepted: SyncMutationRecord[] = []
  const rejected: Array<{ item: SyncMutationRecord; message: string }> = []

  for (const item of items) {
    // Settings use semantic keys (like 'company-name') as IDs - bypass UUID validation
    if (!isSyncEntityId(item.entityId) && item.entityType !== 'setting') {
      rejected.push({ item, message: 'ID lokal belum kompatibel sinkron. Simpan ulang data ini.' })
      continue
    }

    accepted.push(item)
  }

  return { accepted, rejected }
}

export function indexPushResults(items: SyncPushItemResult[]) {
  return new Map(items.map((item) => [`${item.entityType}:${item.entityId}:${item.mutationType}`, item]))
}
