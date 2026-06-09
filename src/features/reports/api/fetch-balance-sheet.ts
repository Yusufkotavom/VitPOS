import { buildBaimTenantQuery } from '@/lib/baim-runtime'
import { apiGet, buildTenantQuery } from '@/services/api/client'

export type BalanceSheetData = {
  assets: {
    cashOnHand: number
    accountsReceivable: number
    inventoryValue: number
    inventoryDetail: { productId: string; stock: number; unitCost: number; value: number }[]
    totalAssets: number
  }
  liabilities: {
    accountsPayable: number
    totalLiabilities: number
  }
  equity: {
    retainedEarnings: number
    totalEquity: number
  }
  totalLiabilitiesAndEquity: number
}

export async function fetchBalanceSheet(params?: { from?: string; to?: string }) {
  const query = buildTenantQuery(buildBaimTenantQuery())
  if (params?.from) query.set('from', params.from)
  if (params?.to) query.set('to', params.to)
  const res = await apiGet<{ ok: true; data: BalanceSheetData }>('/reports/balance-sheet', query)
  return res.data
}
