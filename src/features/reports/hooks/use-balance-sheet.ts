import { useQuery } from '@tanstack/react-query'
import { fetchBalanceSheet } from '@/features/reports/api/fetch-balance-sheet'

export function useBalanceSheet(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['report-balance-sheet', params],
    queryFn: () => fetchBalanceSheet(params),
  })
}
