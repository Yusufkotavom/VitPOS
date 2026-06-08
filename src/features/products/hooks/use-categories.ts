import { useLiveQuery } from 'dexie-react-hooks'

import { productCategoryRepository } from '@/services/local-db/repository'

export function useCategories() {
  return useLiveQuery(() => productCategoryRepository.list()) ?? []
}
