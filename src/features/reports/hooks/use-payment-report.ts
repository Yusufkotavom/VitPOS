import { useQuery } from '@tanstack/react-query'
import { fetchPaymentReport } from '@/features/reports/api/fetch-payment-report'

export function usePaymentReport(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['report-payments', params],
    queryFn: () => fetchPaymentReport(params),
  })
}
