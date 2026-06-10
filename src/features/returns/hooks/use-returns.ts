import { useLiveQuery } from '@/services/local-db/reactivity'

import { returnRepository } from '@/services/local-db/repository'

export function useReturns() {
  return useLiveQuery(() => returnRepository.list(), [], [])
}
