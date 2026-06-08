import { useLiveQuery } from 'dexie-react-hooks'

import { salesOrderRepository } from '@/services/local-db/repository'

export function useSalesOrders() {
  return useLiveQuery(() => salesOrderRepository.list(), [], [])
}
