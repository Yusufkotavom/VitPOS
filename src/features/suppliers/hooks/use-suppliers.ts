import { useLiveQuery } from '@/services/local-db/reactivity'

import { supplierRepository } from '@/services/local-db/repository'

export function useSuppliers() {
  return useLiveQuery(() => supplierRepository.list(), [], [])
}
