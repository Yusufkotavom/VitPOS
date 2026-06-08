import { useLiveQuery } from 'dexie-react-hooks'
import { shiftRepository } from '@/services/local-db/repository'

export function useShifts() {
  return useLiveQuery(() => shiftRepository.list(), [], [])
}
