import { useQuery } from '@tanstack/react-query'
import { shiftRepository } from '@/services/local-db/repository'
import { resolveTenantId } from '@/features/auth/stores/auth-store'

export function useActiveShift() {
  const { data } = useQuery({
    queryKey: ['active-shift'],
    queryFn: async () => {
      const shifts = await shiftRepository.list()
      return shifts.find((shift) => shift.status === 'open' && shift.tenantId === resolveTenantId()) || null
    }
  })
  return data
}
