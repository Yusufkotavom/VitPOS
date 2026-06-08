import { useLiveQuery } from 'dexie-react-hooks'

import { cashRepository } from '@/services/local-db/repository'

export function useCash() {
  return useLiveQuery(() => cashRepository.list(), [], [])
}
