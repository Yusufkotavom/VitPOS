import { describe, expect, it } from 'vitest'

import type { SyncMutationRecord } from '@kotacom/shared-contracts/sync'

import { indexPushResults, isSyncEntityId, partitionSyncMutations, toLocalOutboxStatus } from '@/services/sync/sync-transport'

function createMutation(overrides: Partial<SyncMutationRecord> = {}): SyncMutationRecord {
  return {
    id: 'outbox-1',
    tenantId: 'tenant-1',
    entityType: 'product',
    entityId: '66666666-6666-4666-8666-666666666666',
    mutationType: 'create',
    payload: { name: 'Produk Demo' },
    status: 'queued',
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('sync transport helpers', () => {
  it('accepts uuid sync entity ids', () => {
    expect(isSyncEntityId('66666666-6666-4666-8666-666666666666')).toBe(true)
  })

  it('rejects legacy prefixed sync entity ids', () => {
    expect(isSyncEntityId('product-66666666-6666-4666-8666-666666666666')).toBe(false)
  })

  it('partitions invalid mutations before push', () => {
    const result = partitionSyncMutations([
      createMutation(),
      createMutation({ id: 'outbox-2', entityId: 'product-legacy-id' }),
    ])

    expect(result.accepted).toHaveLength(1)
    expect(result.rejected).toEqual([
      {
        item: expect.objectContaining({ id: 'outbox-2', entityId: 'product-legacy-id' }),
        message: 'ID lokal belum kompatibel sinkron. Simpan ulang data ini.',
      },
    ])
  })

  it('maps API item statuses back to local outbox statuses', () => {
    expect(toLocalOutboxStatus('applied')).toBe('synced')
    expect(toLocalOutboxStatus('conflict')).toBe('conflict')
    expect(toLocalOutboxStatus('processing')).toBe('syncing')
    expect(toLocalOutboxStatus('rejected')).toBe('failed')
  })

  it('indexes push results by entity and mutation', () => {
    const indexed = indexPushResults([
      {
        entityType: 'product',
        entityId: '66666666-6666-4666-8666-666666666666',
        mutationType: 'create',
        status: 'applied',
      },
    ])

    expect(indexed.get('product:66666666-6666-4666-8666-666666666666:create')).toEqual({
      entityType: 'product',
      entityId: '66666666-6666-4666-8666-666666666666',
      mutationType: 'create',
      status: 'applied',
    })
  })
})
