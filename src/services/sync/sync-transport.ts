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

const prefixedIdPattern = /^[a-z]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function extractEntityId(entityId: string): string {
  const match = entityId.match(prefixedIdPattern)
  return match ? entityId.slice(entityId.indexOf('-') + 1) : entityId
}

export function partitionSyncMutations(items: SyncMutationRecord[]) {
  const accepted: SyncMutationRecord[] = []
  const rejected: Array<{ item: SyncMutationRecord; message: string }> = []

  for (const item of items) {
    if (item.entityType === 'setting') {
      accepted.push(item)
      continue
    }

    if (isSyncEntityId(item.entityId) || prefixedIdPattern.test(item.entityId)) {
      accepted.push(item)
      continue
    }

    rejected.push({ item, message: 'ID lokal belum kompatibel sinkron. Simpan ulang data ini.' })
  }

  return { accepted, rejected }
}

export function indexPushResults(items: SyncPushItemResult[]) {
  return new Map(items.map((item) => [`${item.entityType}:${item.entityId}:${item.mutationType}`, item]))
}
