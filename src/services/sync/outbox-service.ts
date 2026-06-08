import { localDb } from '@/services/local-db/client'
import { type OutboxItem, type OutboxStatus, type SyncEntityType, type SyncMutationType } from '@/services/local-db/schema'

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export async function enqueueOutboxItem(input: {
  entityType: SyncEntityType
  entityId: string
  mutationType: SyncMutationType
  payload: unknown
}) {
  const now = new Date().toISOString()
  const item: OutboxItem = {
    id: createId('outbox'),
    entityType: input.entityType,
    entityId: input.entityId,
    mutationType: input.mutationType,
    payload: input.payload,
    status: 'queued',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  }

  await localDb.outbox.put(item)
  return item
}

export async function updateOutboxStatus(id: string, status: OutboxStatus, errorMessage?: string) {
  await localDb.outbox.update(id, {
    status,
    errorMessage,
    updatedAt: new Date().toISOString(),
    syncedAt: status === 'synced' ? new Date().toISOString() : undefined,
  })
}

export async function listOutboxItems() {
  return localDb.outbox.orderBy('createdAt').reverse().toArray()
}
