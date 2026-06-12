import { DashboardAlertList } from '@/features/dashboard/components/dashboard-alert-list'
import { DashboardCarousel } from '@/features/dashboard/components/dashboard-carousel'
import { DashboardKpiGrid } from '@/features/dashboard/components/dashboard-kpi-grid'
import { DashboardMenuGrid } from '@/features/dashboard/components/dashboard-menu-grid'
import { RecentTransactions } from '@/features/dashboard/components/recent-transactions'
import { RevenueExpensePanel } from '@/features/dashboard/components/revenue-expense-panel'
import { getDashboardPreset } from '@/features/dashboard/config/dashboard-presets'

export function DashboardPage() {
  const preset = getDashboardPreset('atk_printing_combo')

  return (
    <div className="flex flex-col gap-6 pb-8">
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dashboard usaha</p>
        <h1 className="text-xl font-semibold">{preset.heroTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{preset.heroDescription}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {preset.quickActions.map((action) => (
            <span key={action} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {action}
            </span>
          ))}
        </div>
      </section>

      <DashboardCarousel />

      <div className="flex flex-col gap-8">
        <DashboardMenuGrid />

        <div className="flex flex-col gap-6">
          <DashboardKpiGrid />

          <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <RevenueExpensePanel />
            <DashboardAlertList />
          </section>

          <section className="grid gap-6">
            <RecentTransactions />
          </section>
        </div>
      </div>
    </div>
  )
}
