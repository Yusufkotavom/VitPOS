import { useLiveQuery } from 'dexie-react-hooks'
import { shiftRepository } from '@/services/local-db/repository'
import { resolveTenantId } from '@/features/auth/stores/auth-store'

export function useActiveShift() {
  return useLiveQuery(async () => {
    const shifts = await shiftRepository.list()
    return shifts.find((shift) => shift.status === 'open' && shift.tenantId === resolveTenantId()) || null
  }, [], undefined)
}
