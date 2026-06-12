import { useLiveQuery } from '@/shared/hooks/use-live-query'

import { customerRepository } from '@/services/local-db/repository'

export function useCustomers() {
  return useLiveQuery(() => customerRepository.list(), [], [])
}
