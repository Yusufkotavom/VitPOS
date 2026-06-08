import { describe, expect, it } from 'vitest'

import {
  apiItemStatusToServerSyncStatus,
  buildSyncPushResponse,
  localOutboxStatusToApiItemStatus,
  serverSyncStatusToApiItemStatus,
} from '../sync'

describe('shared sync contracts', () => {
  it('keeps local transport statuses separate from server statuses', () => {
    expect(localOutboxStatusToApiItemStatus('queued')).toBe('pending')
    expect(localOutboxStatusToApiItemStatus('syncing')).toBe('processing')
    expect(localOutboxStatusToApiItemStatus('synced')).toBe('applied')
    expect(localOutboxStatusToApiItemStatus('failed')).toBe('rejected')
    expect(localOutboxStatusToApiItemStatus('conflict')).toBe('conflict')
  })

  it('maps server statuses without collapsing conflicts', () => {
    expect(serverSyncStatusToApiItemStatus('pending')).toBe('pending')
    expect(serverSyncStatusToApiItemStatus('synced')).toBe('applied')
    expect(serverSyncStatusToApiItemStatus('failed')).toBe('rejected')
    expect(serverSyncStatusToApiItemStatus('conflict')).toBe('conflict')
  })

  it('maps API item result statuses to server sync statuses', () => {
    expect(apiItemStatusToServerSyncStatus('applied')).toBe('synced')
    expect(apiItemStatusToServerSyncStatus('pending')).toBe('pending')
    expect(apiItemStatusToServerSyncStatus('processing')).toBe('pending')
    expect(apiItemStatusToServerSyncStatus('rejected')).toBe('failed')
    expect(apiItemStatusToServerSyncStatus('conflict')).toBe('conflict')
  })

  it('summarizes push item results', () => {
    const response = buildSyncPushResponse([
      { entityId: 'product-1', entityType: 'product', mutationType: 'create', status: 'applied' },
      { entityId: 'sale-1', entityType: 'sale', mutationType: 'update', status: 'conflict' },
      { entityId: 'payment-1', entityType: 'payment', mutationType: 'delete', status: 'rejected' },
    ])

    expect(response.summary).toEqual({ total: 3, applied: 1, conflict: 1, rejected: 1 })
  })
})
