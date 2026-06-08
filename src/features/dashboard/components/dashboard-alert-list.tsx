import { dashboardAlerts } from '@/features/dashboard/mocks/dashboard.mock'

export function DashboardAlertList() {
  return (
    <div className="grid gap-4">
      {dashboardAlerts.map((alert) => {
        const Icon = alert.icon

        return (
          <article key={alert.title} className="rounded-2xl border bg-background p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Icon className={alert.tone} />
              <div>
                <h2 className="text-lg font-semibold">{alert.title}</h2>
                <p className="text-sm text-muted-foreground">{alert.description}</p>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
