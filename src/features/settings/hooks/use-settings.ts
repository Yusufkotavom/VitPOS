import { useLiveQuery } from '@/shared/hooks/use-live-query'
import { settingRepository } from '@/services/local-db/repository'

export function useSettings() {
  return useLiveQuery(() => settingRepository.list(), [], [])
}
