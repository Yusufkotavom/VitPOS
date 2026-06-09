import { localDb } from '@/services/local-db/client'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { type ConflictResolution, type SyncConflict } from '@/services/local-db/schema'

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export async function createMockConflict(entityId: string) {
  const conflict: SyncConflict = {
    id: createId('conflict'),
    tenantId: resolveTenantId(),
    entityType: 'product',
    entityId,
    localValue: { name: 'Produk Lokal', price: 25000 },
    cloudValue: { name: 'Produk Cloud', price: 27000 },
    reason: 'field_conflict',
    status: 'open',
    createdAt: new Date().toISOString(),
  }

  await localDb.syncConflicts.put(conflict)
  return conflict
}

export async function resolveConflict(id: string, resolution: ConflictResolution) {
  await localDb.syncConflicts.update(id, {
    status: 'resolved',
    resolution,
    resolvedAt: new Date().toISOString(),
  })
}

export async function listConflicts() {
  return localDb.syncConflicts.orderBy('createdAt').reverse().toArray()
}
