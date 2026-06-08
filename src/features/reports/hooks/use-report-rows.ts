import { useQuery } from '@tanstack/react-query'

import { fetchReportRows } from '@/features/reports/api/fetch-report-rows'
import { reportRows } from '@/features/reports/mocks/reports.mock'

export function useReportRows() {
  return useQuery({
    queryKey: ['report-rows'],
    queryFn: fetchReportRows,
    placeholderData: reportRows,
  })
}
