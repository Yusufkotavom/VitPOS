import { useQuery } from '@tanstack/react-query'

import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

export function useServiceOrder(id?: string) {
  return useQuery({
    queryKey: ['service-orders', id],
    queryFn: async () => {
      if (!id) return null
      const tenantId = requireActiveTenantId()
      const order = await localDb.serviceOrders.get(id)
      if (!order || order.tenantId !== tenantId) return null

      return order
    },
    enabled: !!id,
  })
}
