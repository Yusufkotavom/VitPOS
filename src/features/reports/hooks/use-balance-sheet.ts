import { useQuery } from '@tanstack/react-query'
import { getBalanceSheet } from '@/services/accounting/balance-sheet'
import { resolveTenantId } from '@/features/auth/stores/auth-store'

export function useBalanceSheet(params?: { from?: string; to?: string }) {
  const tenantId = resolveTenantId()
  return useQuery({
    queryKey: ['report-balance-sheet', tenantId, params],
    queryFn: () => getBalanceSheet(tenantId, params?.from, params?.to),
  })
}
