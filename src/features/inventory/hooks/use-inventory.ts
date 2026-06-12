import { useLiveQuery } from '@/shared/hooks/use-live-query'

import { inventoryRepository } from '@/services/local-db/repository'

export function useInventory() {
  return useLiveQuery(() => inventoryRepository.list(), [], [])
}
