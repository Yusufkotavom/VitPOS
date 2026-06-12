import { useLiveQuery } from '@/shared/hooks/use-live-query'

import { supplierRepository } from '@/services/local-db/repository'

export function useSuppliers() {
  return useLiveQuery(() => supplierRepository.list(), [], [])
}
