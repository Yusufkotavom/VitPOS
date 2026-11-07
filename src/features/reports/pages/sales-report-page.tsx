import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, FileSpreadsheet, ReceiptText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportSection, ReportMetricCard } from '@/features/reports/components/report-section'
import { ReportCorrelationNav } from '@/features/reports/components/report-correlation-nav'
import { useSalesReport } from '@/features/reports/hooks/use-sales-report'
import type { SalesReportTransaction } from '@/features/reports/api/fetch-sales-report'
import { DataTable } from '@/shared/components/data-table/data-table'
import { FilterToolbar } from '@/shared/components/data-table/filter-toolbar'
import { formatCurrency } from '@/lib/format-currency'
import { exportToCsv } from '@/shared/utils/export-csv'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useLiveQuery } from '@/shared/hooks/use-live-query'
import { dexieDb } from '@/services/local-db/dexie-instance'
import type { LocalSalesOrder, LocalSalesOrderItem, LocalServiceOrder } from '@/services/local-db/schema'
import { resolveTenantId } from '@/features/auth/stores/auth-store'

type TopProductRow = {
  id: string
  rank: number
  name: string
  totalQty: number
  totalRevenue: number
}

type DailySalesRow = {
  id: string
  date: string
  penjualan: number
  service: number
  total: number
}

function getPaymentBadgeTone(status: string) {
  if (status === 'paid' || status === 'Lunas') {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
  }
  if (status === 'partial' || status === 'Sebagian') {
    return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
  }
  return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
}

function getPaymentBadgeLabel(status: string) {
  if (status === 'paid' || status === 'Lunas') return 'Lunas'
  if (status === 'partial' || status === 'Sebagian') return 'Sebagian'
  return 'Belum Lunas'
}

