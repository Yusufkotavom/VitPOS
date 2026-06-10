import { useLiveQuery } from '@/services/local-db/reactivity'
import { shiftRepository } from '@/services/local-db/repository'

export function useShifts() {
  return useLiveQuery(() => shiftRepository.list(), [], [])
}
