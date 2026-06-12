import { useLiveQuery } from '@/shared/hooks/use-live-query'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

export function useStockMovements() {
  const activeTenantId = useAuthStore((state) => state.activeTenant?.id)
  return useLiveQuery(
    () => activeTenantId ? localDb.stockMovements.where('tenantId').equals(activeTenantId).toArray() : [],
    [activeTenantId],
    [],
  )
}
