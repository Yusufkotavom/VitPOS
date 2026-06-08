import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ReportsSummaryCards } from '@/features/reports/components/reports-summary-cards'
import { useReportRows } from '@/features/reports/hooks/use-report-rows'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'
import { exportToCsv } from '@/shared/utils/export-csv'

function tone(status: string) {
  if (status === 'Siap Export') return 'success'
  if (status === 'Draft') return 'warning'
  return 'neutral'
}

function updateDateParam(searchParams: URLSearchParams, key: 'from' | 'to', value: string) {
  const next = new URLSearchParams(searchParams)
  if (value) next.set(key, value)
  else next.delete(key)
  return next
}

export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const { data: reportRows = [] } = useReportRows({ from, to })

  const exportCsv = () => {
    exportToCsv(
      `laporan-${from || 'awal'}-${to || 'akhir'}.csv`,
      [
        { key: 'name', header: 'Laporan' },
        { key: 'period', header: 'Periode' },
        { key: 'summary', header: 'Ringkasan' },
        { key: 'value', header: 'Nilai' },
        { key: 'updatedAt', header: 'Update Terakhir' },
        { key: 'status', header: 'Status' },
      ],
      reportRows
    )
  }

  return (
    <PageShell
      title="Laporan"
      description="Keuangan, laba rugi, arus kas, persediaan, penjualan, piutang, dan hutang."
      actions={<Button onClick={exportCsv}>Export CSV</Button>}
    >
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="space-y-1.5 text-sm font-medium">
          Dari Tanggal
          <Input
            type="date"
            value={from}
            onChange={(event) => setSearchParams(updateDateParam(searchParams, 'from', event.target.value))}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Sampai Tanggal
          <Input
            type="date"
            value={to}
            onChange={(event) => setSearchParams(updateDateParam(searchParams, 'to', event.target.value))}
          />
        </label>
        <Button variant="outline" onClick={() => setSearchParams(new URLSearchParams())} disabled={!from && !to}>
          Reset Filter
        </Button>
      </div>
      <ReportsSummaryCards reports={reportRows} />
      <ContentCard title="Dashboard Laporan" description="Summary cards dan daftar laporan siap export CSV.">
        <DataTable
          data={reportRows}
          columns={[
            { key: 'name', header: 'Laporan' },
            { key: 'period', header: 'Periode' },
            { key: 'summary', header: 'Ringkasan' },
            { key: 'value', header: 'Nilai' },
            { key: 'updatedAt', header: 'Update Terakhir' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
          ]}
          mobileRender={(row) => (
            <div className="space-y-2">
              <p className="font-medium">{row.name}</p>
              <p className="text-sm text-muted-foreground">{row.period} · {row.updatedAt}</p>
              <p className="text-sm">{row.summary}</p>
              <div className="flex items-center justify-between"><span className="font-semibold">{row.value}</span><StatusBadge label={row.status} tone={tone(row.status)} /></div>
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
