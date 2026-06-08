import { useLiveQuery } from 'dexie-react-hooks'
import { settingRepository } from '@/services/local-db/repository'

export function useSettings() {
  return useLiveQuery(() => settingRepository.list(), [], [])
}
