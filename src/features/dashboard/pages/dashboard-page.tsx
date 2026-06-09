import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/date'
import { DashboardAlertList } from '@/features/dashboard/components/dashboard-alert-list'
import { DashboardKpiGrid } from '@/features/dashboard/components/dashboard-kpi-grid'
import { QuickActions } from '@/features/dashboard/components/quick-actions'
import { RecentTransactions } from '@/features/dashboard/components/recent-transactions'
import { RevenueExpensePanel } from '@/features/dashboard/components/revenue-expense-panel'
import { DashboardCarousel } from '@/features/dashboard/components/dashboard-carousel'
import { PageShell } from '@/shared/components/layout/page-shell'

export function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      description={`Ringkasan bisnis per ${formatDate('2026-06-08')}`}
      actions={
        <>
          <Button variant="outline">Cabang Utama</Button>
          <Button>Buka POS</Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <DashboardCarousel />

        <QuickActions />

        <DashboardKpiGrid />

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <RevenueExpensePanel />
          <DashboardAlertList />
        </section>

        <section className="grid gap-6">
          <RecentTransactions />
        </section>
      </div>
    </PageShell>
  )
}
