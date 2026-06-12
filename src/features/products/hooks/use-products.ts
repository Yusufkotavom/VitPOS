import { useLiveQuery } from '@/shared/hooks/use-live-query'

import { productRepository } from '@/services/local-db/repository'

export function useProducts() {
  return useLiveQuery(() => productRepository.list(), [], [])
}
