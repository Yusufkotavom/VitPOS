import { useLiveQuery } from 'dexie-react-hooks'

import { purchaseRepository } from '@/services/local-db/repository'

export function usePurchases() {
  return useLiveQuery(() => purchaseRepository.list(), [], [])
}
