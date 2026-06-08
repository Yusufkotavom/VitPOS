import { Button } from '@/components/ui/button'
import { reportRows } from '@/features/reports/mocks/reports.mock'
import { ReportsSummaryCards } from '@/features/reports/components/reports-summary-cards'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Siap Export') return 'success'
  if (status === 'Draft') return 'warning'
  return 'neutral'
}

export function ReportsPage() {
  return (
    <PageShell title="Laporan" description="Keuangan, laba rugi, arus kas, persediaan, penjualan, piutang, dan hutang." actions={<Button>Export PDF</Button>}>
      <ReportsSummaryCards />
      <ContentCard title="Dashboard Laporan" description="Summary cards dan daftar laporan siap export.">
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
