import { dashboardChart } from '@/features/dashboard/mocks/dashboard.mock'

export function RevenueExpensePanel() {
  const Icon = dashboardChart.icon

  return (
    <article className="rounded-2xl border bg-background p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Icon className="text-primary" />
        <div>
          <h2 className="text-lg font-semibold">{dashboardChart.title}</h2>
          <p className="text-sm text-muted-foreground">{dashboardChart.description}</p>
        </div>
      </div>
      <div className="mt-6 grid h-64 place-items-center rounded-2xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
        Area chart dashboard
      </div>
    </article>
  )
}
