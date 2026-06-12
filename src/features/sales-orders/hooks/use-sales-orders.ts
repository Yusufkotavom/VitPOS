import { useLiveQuery } from '@/shared/hooks/use-live-query'

import { salesOrderRepository } from '@/services/local-db/repository'

export function useSalesOrders() {
  return useLiveQuery(() => salesOrderRepository.list(), [], [])
}
