import { buildBaimTenantQuery } from '@/lib/baim-runtime'
import { apiGet, buildTenantQuery } from '@/services/api/client'

export type PaymentReportData = {
  summary: {
    totalCollected: number
    totalReceivable: number
    transactionCount: number
  }
  byMethod: { method: string; total: number; count: number }[]
  bySource: { source: string; total: number; count: number }[]
  dailyFlow: { date: string; method: string; total: number }[]
  aging: { current: number; days7: number; days30: number; days60: number; over60: number }
  receivables: {
    id: string
    orderNumber: string
    grandTotal: number
    paidTotal: number
    outstanding: number
    createdAt: string
  }[]
}

export async function fetchPaymentReport(params?: { from?: string; to?: string }) {
  const query = buildTenantQuery(buildBaimTenantQuery())
  if (params?.from) query.set('from', params.from)
  if (params?.to) query.set('to', params.to)
  const res = await apiGet<{ ok: true; data: PaymentReportData }>('/reports/payments', query)
  return res.data
}
