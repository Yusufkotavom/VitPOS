import { useLiveQuery } from '@/services/local-db/reactivity'

import { productRepository } from '@/services/local-db/repository'

export function useProducts() {
  return useLiveQuery(() => productRepository.list(), [], [])
}
