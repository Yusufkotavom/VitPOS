import { useQuery } from '@tanstack/react-query'
import { getProfitLoss } from '@/services/accounting/profit-loss'
import { resolveTenantId } from '@/features/auth/stores/auth-store'

export function useProfitLoss(params?: { from?: string; to?: string }) {
  const tenantId = resolveTenantId()
  return useQuery({
    queryKey: ['report-profit-loss', tenantId, params],
    queryFn: () => getProfitLoss(tenantId, params?.from, params?.to),
  })
}
