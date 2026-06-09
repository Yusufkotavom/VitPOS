import { buildBaimTenantQuery } from '@/lib/baim-runtime'
import { apiGet, buildTenantQuery } from '@/services/api/client'

export type ProfitLossData = {
  salesRevenue: number
  serviceRevenue: number
  totalRevenue: number
  salesOrderCount: number
  serviceOrderCount: number
  cogs: number
  grossProfit: number
  expenses: { category: string; total: number }[]
  totalExpenses: number
  otherIncome: number
  netProfit: number
  paymentBreakdown: { method: string; total: number; count: number }[]
}

export async function fetchProfitLoss(params?: { from?: string; to?: string }) {
  const query = buildTenantQuery(buildBaimTenantQuery())
  if (params?.from) query.set('from', params.from)
  if (params?.to) query.set('to', params.to)
  const res = await apiGet<{ ok: true; data: ProfitLossData }>('/reports/profit-loss', query)
  return res.data
}
