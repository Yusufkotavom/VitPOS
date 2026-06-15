import { useQuery } from '@tanstack/react-query'
import { getGeneralLedger } from '@/services/accounting/general-ledger'
import { getAccounts } from '@/services/accounting/chart-of-accounts'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { useMemo } from 'react'

export function useGeneralLedger(
  accountCode?: string,
  params?: { from?: string; to?: string },
) {
  const tenantId = resolveTenantId()

  const accountsQuery = useQuery({
    queryKey: ['accounts', tenantId],
    queryFn: () => getAccounts(tenantId),
  })

  const ledgerQuery = useQuery({
    queryKey: ['general-ledger', tenantId, accountCode, params],
    queryFn: () => {
      if (!accountCode) return null
      return getGeneralLedger(tenantId, accountCode, params?.from, params?.to)
    },
    enabled: !!accountCode,
  })

  const accountOptions = useMemo(() => {
    if (!accountsQuery.data) return []
    return accountsQuery.data
      .filter((a) => a.isActive)
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((a) => ({
        value: a.code,
        label: `${a.code} — ${a.name}`,
      }))
  }, [accountsQuery.data])

  return {
    accounts: accountOptions,
    accountsLoading: accountsQuery.isLoading,
    data: ledgerQuery.data,
    isLoading: ledgerQuery.isLoading || accountsQuery.isLoading,
  }
}
