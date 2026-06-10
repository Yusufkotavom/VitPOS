import { useLiveQuery } from '@/services/local-db/reactivity'

import { inventoryRepository } from '@/services/local-db/repository'

export function useInventory() {
  return useLiveQuery(() => inventoryRepository.list(), [], [])
}
