import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportSection, ReportMetricCard } from '@/features/reports/components/report-section'
import { usePaymentReport } from '@/features/reports/hooks/use-payment-report'
import { formatCurrency } from '@/lib/format-currency'
import { exportToCsv } from '@/shared/utils/export-csv'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const METHOD_COLORS: Record<string, string> = {
  cash: '#22c55e',
  qris: '#3b82f6',
  card: '#f59e0b',
  transfer: '#8b5cf6',
  ewallet: '#ec4899',
  receivable: '#ef4444',
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  card: 'Kartu',
  transfer: 'Transfer',
  ewallet: 'E-Wallet',
  receivable: 'Piutang',
}

export function PaymentReportPage() {
  const navigate = useNavigate()
  const params = useReportDateParams()
  const { data, isLoading } = usePaymentReport(params)

  const pieData = (data?.byMethod ?? []).map((m) => ({
    name: METHOD_LABELS[m.method] ?? m.method,
    value: m.total,
  }))

  const barData = (data?.dailyFlow ?? []).reduce<{ date: string; [k: string]: string | number }[]>((acc, d) => {
    const existing = acc.find((r) => r.date === d.date)
    if (existing) {
      existing[d.method] = d.total
    } else {
      acc.push({ date: d.date, [d.method]: d.total })
    }
    return acc
  }, [])

  function handleExport() {
    if (!data) return
    const rows = data.byMethod.map((m) => ({
      id: m.method,
      metode: METHOD_LABELS[m.method] ?? m.method,
      total: m.total,
      jumlah: m.count,
    }))
    exportToCsv(`laporan-pembayaran-${params.from ?? 'awal'}-${params.to ?? 'akhir'}.csv`, [
      { key: 'metode', header: 'Metode' },
      { key: 'total', header: 'Total' },
      { key: 'jumlah', header: 'Jumlah Transaksi' },
    ], rows)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Laporan Pembayaran</h1>
          <p className="text-sm text-muted-foreground">Breakdown metode bayar, cash flow, dan piutang</p>
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
          <div className="grid gap-3 md:grid-cols-3">
            <ReportMetricCard label="Total Diterima" value={formatCurrency(data.summary.totalCollected)} tone="positive" />
            <ReportMetricCard label="Piutang Outstanding" value={formatCurrency(data.summary.totalReceivable)} tone="negative" />
            <ReportMetricCard label="Jumlah Transaksi" value={String(data.summary.transactionCount)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {pieData.length > 0 && (
              <ReportSection title="Metode Pembayaran">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {pieData.map((_entry, i) => (
                          <Cell key={i} fill={Object.values(METHOD_COLORS)[i % Object.values(METHOD_COLORS).length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ReportSection>
            )}

            {barData.length > 0 && (
              <ReportSection title="Cash Flow Harian">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                      {Object.keys(METHOD_COLORS).map((method) => (
                        <Bar key={method} dataKey={method} stackId="a" fill={METHOD_COLORS[method]} name={METHOD_LABELS[method] ?? method} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ReportSection>
            )}
          </div>

          <ReportSection title="Breakdown Metode">
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="border-b text-left text-muted-foreground">
                    <TableHead className="pb-2 font-medium">Metode</TableHead>
                    <TableHead className="pb-2 font-medium text-right">Total</TableHead>
                    <TableHead className="pb-2 font-medium text-right">Transaksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byMethod.map((m) => (
                    <TableRow key={m.method} className="border-b last:border-0">
                      <TableCell className="py-2">
                        <Badge variant="outline" className="capitalize">{METHOD_LABELS[m.method] ?? m.method}</Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right font-semibold">{formatCurrency(m.total)}</TableCell>
                      <TableCell className="py-2 text-right">{m.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ReportSection>

          {data.receivables.length > 0 && (
            <ReportSection title="Piutang Outstanding">
              <div className="grid gap-3 mb-3 md:grid-cols-4">
                <ReportMetricCard label="0-7 hari" value={formatCurrency(data.aging.current)} />
                <ReportMetricCard label="8-30 hari" value={formatCurrency(data.aging.days7)} />
                <ReportMetricCard label="31-60 hari" value={formatCurrency(data.aging.days30)} />
                <ReportMetricCard label="> 60 hari" value={formatCurrency(data.aging.over60)} tone="negative" />
              </div>
              <div className="overflow-x-auto">
                <Table className="w-full text-sm">
                  <TableHeader>
                    <TableRow className="border-b text-left text-muted-foreground">
                      <TableHead className="pb-2 font-medium">No. Order</TableHead>
                      <TableHead className="pb-2 font-medium text-right">Total</TableHead>
                      <TableHead className="pb-2 font-medium text-right">Dibayar</TableHead>
                      <TableHead className="pb-2 font-medium text-right">Sisa</TableHead>
                      <TableHead className="pb-2 font-medium text-right">Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.receivables.map((r) => (
                      <TableRow key={r.id} className="border-b last:border-0">
                        <TableCell className="py-2 font-medium">{r.orderNumber}</TableCell>
                        <TableCell className="py-2 text-right">{formatCurrency(r.grandTotal)}</TableCell>
                        <TableCell className="py-2 text-right">{formatCurrency(r.paidTotal)}</TableCell>
                        <TableCell className="py-2 text-right font-semibold text-red-600">{formatCurrency(r.outstanding)}</TableCell>
                        <TableCell className="py-2 text-right text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('id-ID')}</TableCell>
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
