import { useLiveQuery } from '@/services/local-db/reactivity'

import { serviceOrderRepository } from '@/services/local-db/repository'

export function useServiceOrders() {
  return useLiveQuery(() => serviceOrderRepository.list(), [], [])
}
