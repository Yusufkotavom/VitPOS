import { useLiveQuery } from '@/services/local-db/reactivity'
import { settingRepository } from '@/services/local-db/repository'

export function useSettings() {
  return useLiveQuery(() => settingRepository.list(), [], [])
}
