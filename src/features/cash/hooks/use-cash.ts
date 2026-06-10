import { useLiveQuery } from '@/services/local-db/reactivity'

import { cashRepository } from '@/services/local-db/repository'

export function useCash() {
  return useLiveQuery(() => cashRepository.list(), [], [])
}
