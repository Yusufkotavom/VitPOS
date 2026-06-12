import { useLiveQuery } from '@/shared/hooks/use-live-query'

import { serviceOrderRepository } from '@/services/local-db/repository'

export function useServiceOrders() {
  return useLiveQuery(() => serviceOrderRepository.list(), [], [])
}
