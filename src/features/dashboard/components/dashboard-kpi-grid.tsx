import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DashboardKpiGrid() {
  const { dashboardStats } = useDashboardStats()

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {dashboardStats.map((stat) => (
        <Card key={stat.label} className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.tone}`}>{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
