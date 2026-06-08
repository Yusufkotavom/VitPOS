import { useLiveQuery } from 'dexie-react-hooks'

import { inventoryRepository } from '@/services/local-db/repository'

export function useInventory() {
  return useLiveQuery(() => inventoryRepository.list(), [], [])
}
