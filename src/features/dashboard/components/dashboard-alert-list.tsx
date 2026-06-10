import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-stats'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function DashboardAlertList() {
  const { dashboardAlerts } = useDashboardStats()

  return (
    <div className="grid gap-4">
      {dashboardAlerts.map((alert) => {
        const Icon = alert.icon

        return (
          <Card key={alert.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4 py-4">
              <div className="rounded-full bg-muted/50 p-2.5">
                <Icon className={`size-5 ${alert.tone}`} />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-base">{alert.title}</CardTitle>
                <CardDescription className="mt-0.5">{alert.description}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}
