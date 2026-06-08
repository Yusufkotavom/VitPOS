import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-stats'

export function RecentTransactions() {
  const { dashboardTransactions } = useDashboardStats()

  return (
    <article className="rounded-2xl border bg-background p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Transaksi Terbaru</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border">
        {dashboardTransactions.map((transaction) => (
          <div key={transaction.code} className="flex flex-col gap-2 border-b p-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">{transaction.code}</p>
              <p className="text-sm text-muted-foreground">{transaction.customer}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{transaction.total}</p>
              <p className="text-sm text-muted-foreground">{transaction.status}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}
