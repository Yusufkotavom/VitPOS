import { reportRows } from '@/features/reports/mocks/reports.mock'

export function ReportsSummaryCards() {
  const readyCount = reportRows.filter((report) => report.status === 'Siap Export').length
  const draftCount = reportRows.filter((report) => report.status === 'Draft').length

  return (
    <section className="grid gap-3 md:grid-cols-3">
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Laporan tersedia</p>
        <p className="mt-2 text-2xl font-semibold">{reportRows.length}</p>
      </article>
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Siap export</p>
        <p className="mt-2 text-2xl font-semibold">{readyCount}</p>
      </article>
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Draft</p>
        <p className="mt-2 text-2xl font-semibold">{draftCount}</p>
      </article>
    </section>
  )
}
