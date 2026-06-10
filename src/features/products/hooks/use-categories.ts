import { useLiveQuery } from '@/services/local-db/reactivity'

import { productCategoryRepository } from '@/services/local-db/repository'

export function useCategories() {
  return useLiveQuery(() => productCategoryRepository.list()) ?? []
}
