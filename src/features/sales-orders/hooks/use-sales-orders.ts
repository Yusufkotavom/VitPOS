import { useLiveQuery } from '@/services/local-db/reactivity'

import { salesOrderRepository } from '@/services/local-db/repository'

export function useSalesOrders() {
  return useLiveQuery(() => salesOrderRepository.list(), [], [])
}
