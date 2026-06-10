import { useLiveQuery } from '@/services/local-db/reactivity'

import { localDb } from '@/services/local-db/client'

export function useSyncConflicts() {
  const conflicts = useLiveQuery(() => localDb.syncConflicts.orderBy('createdAt').reverse().toArray(), [], [])
  const openCount = conflicts.filter((conflict) => conflict.status === 'open').length

  return {
    conflicts,
    openCount,
  }
}
