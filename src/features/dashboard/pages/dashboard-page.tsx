import { DashboardAlertList } from '@/features/dashboard/components/dashboard-alert-list'
import { DashboardKpiGrid } from '@/features/dashboard/components/dashboard-kpi-grid'
import { RecentTransactions } from '@/features/dashboard/components/recent-transactions'
import { RevenueExpensePanel } from '@/features/dashboard/components/revenue-expense-panel'
import { DashboardMenuGrid } from '@/features/dashboard/components/dashboard-menu-grid'
import { DashboardCarousel } from '@/features/dashboard/components/dashboard-carousel'

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
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
