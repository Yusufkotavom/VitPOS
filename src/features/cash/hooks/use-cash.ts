import { useLiveQuery } from '@/shared/hooks/use-live-query'

import { cashRepository } from '@/services/local-db/repository'

export function useCash() {
  return useLiveQuery(() => cashRepository.list(), [], [])
}
