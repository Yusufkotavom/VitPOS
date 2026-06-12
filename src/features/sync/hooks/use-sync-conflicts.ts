import { useLiveQuery } from '@/shared/hooks/use-live-query'

import { localDb } from '@/services/local-db/client'

export function useSyncConflicts() {
  const conflicts = useLiveQuery(() => localDb.syncConflicts.orderBy('createdAt').reverse().toArray(), [], [])
  const openCount = conflicts.filter((conflict) => conflict.status === 'open').length

  return {
    conflicts,
    openCount,
  }
}
