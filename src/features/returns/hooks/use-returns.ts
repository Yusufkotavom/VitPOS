import { useLiveQuery } from '@/shared/hooks/use-live-query'

import { returnRepository } from '@/services/local-db/repository'

export function useReturns() {
  return useLiveQuery(() => returnRepository.list(), [], [])
}
