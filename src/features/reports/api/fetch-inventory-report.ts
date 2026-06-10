import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { apiGet, buildTenantQuery } from '@/services/api/client'

export type InventoryReportData = {
  summary: {
    totalSkus: number
    totalValue: number
    lowStockCount: number
  }
  valuation: {
    id: string
    name: string
    sku: string | null
    type: string
    stock: number
    unitCost: number
    unitPrice: number
    value: number
    minimumStock: number
    isLow: boolean
  }[]
  movementSummary: { type: string; totalQty: number; count: number }[]
  movementDetail: {
    id: string
    productName: string
    type: string
    qty: number
    referenceType: string | null
    notes: string | null
    createdAt: string
  }[]
  lowStock: {
    id: string
    name: string
    stock: number
    minimumStock: number
    unitCost: number
    value: number
  }[]
}

export async function fetchInventoryReport(params?: { from?: string; to?: string }) {
  const query = buildTenantQuery({ tenantId: resolveTenantId() })
  if (params?.from) query.set('from', params.from)
  if (params?.to) query.set('to', params.to)
  const res = await apiGet<{ ok: true; data: InventoryReportData }>('/reports/inventory', query)
  return res.data
}
