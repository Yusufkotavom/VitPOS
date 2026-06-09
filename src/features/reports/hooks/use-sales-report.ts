import { useQuery } from '@tanstack/react-query'
import { fetchSalesReport } from '@/features/reports/api/fetch-sales-report'

export function useSalesReport(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['report-sales', params],
    queryFn: () => fetchSalesReport(params),
  })
}
