import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { apiGet, buildTenantQuery } from '@/services/api/client'

export type ReportRow = {
  id: string
  name: string
  period: string
  summary: string
  value: string
  updatedAt: string
  status: string
}

type ReportSummaryResponse = {
  ok: true
  summary: {
    orderCount: number
    grossSales: string
    paidTotal: string
  }
}

type PaymentSummaryResponse = {
  ok: true
  items: Array<{
    method: string
    total: string
    count: number
  }>
}

type InventoryMovementResponse = {
  ok: true
  items: Array<{
    type: string
    totalQty: string
    count: number
  }>
}

export async function fetchReportRows(params?: { from?: string; to?: string }) {
  const query = buildTenantQuery({ tenantId: resolveTenantId() })
  if (params?.from) query.set('from', params.from)
  if (params?.to) query.set('to', params.to)

  const [sales, payments, inventory] = await Promise.all([
    apiGet<ReportSummaryResponse>('/reports/sales/summary', query),
    apiGet<PaymentSummaryResponse>('/reports/payments/summary', query),
    apiGet<InventoryMovementResponse>('/reports/inventory/movements', query),
  ])

  return [
    {
      id: 'sales-summary',
      name: 'Ringkasan Penjualan',
      period: 'Live',
      summary: `${sales.summary.orderCount} order tercatat`,
      value: `Rp ${sales.summary.grossSales}`,
      updatedAt: 'Sinkron API',
      status: 'Siap Export',
    },
    {
      id: 'payment-summary',
      name: 'Metode Pembayaran',
      period: 'Live',
      summary: `${payments.items.length} metode aktif`,
      value: `Rp ${payments.items[0]?.total ?? '0'}`,
      updatedAt: 'Sinkron API',
      status: 'Siap Export',
    },
    {
      id: 'inventory-summary',
      name: 'Pergerakan Stok',
      period: 'Live',
      summary: `${inventory.items.length} tipe pergerakan`,
      value: inventory.items[0]?.totalQty ?? '0',
      updatedAt: 'Sinkron API',
      status: inventory.items.length > 0 ? 'Siap Export' : 'Draft',
    },
  ] satisfies ReportRow[]
}
