import { dashboardStats } from '@/features/dashboard/mocks/dashboard.mock'

export function DashboardKpiGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {dashboardStats.map((stat) => (
        <article key={stat.label} className="rounded-2xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <p className={`mt-3 text-2xl font-semibold ${stat.tone}`}>{stat.value}</p>
        </article>
      ))}
    </section>
  )
}
