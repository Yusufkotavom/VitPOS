import { useLiveQuery } from 'dexie-react-hooks'

import { serviceOrderRepository } from '@/services/local-db/repository'

export function useServiceOrders() {
  return useLiveQuery(() => serviceOrderRepository.list(), [], [])
}
