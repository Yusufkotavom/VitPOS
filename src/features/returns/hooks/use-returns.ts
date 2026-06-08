import { useLiveQuery } from 'dexie-react-hooks'

import { returnRepository } from '@/services/local-db/repository'

export function useReturns() {
  return useLiveQuery(() => returnRepository.list(), [], [])
}
