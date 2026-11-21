import { useQuery } from '@tanstack/react-query'

import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'
import { normalizePurchaseItems, normalizePurchaseStatus } from '@/features/purchases/lib/purchase-status'

export function usePurchase(id?: string) {
  return useQuery({
    queryKey: ['purchases', id],
    queryFn: async () => {
      if (!id) return null
      const tenantId = requireActiveTenantId()
      const purchase = await localDb.purchases.get(id)
      if (!purchase || purchase.tenantId !== tenantId) return null

      const storedItems = await localDb.purchaseItems.where('purchaseId').equals(purchase.id).toArray()
      const items = storedItems.length > 0
        ? normalizePurchaseItems(storedItems, tenantId, purchase.id)
        : normalizePurchaseItems(purchase.items, tenantId, purchase.id)

      const payments = await localDb.payments.where('tenantId').equals(tenantId).toArray()
      const paymentHistory = payments
        .filter((payment) => payment.purchaseId === purchase.id)
        .map((payment) => ({
          id: payment.id,
          date: payment.date,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
        }))

      return {
        ...purchase,
        status: normalizePurchaseStatus(purchase.status),
        items,
        payments: paymentHistory,
      }
    },
    enabled: !!id,
  })
}
