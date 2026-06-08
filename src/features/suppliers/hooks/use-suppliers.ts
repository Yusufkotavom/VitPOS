import { useLiveQuery } from 'dexie-react-hooks'

import { supplierRepository } from '@/services/local-db/repository'

export function useSuppliers() {
  return useLiveQuery(() => supplierRepository.list(), [], [])
}
