import { useLiveQuery } from '@/shared/hooks/use-live-query'
import { cashCategoryRepository } from '@/services/local-db/repository'

export function useCashCategories() {
  return useLiveQuery(() => cashCategoryRepository.list(), [], [])
}
