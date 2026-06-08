import { useState } from 'react'
import { LayoutGrid, List, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
  const [view, setView] = useState<'list' | 'card'>('list')
  const [search, setSearch] = useState('')

  const filtered = cash.filter(row =>
    !search || [row.ref, row.account, row.category, row.date].some(f => f.toLowerCase().includes(search.toLowerCase()))
  )

  const totalIncome = cash.reduce((sum, row) => sum + row.income, 0)
  const totalExpense = cash.reduce((sum, row) => sum + row.expense, 0)
  const balance = totalIncome - totalExpense

  return (
    <PageShell title="Kas & Bank" description="Pemasukan, pengeluaran, dan mutasi kas." actions={<CashCrudActions />}>
      <section className="grid gap-3 md:grid-cols-3 mb-6">
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
        <div className="mb-4 flex flex-row items-center gap-2 border-b pb-4">
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="relative flex items-center group shrink-0">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>
            <div className="absolute top-full right-0 mt-2 hidden group-hover:flex flex-col gap-2 rounded-md border bg-popover p-2 shadow-md z-10 w-48">
              <select className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Akun</option>
                <option value="Kas">Kas</option>
                <option value="Bank">Bank</option>
              </select>
              <select className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Kategori</option>
              </select>
              <select className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="20">20 / halaman</option>
                <option value="50">50 / halaman</option>
                <option value="100">100 / halaman</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1 shrink-0">
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('list')}
              className="h-7 w-7"
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'card' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('card')}
              className="h-7 w-7"
              title="Card View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {view === 'list' ? (
          <DataTable
            data={filtered}
            columns={[
              { key: 'ref', header: 'Ref', sortable: true },
              { key: 'date', header: 'Tanggal', sortable: true },
              { key: 'account', header: 'Akun', sortable: true },
              { key: 'category', header: 'Kategori', sortable: true },
              { key: 'income', header: 'Masuk', render: (row) => row.income > 0 ? <span className="font-medium text-emerald-600">{formatCurrency(row.income)}</span> : '-' },
              { key: 'expense', header: 'Keluar', render: (row) => row.expense > 0 ? <span className="font-medium text-rose-600">{formatCurrency(row.expense)}</span> : '-' },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
              { key: 'actions', header: 'Aksi', render: (row) => <CashCrudActions cash={row} /> },
            ]}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 col-span-full">Belum ada transaksi</p>
            ) : (
              filtered.map((row) => (
                <div key={row.id} className="rounded-2xl border bg-background p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-medium">{row.ref}</p>
                      <p className="text-sm text-muted-foreground">{row.account} · {row.category}</p>
                    </div>
                    <StatusBadge label={row.status} tone={tone(row.status)} />
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    {row.income > 0 ? <span className="font-medium text-emerald-600">Masuk {formatCurrency(row.income)}</span> : null}
                    {row.expense > 0 ? <span className="font-medium text-rose-600">Keluar {formatCurrency(row.expense)}</span> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{row.date}</p>
                  <div className="mt-3 pt-3 border-t">
                    <CashCrudActions cash={row} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </ContentCard>
    </PageShell>
  )
}
