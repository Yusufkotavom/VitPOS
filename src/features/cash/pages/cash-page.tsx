import { formatCurrency } from '@/lib/format-currency'
import { CashCrudActions } from '@/features/cash/components/cash-crud-actions'
import { useCash } from '@/features/cash/hooks/use-cash'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Tercatat') return 'success'
  if (status === 'Pending Sinkron') return 'info'
  return 'warning'
}

export function CashPage() {
  const cash = useCash()

  const totalIncome = cash.reduce((sum, row) => sum + row.income, 0)
  const totalExpense = cash.reduce((sum, row) => sum + row.expense, 0)
  const balance = totalIncome - totalExpense

  return (
    <PageShell title="Kas & Bank" description="Pemasukan, pengeluaran, kategori kas, metode bayar, dan mutasi." actions={<CashCrudActions />}>
      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total masuk</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatCurrency(totalIncome)}</p>
        </article>
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total keluar</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600">{formatCurrency(totalExpense)}</p>
        </article>
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Saldo bersih</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(balance)}</p>
        </article>
      </section>
      <ContentCard title="Mutasi Kas" description="Catat pemasukan dan pengeluaran manual bisnis.">
        <DataTable
          data={cash}
          columns={[
            { key: 'ref', header: 'Ref' },
            { key: 'date', header: 'Tanggal' },
            { key: 'account', header: 'Akun Kas' },
            { key: 'category', header: 'Kategori' },
            { key: 'income', header: 'Masuk', render: (row) => row.income > 0 ? formatCurrency(row.income) : '-' },
            { key: 'expense', header: 'Keluar', render: (row) => row.expense > 0 ? formatCurrency(row.expense) : '-' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
            { key: 'actions', header: 'Aksi', render: (row) => <CashCrudActions cash={row} /> },
          ]}
          mobileRender={(row) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.ref}</p>
                  <p className="text-sm text-muted-foreground">{row.account} · {row.category}</p>
                </div>
                <StatusBadge label={row.status} tone={tone(row.status)} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Masuk {row.income > 0 ? formatCurrency(row.income) : '-'}</span>
                <span>Keluar {row.expense > 0 ? formatCurrency(row.expense) : '-'}</span>
              </div>
              <CashCrudActions cash={row} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
