import { useQuery } from '@tanstack/react-query'
import { fetchInventoryReport } from '@/features/reports/api/fetch-inventory-report'

export function useInventoryReport(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['report-inventory', params],
    queryFn: () => fetchInventoryReport(params),
  })
}
