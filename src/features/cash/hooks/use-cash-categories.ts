import { useLiveQuery } from 'dexie-react-hooks'
import { cashCategoryRepository } from '@/services/local-db/repository'

export function useCashCategories() {
  return useLiveQuery(() => cashCategoryRepository.list(), [], [])
}
