import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportSection, ReportMetricCard } from '@/features/reports/components/report-section'
import { ReportCorrelationNav } from '@/features/reports/components/report-correlation-nav'
import { useSalesReport } from '@/features/reports/hooks/use-sales-report'
import { DataTable } from '@/shared/components/data-table/data-table'
import { FilterToolbar } from '@/shared/components/data-table/filter-toolbar'
import { formatCurrency } from '@/lib/format-currency'
import { exportToCsv } from '@/shared/utils/export-csv'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

export function SalesReportPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const params = useReportDateParams()
  const { data, isLoading } = useSalesReport(params)
  const [productSearch, setProductSearch] = useState('')
  const [dailySearch, setDailySearch] = useState('')

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

  function handleExport() {
    if (!data) return
    const rows = allTrend.map((d) => ({
      id: d.date,
      tanggal: d.date,
      penjualan: d.penjualan,
      service: d.service,
      total: d.total,
    }))
    exportToCsv(`sales-report-${params.from ?? 'awal'}-${params.to ?? 'akhir'}.csv`, [
      { key: 'tanggal', header: t('common.date') },
      { key: 'penjualan', header: t('reports.sales') },
      { key: 'service', header: 'Service' },
      { key: 'total', header: t('common.total') },
    ], rows)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{t('reports.sales_title')}</h1>
          <p className="text-sm text-muted-foreground">{t('reports.sales_description')}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>
            {t('common.export')} CSV
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
