import { useLiveQuery } from 'dexie-react-hooks'

import { productRepository } from '@/services/local-db/repository'

export function useProducts() {
  return useLiveQuery(() => productRepository.list(), [], [])
}
