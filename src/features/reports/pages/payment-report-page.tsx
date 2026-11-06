import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportSection, ReportMetricCard } from '@/features/reports/components/report-section'
import { ReportCorrelationNav } from '@/features/reports/components/report-correlation-nav'
import { usePaymentReport } from '@/features/reports/hooks/use-payment-report'
import { DataTable } from '@/shared/components/data-table/data-table'
import { FilterToolbar } from '@/shared/components/data-table/filter-toolbar'
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

type ReceivableRow = {
  id: string
  orderNumber: string
  grandTotal: number
  paidTotal: number
  outstanding: number
  createdAt: string
  dateFormatted: string
}

type PaymentMethodRow = {
  id: string
  method: string
  label: string
  total: number
  count: number
}

export function PaymentReportPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const params = useReportDateParams()
  const { data, isLoading } = usePaymentReport(params)
  const [receivableSearch, setReceivableSearch] = useState('')
  const receivableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchParams.get('tab') === 'receivables' && receivableRef.current && data) {
      const timer = setTimeout(() => {
        receivableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchParams, data])

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

  const methodRows: PaymentMethodRow[] = (data?.byMethod ?? []).map((m) => ({
    id: m.method,
    method: m.method,
    label: METHOD_LABELS[m.method] ?? m.method,
    total: m.total,
    count: m.count,
  }))

  const receivableRows: ReceivableRow[] = (data?.receivables ?? []).map((r) => ({
    ...r,
    dateFormatted: new Date(r.createdAt).toLocaleDateString('id-ID'),
  }))

  const filteredReceivables = receivableRows.filter((r) => {
    if (!receivableSearch) return true
    return r.orderNumber.toLowerCase().includes(receivableSearch.toLowerCase())
  })

  function handleExport() {
    if (!data) return
    const rows = data.byMethod.map((m) => ({
      id: m.method,
      metode: METHOD_LABELS[m.method] ?? m.method,
      total: m.total,
      jumlah: m.count,
    }))
    exportToCsv(`${t('reports.payment_title')}-${params.from ?? 'awal'}-${params.to ?? 'akhir'}.csv`, [
      { key: 'metode', header: t('common.method') },
      { key: 'total', header: t('common.total') },
      { key: 'jumlah', header: t('reports.transaction_count') },
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
            <h1 className="text-xl font-semibold">{t('reports.payment_title')}</h1>
            <p className="text-sm text-muted-foreground">{t('reports.payment_description')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-11">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
            {t('common.export')} CSV
          </Button>
        </div>
      </div>

      <ReportDateFilter />

      {/* Cross-report correlation navigation with date sync */}
      <ReportCorrelationNav
        links={[
          { to: '/reports/sales', label: 'Laporan Penjualan', hint: 'Cek omzet & total penjualan' },
          { to: '/reports/profit-loss', label: 'Laba Rugi', hint: 'Cek pendapatan vs beban' },
          { to: '/reports/balance-sheet', label: 'Neraca', hint: 'Cek saldo kas & piutang usaha' },
          { to: '/reports/general-ledger', label: 'Buku Besar', hint: 'Detail jurnal kas' },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t('common.loading')}</p>
      ) : data ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <ReportMetricCard label={t('reports.total_received')} value={formatCurrency(data.summary.totalCollected)} tone="positive" />
            <ReportMetricCard label={t('reports.receivable_outstanding')} value={formatCurrency(data.summary.totalReceivable)} tone="negative" />
            <ReportMetricCard label={t('reports.transaction_count')} value={String(data.summary.transactionCount)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {pieData.length > 0 && (
              <ReportSection title={t('reports.payment_method')}>
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
              <ReportSection title={t('reports.daily_cash_flow')}>
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

          <ReportSection title={t('reports.method_breakdown')}>
            <DataTable<PaymentMethodRow>
              columns={[
                {
                  key: 'label',
                  header: t('reports.method'),
                  sortable: true,
                  render: (row) => (
                    <Badge variant="outline" className="capitalize">
                      {row.label}
                    </Badge>
                  ),
                },
                {
                  key: 'total',
                  header: t('common.total'),
                  sortable: true,
                  render: (row) => <span className="font-semibold">{formatCurrency(row.total)}</span>,
                },
                {
                  key: 'count',
                  header: t('reports.payment_transactions'),
                  sortable: true,
                },
              ]}
              data={methodRows}
              emptyTitle="Belum ada transaksi pembayaran"
            />
          </ReportSection>

          {data.receivables.length > 0 && (
            <div ref={receivableRef}>
              <ReportSection title={t('reports.receivable_section')}>
                <div className="grid gap-3 mb-3 md:grid-cols-5">
                  <ReportMetricCard label={t('reports.aging_days_0_7')} value={formatCurrency(data.aging.current)} />
                  <ReportMetricCard label={t('reports.aging_days_8_30')} value={formatCurrency(data.aging.days7)} />
                  <ReportMetricCard label={t('reports.aging_days_31_60')} value={formatCurrency(data.aging.days30)} />
                  <ReportMetricCard label="61-90 Hari" value={formatCurrency(data.aging.days60)} />
                  <ReportMetricCard label={t('reports.aging_over_60')} value={formatCurrency(data.aging.over60)} tone="negative" />
                </div>
                <FilterToolbar
                  placeholder="Cari nomor order..."
                  searchQuery={receivableSearch}
                  onSearchChange={setReceivableSearch}
                />
                <DataTable<ReceivableRow>
                  columns={[
                    { key: 'orderNumber', header: t('reports.order_number'), sortable: true },
                    {
                      key: 'grandTotal',
                      header: t('common.total'),
                      sortable: true,
                      render: (row) => formatCurrency(row.grandTotal),
                    },
                    {
                      key: 'paidTotal',
                      header: t('reports.receivable_paid'),
                      sortable: true,
                      render: (row) => formatCurrency(row.paidTotal),
                    },
                    {
                      key: 'outstanding',
                      header: t('reports.receivable_remaining'),
                      sortable: true,
                      render: (row) => <span className="font-semibold text-red-600">{formatCurrency(row.outstanding)}</span>,
                    },
                    {
                      key: 'dateFormatted',
                      header: t('common.date'),
                      sortable: true,
                    },
                  ]}
                  data={filteredReceivables}
                  emptyTitle="Tidak ada piutang ditemukan"
                />
              </ReportSection>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
