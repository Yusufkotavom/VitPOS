import { useLiveQuery } from '@/services/local-db/reactivity'

import { customerRepository } from '@/services/local-db/repository'

export function useCustomers() {
  return useLiveQuery(() => customerRepository.list(), [], [])
}
