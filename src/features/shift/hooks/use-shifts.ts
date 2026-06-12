import { useQuery } from '@tanstack/react-query'
import { shiftRepository } from '@/services/local-db/repository'

export function useShifts() {
  const { data = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => shiftRepository.list(),
  })
  return data
}
