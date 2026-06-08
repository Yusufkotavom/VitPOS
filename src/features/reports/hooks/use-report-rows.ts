import { useQuery } from '@tanstack/react-query'

import { fetchReportRows } from '@/features/reports/api/fetch-report-rows'

export function useReportRows(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['report-rows', params],
    queryFn: () => fetchReportRows(params),
    placeholderData: [],
  })
}
