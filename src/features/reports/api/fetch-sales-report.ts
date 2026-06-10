import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { apiGet, buildTenantQuery } from '@/services/api/client'

export type SalesReportData = {
  summary: {
    totalRevenue: number
    salesRevenue: number
    serviceRevenue: number
    totalOrders: number
    salesOrders: number
    serviceOrders: number
    totalPaid: number
    avgOrderValue: number
  }
  dailySales: { date: string; orderCount: number; revenue: number; paid: number }[]
  dailyService: { date: string; orderCount: number; revenue: number }[]
  topProducts: { productId: string | null; name: string; totalQty: number; totalRevenue: number }[]
}

export async function fetchSalesReport(params?: { from?: string; to?: string }) {
  const query = buildTenantQuery({ tenantId: resolveTenantId() })
  if (params?.from) query.set('from', params.from)
  if (params?.to) query.set('to', params.to)
  const res = await apiGet<{ ok: true; data: SalesReportData }>('/reports/sales', query)
  return res.data
}