export function SalesReportPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const params = useReportDateParams()
  const { data, isLoading } = useSalesReport(params)
  const tenantId = resolveTenantId()

  const [productSearch, setProductSearch] = useState('')
  const [dailySearch, setDailySearch] = useState('')
  const [txSearch, setTxSearch] = useState('')
  const [txTab, setTxTab] = useState<'all' | 'pos' | 'service'>('all')
  const [txStatusFilter, setTxStatusFilter] = useState('all')
  const [txMethodFilter, setTxMethodFilter] = useState('all')

  // Fallback to local Dexie orders if offline / server transactions empty
  const localOrders = useLiveQuery<LocalSalesOrder[], LocalSalesOrder[]>(
    async () => {
      if (!tenantId) return []
      const list = await dexieDb.salesOrders.where('tenantId').equals(tenantId).toArray()
      return list.filter((o: LocalSalesOrder) => {
        if (o.status === 'Batal') return false
        if (params.from && o.date < params.from) return false
        if (params.to && o.date > params.to) return false
        return true
      })
    },
    [tenantId, params.from, params.to],
    [],
  )

  const localServiceOrders = useLiveQuery<LocalServiceOrder[], LocalServiceOrder[]>(
    async () => {
      if (!tenantId) return []
      const list = await dexieDb.serviceOrders.where('tenantId').equals(tenantId).toArray()
      return list.filter((s: LocalServiceOrder) => {
        if (s.status === 'Batal') return false
        if (params.from && s.date < params.from) return false
        if (params.to && s.date > params.to) return false
        return true
      })
    },
    [tenantId, params.from, params.to],
    [],
  )

  const transactions: SalesReportTransaction[] = useMemo(() => {
    if (data?.transactions && data.transactions.length > 0) {
      return data.transactions
    }
    // Fallback mapping from local Dexie sales orders & service orders
    const ordersList: LocalSalesOrder[] = Array.isArray(localOrders) ? localOrders : []
    const posList: SalesReportTransaction[] = ordersList.map((o: LocalSalesOrder) => {
      const grandTotal = Number(o.grandTotal ?? 0)
      const paidTotal = Number(o.paidTotal ?? 0)
      const balanceDue = Math.max(0, grandTotal - paidTotal)
      let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid'
      if (paidTotal >= grandTotal && grandTotal > 0) {
        paymentStatus = 'paid'
      } else if (paidTotal > 0) {
        paymentStatus = 'partial'
      }

      const itemsSummary = (o.items ?? []).map((it: LocalSalesOrderItem) => `${it.name} (x${it.qty})`).join(', ')
      const itemCount = (o.items ?? []).reduce((s: number, it: LocalSalesOrderItem) => s + (Number(it.qty) || 0), 0)

      return {
        id: o.id,
        orderNumber: o.code || o.id,
        type: 'pos' as const,
        createdAt: o.date || new Date().toISOString(),
        customerName: o.customerName || 'Pelanggan Umum',
        status: o.status,
        paymentStatus,
        paymentMethod: 'tunai',
        itemCount,
        itemsSummary: itemsSummary || '-',
        subtotal: Number(o.subtotal ?? 0),
        discountTotal: Number(o.discountTotal ?? 0),
        taxTotal: Number(o.taxTotal ?? 0),
        grandTotal,
        paidTotal,
        balanceDue,
      }
    })

    const svcList: LocalServiceOrder[] = Array.isArray(localServiceOrders) ? localServiceOrders : []
    const serviceList: SalesReportTransaction[] = svcList.map((s: LocalServiceOrder) => {
      const grandTotal = Number(s.cost ?? 0)
      const paidTotal = Number(s.paidTotal ?? 0)
      const balanceDue = Math.max(0, grandTotal - paidTotal)
      let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid'
      if (paidTotal >= grandTotal && grandTotal > 0) {
        paymentStatus = 'paid'
      } else if (paidTotal > 0) {
        paymentStatus = 'partial'
      }

      const itemsSummary = (s.items && s.items.length > 0)
        ? s.items.map((it) => `${it.name} (x${it.qty})`).join(', ')
        : (s.description || 'Jasa Service')
      const itemCount = (s.items && s.items.length > 0)
        ? s.items.reduce((acc, it) => acc + (Number(it.qty) || 1), 0)
        : 1

      return {
        id: s.id,
        orderNumber: s.code || s.id,
        type: 'service' as const,
        createdAt: s.date || new Date().toISOString(),
        customerName: s.customerName || 'Pelanggan Umum',
        status: s.status,
        paymentStatus,
        paymentMethod: 'tunai',
        itemCount,
        itemsSummary,
        subtotal: grandTotal,
        discountTotal: 0,
        taxTotal: 0,
        grandTotal,
        paidTotal,
        balanceDue,
      }
    })

    return [...posList, ...serviceList].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [data?.transactions, localOrders, localServiceOrders])

  const trendData = (data?.dailySales ?? []).map((d) => {
    const svc = data?.dailyService.find((s) => s.date === d.date)
    return {
      date: d.date,
      penjualan: d.revenue,
      service: svc?.revenue ?? 0,
      total: d.revenue + (svc?.revenue ?? 0),
    }
  })

  const svcOnlyDates = (data?.dailyService ?? [])
    .filter((s) => !data?.dailySales.find((d) => d.date === s.date))
    .map((s) => ({ date: s.date, penjualan: 0, service: s.revenue, total: s.revenue }))

  const allTrend = [...trendData, ...svcOnlyDates].sort((a, b) => a.date.localeCompare(b.date))

  const topProductRows: TopProductRow[] = (data?.topProducts ?? []).map((p, i) => ({
    id: p.productId ?? p.name,
    rank: i + 1,
    name: p.name,
    totalQty: p.totalQty,
    totalRevenue: p.totalRevenue,
  }))

  const filteredProducts = productSearch
    ? topProductRows.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : topProductRows

  const dailySalesRows: DailySalesRow[] = allTrend.map((d) => ({
    id: d.date,
    date: d.date,
    penjualan: d.penjualan,
    service: d.service,
    total: d.total,
  }))

  const filteredDailySales = dailySearch
    ? dailySalesRows.filter((d) => d.date.includes(dailySearch))
    : dailySalesRows

  const txSummary = useMemo(() => {
    const pos = transactions.filter((t) => t.type !== 'service')
    const svc = transactions.filter((t) => t.type === 'service')
    return {
      allCount: transactions.length,
      allTotal: transactions.reduce((acc, t) => acc + t.grandTotal, 0),
      allPaid: transactions.reduce((acc, t) => acc + t.paidTotal, 0),
      allDue: transactions.reduce((acc, t) => acc + t.balanceDue, 0),
      posCount: pos.length,
      posTotal: pos.reduce((acc, t) => acc + t.grandTotal, 0),
      posPaid: pos.reduce((acc, t) => acc + t.paidTotal, 0),
      posDue: pos.reduce((acc, t) => acc + t.balanceDue, 0),
      svcCount: svc.length,
      svcTotal: svc.reduce((acc, t) => acc + t.grandTotal, 0),
      svcPaid: svc.reduce((acc, t) => acc + t.paidTotal, 0),
      svcDue: svc.reduce((acc, t) => acc + t.balanceDue, 0),
    }
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    const q = txSearch.toLowerCase().trim()
    return transactions.filter((tx) => {
      if (txTab === 'pos' && tx.type === 'service') return false
      if (txTab === 'service' && tx.type !== 'service') return false
      if (txStatusFilter !== 'all' && tx.paymentStatus !== txStatusFilter) return false
      if (txMethodFilter !== 'all' && !tx.paymentMethod.toLowerCase().includes(txMethodFilter.toLowerCase())) return false
      if (!q) return true
      return (
        tx.orderNumber.toLowerCase().includes(q) ||
        tx.customerName.toLowerCase().includes(q) ||
        tx.itemsSummary.toLowerCase().includes(q)
      )
    })
  }, [transactions, txTab, txSearch, txStatusFilter, txMethodFilter])

  function handleExportDaily() {
    if (!data) return
    const rows = allTrend.map((d) => ({
      id: d.date,
      tanggal: d.date,
      penjualan: d.penjualan,
      service: d.service,
      total: d.total,
    }))
    exportToCsv(`sales-daily-${params.from ?? 'awal'}-${params.to ?? 'akhir'}.csv`, [
      { key: 'tanggal', header: t('common.date') },
      { key: 'penjualan', header: t('reports.sales') },
      { key: 'service', header: 'Service' },
      { key: 'total', header: t('common.total') },
    ], rows)
  }

  function handleExportTransactions() {
    if (!filteredTransactions.length) return
    const rows = filteredTransactions.map((tx) => ({
      id: tx.id,
      tipe: tx.type === 'service' ? 'Service Order' : 'Penjualan POS',
      no_order: tx.orderNumber,
      tanggal: tx.createdAt.replace('T', ' ').slice(0, 19),
      pelanggan: tx.customerName,
      rincian_item: tx.itemsSummary,
      metode_bayar: tx.paymentMethod.toUpperCase(),
      status_bayar: getPaymentBadgeLabel(tx.paymentStatus),
      status_order: tx.status,
      subtotal: tx.subtotal,
      diskon: tx.discountTotal,
      pajak: tx.taxTotal,
      total: tx.grandTotal,
      terbayar: tx.paidTotal,
      sisa_tagihan: tx.balanceDue,
    }))
    exportToCsv(`daftar-transaksi-${txTab}-${params.from ?? 'awal'}-${params.to ?? 'akhir'}.csv`, [
      { key: 'tipe', header: 'Tipe Transaksi' },
      { key: 'no_order', header: 'No. Faktur / Service' },
      { key: 'tanggal', header: 'Tanggal & Jam' },
      { key: 'pelanggan', header: 'Pelanggan' },
      { key: 'rincian_item', header: 'Rincian Item / Pekerjaan' },
      { key: 'metode_bayar', header: 'Metode Pembayaran' },
      { key: 'status_bayar', header: 'Status Pembayaran' },
      { key: 'status_order', header: 'Status Order' },
      { key: 'subtotal', header: 'Subtotal' },
      { key: 'diskon', header: 'Diskon' },
      { key: 'pajak', header: 'Pajak' },
      { key: 'total', header: 'Total Nilai' },
      { key: 'terbayar', header: 'Total Terbayar' },
      { key: 'sisa_tagihan', header: 'Sisa Tagihan' },
    ], rows)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate('/reports')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{t('reports.sales_title')}</h1>
            <p className="text-sm text-muted-foreground">{t('reports.sales_description')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-11">
          <Button variant="outline" size="sm" onClick={handleExportTransactions} disabled={filteredTransactions.length === 0} className="h-8 text-xs">
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
            Export Transaksi CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportDaily} disabled={!data} className="h-8 text-xs">
            Export Penjualan Harian
          </Button>
        </div>
      </div>

      <ReportDateFilter />

      {/* Cross-report correlation navigation with date sync */}
      <ReportCorrelationNav
        links={[
          { to: '/reports/payments', label: 'Laporan Pembayaran', hint: 'Cek uang masuk & piutang' },
          { to: '/reports/profit-loss', label: 'Laba Rugi', hint: 'Cek laba kotor & HPP' },
          { to: '/reports/inventory', label: 'Stok & Inventori', hint: 'Cek persediaan barang' },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t('common.loading')}</p>
      ) : data ? (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <ReportMetricCard label={t('reports.total_omzet')} value={formatCurrency(data.summary.totalRevenue)} tone="positive" />
            <ReportMetricCard label={t('reports.total_orders')} value={String(data.summary.totalOrders)} />
            <ReportMetricCard label={t('reports.avg_order_value')} value={formatCurrency(data.summary.avgOrderValue)} />
            <ReportMetricCard label={t('reports.total_paid')} value={formatCurrency(data.summary.totalPaid)} />
          </div>

          {/* 1. Detail Transaksi Penjualan Section */}
          <ReportSection title="Daftar Transaksi Penjualan & Service">
            <p className="-mt-1 text-xs text-muted-foreground">
              Menampilkan {filteredTransactions.length} transaksi ({txTab === 'all' ? 'Semua' : txTab === 'pos' ? 'POS' : 'Service Order'}) pada periode terpilih.
            </p>

            <div className="flex flex-col gap-3">
              <Tabs value={txTab} onValueChange={(v) => setTxTab(v as 'all' | 'pos' | 'service')} className="w-full">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
                  <TabsTrigger value="all" className="gap-1.5 text-xs">
                    <span>Semua Transaksi</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">
                      {txSummary.allCount}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pos" className="gap-1.5 text-xs">
                    <span>Penjualan POS</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">
                      {txSummary.posCount}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="service" className="gap-1.5 text-xs">
                    <span>Service Order</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">
                      {txSummary.svcCount}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-wrap items-center gap-4 text-xs bg-muted/30 p-2.5 rounded-lg border">
                <div>
                  <span className="text-muted-foreground">Total Nilai ({txTab === 'all' ? 'Semua' : txTab === 'pos' ? 'POS' : 'Service'}): </span>
                  <span className="font-semibold text-sm">
                    {formatCurrency(txTab === 'all' ? txSummary.allTotal : txTab === 'pos' ? txSummary.posTotal : txSummary.svcTotal)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Terbayar: </span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(txTab === 'all' ? txSummary.allPaid : txTab === 'pos' ? txSummary.posPaid : txSummary.svcPaid)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sisa Piutang: </span>
                  <span className="font-semibold text-rose-600">
                    {formatCurrency(txTab === 'all' ? txSummary.allDue : txTab === 'pos' ? txSummary.posDue : txSummary.svcDue)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <FilterToolbar
                  placeholder="Cari no faktur/service, pelanggan, atau produk/jasa..."
                  searchQuery={txSearch}
                  onSearchChange={setTxSearch}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={txStatusFilter} onValueChange={setTxStatusFilter}>
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="Status Bayar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="paid">Lunas</SelectItem>
                    <SelectItem value="partial">Sebagian</SelectItem>
                    <SelectItem value="unpaid">Belum Lunas</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={txMethodFilter} onValueChange={setTxMethodFilter}>
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="Metode Bayar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Metode</SelectItem>
                    <SelectItem value="tunai">Tunai</SelectItem>
                    <SelectItem value="qris">QRIS</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="kartu">Kartu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DataTable<SalesReportTransaction>
              columns={[
                {
                  key: 'type',
                  header: 'Tipe',
                  render: (row) =>
                    row.type === 'service' ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300"
                      >
                        Service
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                      >
                        POS
                      </Badge>
                    ),
                },
                {
                  key: 'orderNumber',
                  header: 'No. Faktur / Service',
                  sortable: true,
                  render: (row) => (
                    <Link
                      to={row.type === 'service' ? `/service-orders/${row.id}` : `/sales-orders/${row.id}`}
                      className="font-medium text-primary hover:underline inline-flex items-center gap-1 group"
                      title="Lihat rincian"
                    >
                      <ReceiptText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                      <span>{row.orderNumber}</span>
                    </Link>
                  ),
                },
                {
                  key: 'createdAt',
                  header: 'Tanggal & Jam',
                  sortable: true,
                  render: (row) => (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {row.createdAt.replace('T', ' ').slice(0, 16)}
                    </span>
                  ),
                },
                {
                  key: 'customerName',
                  header: 'Pelanggan',
                  sortable: true,
                  render: (row) => (
                    <span className="text-sm font-medium">{row.customerName}</span>
                  ),
                },
                {
                  key: 'itemsSummary',
                  header: 'Rincian Item / Pekerjaan',
                  render: (row) => (
                    <div className="max-w-[260px] truncate" title={row.itemsSummary}>
                      <span className="text-xs text-muted-foreground">
                        {row.itemCount > 0 && (
                          <Badge variant="outline" className="mr-1.5 px-1 py-0 text-[10px] h-4">
                            {row.itemCount} item
                          </Badge>
                        )}
                        {row.itemsSummary}
                      </span>
                    </div>
                  ),
                },
                {
                  key: 'paymentMethod',
                  header: 'Metode',
                  render: (row) => (
                    <Badge variant="outline" className="text-[11px] capitalize">
                      {row.paymentMethod}
                    </Badge>
                  ),
                },
                {
                  key: 'paymentStatus',
                  header: 'Status Bayar',
                  render: (row) => (
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium border ${getPaymentBadgeTone(row.paymentStatus)}`}
                    >
                      {getPaymentBadgeLabel(row.paymentStatus)}
                    </Badge>
                  ),
                },
                {
                  key: 'grandTotal',
                  header: 'Total',
                  sortable: true,
                  render: (row) => (
                    <span className="font-semibold">{formatCurrency(row.grandTotal)}</span>
                  ),
                },
                {
                  key: 'balanceDue',
                  header: 'Sisa Tagihan',
                  sortable: true,
                  render: (row) => (
                    <span
                      className={`text-xs ${
                        row.balanceDue > 0 ? 'text-rose-600 font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {row.balanceDue > 0 ? formatCurrency(row.balanceDue) : 'Rp 0'}
                    </span>
                  ),
                },
                {
                  key: 'id',
                  header: 'Aksi',
                  render: (row) => (
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <Link
                        to={row.type === 'service' ? `/service-orders/${row.id}` : `/sales-orders/${row.id}`}
                        title="Buka Detail"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                      </Link>
                    </Button>
                  ),
                },
              ]}
              data={filteredTransactions}
              emptyTitle="Tidak ada transaksi pada tab/filter ini"
            />
          </ReportSection>

          {allTrend.length > 0 && (
            <ReportSection title={t('reports.revenue_trend')}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={allTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Area type="monotone" dataKey="penjualan" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} name={t('reports.sales')} />
                    <Area type="monotone" dataKey="service" stackId="1" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} name="Service" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ReportSection>
          )}

          {topProductRows.length > 0 && (
            <ReportSection title={t('reports.top_products')}>
              <FilterToolbar
                placeholder="Cari nama produk..."
                searchQuery={productSearch}
                onSearchChange={setProductSearch}
              />
              <DataTable<TopProductRow>
                columns={[
                  { key: 'rank', header: '#', sortable: true },
                  { key: 'name', header: t('reports.top_products_product'), sortable: true },
                  { key: 'totalQty', header: t('reports.top_products_qty'), sortable: true },
                  {
                    key: 'totalRevenue',
                    header: t('reports.top_products_revenue'),
                    sortable: true,
                    render: (row) => <span className="font-semibold">{formatCurrency(row.totalRevenue)}</span>,
                  },
                ]}
                data={filteredProducts}
                emptyTitle="Tidak ada produk ditemukan"
              />
            </ReportSection>
          )}

          {dailySalesRows.length > 0 && (
            <ReportSection title="Penjualan Harian">
              <FilterToolbar
                placeholder="Cari tanggal (contoh: 2026-11)..."
                searchQuery={dailySearch}
                onSearchChange={setDailySearch}
              />
              <DataTable<DailySalesRow>
                columns={[
                  { key: 'date', header: t('common.date'), sortable: true },
                  {
                    key: 'penjualan',
                    header: t('reports.sales'),
                    sortable: true,
                    render: (row) => formatCurrency(row.penjualan),
                  },
                  {
                    key: 'service',
                    header: 'Service',
                    sortable: true,
                    render: (row) => formatCurrency(row.service),
                  },
                  {
                    key: 'total',
                    header: t('common.total'),
                    sortable: true,
                    render: (row) => <span className="font-semibold">{formatCurrency(row.total)}</span>,
                  },
                ]}
                data={filteredDailySales}
                emptyTitle="Belum ada data penjualan harian"
              />
            </ReportSection>
          )}
        </>
      ) : null}
    </div>
  )
}
