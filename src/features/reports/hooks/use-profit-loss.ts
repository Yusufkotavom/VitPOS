import { useQuery } from '@tanstack/react-query'
import { fetchProfitLoss } from '@/features/reports/api/fetch-profit-loss'

export function useProfitLoss(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['report-profit-loss', params],
    queryFn: () => fetchProfitLoss(params),
  })
}
