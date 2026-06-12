import { useLiveQuery } from '@/shared/hooks/use-live-query'

import { purchaseRepository } from '@/services/local-db/repository'

export function usePurchases() {
  return useLiveQuery(() => purchaseRepository.list(), [], [])
}
