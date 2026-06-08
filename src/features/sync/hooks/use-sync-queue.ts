import { useLiveQuery } from 'dexie-react-hooks'

import { localDb } from '@/services/local-db/client'

export function useSyncQueue() {
  const items = useLiveQuery(() => localDb.outbox.orderBy('createdAt').reverse().toArray(), [], [])

  const pendingCount = items.filter((item) => item.status === 'queued' || item.status === 'syncing').length
  const failedCount = items.filter((item) => item.status === 'failed').length

  return {
    items,
    pendingCount,
    failedCount,
  }
}
