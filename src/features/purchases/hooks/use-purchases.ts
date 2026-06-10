import { useLiveQuery } from '@/services/local-db/reactivity'

import { purchaseRepository } from '@/services/local-db/repository'

export function usePurchases() {
  return useLiveQuery(() => purchaseRepository.list(), [], [])
}
