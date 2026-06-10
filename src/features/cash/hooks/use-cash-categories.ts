import { useLiveQuery } from '@/services/local-db/reactivity'
import { cashCategoryRepository } from '@/services/local-db/repository'

export function useCashCategories() {
  return useLiveQuery(() => cashCategoryRepository.list(), [], [])
}
