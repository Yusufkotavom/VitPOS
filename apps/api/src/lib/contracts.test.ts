import { describe, expect, it } from 'vitest'

import { buildSyncPushResponse, toApiSyncItemStatus } from './contracts'

describe('api sync contracts', () => {
  it('maps local queue statuses to api item statuses', () => {
    expect(toApiSyncItemStatus('queued')).toBe('pending')
    expect(toApiSyncItemStatus('syncing')).toBe('processing')
    expect(toApiSyncItemStatus('synced')).toBe('applied')
    expect(toApiSyncItemStatus('failed')).toBe('rejected')
  })

  it('builds push response summary from item results', () => {
    const response = buildSyncPushResponse([
      { entityId: '1', entityType: 'product', mutationType: 'create', status: 'applied' },
      { entityId: '2', entityType: 'sale', mutationType: 'update', status: 'conflict' },
      { entityId: '3', entityType: 'payment', mutationType: 'delete', status: 'rejected', message: 'Bad payload' },
    ])

    expect(response.summary).toEqual({
      total: 3,
      applied: 1,
      conflict: 1,
      rejected: 1,
    })
    expect(response.ok).toBe(true)
  })
})
