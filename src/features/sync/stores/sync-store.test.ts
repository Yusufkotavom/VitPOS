import { describe, expect, it } from 'vitest'

import { useSyncStore } from '@/features/sync/stores/sync-store'

describe('useSyncStore', () => {
  it('does not notify subscribers when setCounts receives unchanged values', () => {
    useSyncStore.setState({
      isOnline: true,
      status: 'pending',
      pendingCount: 3,
      failedCount: 1,
      conflictCount: 2,
      lastSyncAt: null,
    })

    let notifications = 0
    const unsubscribe = useSyncStore.subscribe(() => {
      notifications += 1
    })

    useSyncStore.getState().setCounts({
      pendingCount: 3,
      failedCount: 1,
      conflictCount: 2,
    })

    unsubscribe()

    expect(notifications).toBe(0)
  })
})
