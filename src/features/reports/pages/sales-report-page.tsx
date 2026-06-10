import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportSection, ReportMetricCard } from '@/features/reports/components/report-section'
import { useSalesReport } from '@/features/reports/hooks/use-sales-report'
import { formatCurrency } from '@/lib/format-currency'
import { exportToCsv } from '@/shared/utils/export-csv'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function SalesReportPage() {
  const navigate = useNavigate()
  const params = useReportDateParams()
  const { data, isLoading } = useSalesReport(params)

  const trendData = (data?.dailySales ?? []).map((d) => {
    const svc = data?.dailyService.find((s) => s.date === d.date)
    return {
      date: d.date,
      penjualan: d.revenue,
      service: svc?.revenue ?? 0,
      total: d.revenue + (svc?.revenue ?? 0),
    }
  })

  const svcOnlyDates = (data?.dailyService ?? []).filter(
    (s) => !data?.dailySales.find((d) => d.date === s.date)
  ).map((s) => ({ date: s.date, penjualan: 0, service: s.revenue, total: s.revenue }))

  const allTrend = [...trendData, ...svcOnlyDates].sort((a, b) => a.date.localeCompare(b.date))

  function handleExport() {
    if (!data) return
    const rows = allTrend.map((d) => ({
      id: d.date,
      tanggal: d.date,
      penjualan: d.penjualan,
      service: d.service,
      total: d.total,
    }))
    exportToCsv(`laporan-penjualan-${params.from ?? 'awal'}-${params.to ?? 'akhir'}.csv`, [
      { key: 'tanggal', header: 'Tanggal' },
      { key: 'penjualan', header: 'Penjualan' },
      { key: 'service', header: 'Service' },
      { key: 'total', header: 'Total' },
    ], rows)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Laporan Penjualan</h1>
          <p className="text-sm text-muted-foreground">Omzet harian, top produk, tren penjualan & service</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>Export CSV</Button>
        </div>
      </div>

      <ReportDateFilter />

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Memuat data...</p>
      ) : data ? (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <ReportMetricCard label="Total Omzet" value={formatCurrency(data.summary.totalRevenue)} tone="positive" />
            <ReportMetricCard label="Total Order" value={String(data.summary.totalOrders)} />
            <ReportMetricCard label="Rata-rata Order" value={formatCurrency(data.summary.avgOrderValue)} />
            <ReportMetricCard label="Total Dibayar" value={formatCurrency(data.summary.totalPaid)} />
          </div>

          {allTrend.length > 0 && (
            <ReportSection title="Tren Pendapatan">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={allTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Area type="monotone" dataKey="penjualan" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} name="Penjualan" />
                    <Area type="monotone" dataKey="service" stackId="1" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} name="Service" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ReportSection>
          )}

          {data.topProducts.length > 0 && (
            <ReportSection title="Top 20 Produk">
              <div className="overflow-x-auto">
                <Table className="w-full text-sm">
                  <TableHeader>
                    <TableRow className="border-b text-left text-muted-foreground">
                      <TableHead className="pb-2 font-medium">#</TableHead>
                      <TableHead className="pb-2 font-medium">Produk</TableHead>
                      <TableHead className="pb-2 font-medium text-right">Qty</TableHead>
                      <TableHead className="pb-2 font-medium text-right">Pendapatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topProducts.map((p, i) => (
                      <TableRow key={p.productId ?? i} className="border-b last:border-0">
                        <TableCell className="py-2 text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="py-2 font-medium">{p.name}</TableCell>
                        <TableCell className="py-2 text-right">{p.totalQty}</TableCell>
                        <TableCell className="py-2 text-right font-semibold">{formatCurrency(p.totalRevenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ReportSection>
          )}
        </>
      ) : null}
    </div>
  )
}
