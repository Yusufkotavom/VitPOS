import { useQuery } from '@tanstack/react-query'

import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

export function useSalesOrder(id?: string) {
  return useQuery({
    queryKey: ['sales-orders', id],
    queryFn: async () => {
      if (!id) return null
      const tenantId = requireActiveTenantId()
      const order = await localDb.salesOrders.get(id)
      if (!order || order.tenantId !== tenantId) return null
      const tableItems = await localDb.salesOrderItems.where('salesOrderId').equals(order.id).toArray()
      const items = tableItems.length > 0 ? tableItems : Array.isArray(order.items) ? order.items : []
      const payments = await localDb.payments.where('tenantId').equals(tenantId).toArray()
      const paymentHistory = payments
        .filter((payment) => payment.salesOrderId === order.id)
        .map((payment) => ({
          id: payment.id,
          date: payment.date,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
        }))

      return {
        ...order,
        items,
        payments: paymentHistory,
      }
    },
    enabled: !!id,
  })
}
