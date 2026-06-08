import { useLiveQuery } from 'dexie-react-hooks'

import { customerRepository } from '@/services/local-db/repository'

export function useCustomers() {
  return useLiveQuery(() => customerRepository.list(), [], [])
}
