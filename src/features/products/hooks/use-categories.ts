import { useLiveQuery } from '@/shared/hooks/use-live-query'

import { productCategoryRepository } from '@/services/local-db/repository'

export function useCategories() {
  return useLiveQuery(() => productCategoryRepository.list()) ?? []
}
