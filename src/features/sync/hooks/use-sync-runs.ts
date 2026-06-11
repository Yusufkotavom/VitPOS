import { useLiveQuery } from 'dexie-react-hooks'

import { localDb } from '@/services/local-db/client'

export function useSyncRuns() {
  const runs = useLiveQuery(() => localDb.syncRuns.orderBy('startedAt').reverse().toArray(), [], [])

  return { runs }
}
