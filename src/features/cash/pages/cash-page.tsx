import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, List, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/format-currency'
import { CashCrudActions } from '@/features/cash/components/cash-crud-actions'
import { useCash } from '@/features/cash/hooks/use-cash'
import { useCashCategories } from '@/features/cash/hooks/use-cash-categories'
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
  const categories = useCashCategories()
  const [view, setView] = useState<'list' | 'card'>('list')
  const [search, setSearch] = useState('')
  const [filterAccount, setFilterAccount] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [pageSize, setPageSize] = useState('20')
  const { t } = useTranslation()

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name ?? id

  const filtered = cash.filter(row => {
    if (search && ![row.ref, row.account, getCategoryName(row.category), row.date].some(f => f.toLowerCase().includes(search.toLowerCase()))) return false
    if (filterAccount !== 'all' && row.account !== filterAccount) return false
    if (filterCategory !== 'all' && row.category !== filterCategory) return false
    return true
  })

  const paginated = filtered.slice(0, parseInt(pageSize))

  let totalIncome = 0
  let totalExpense = 0
  for (const row of cash) {
    totalIncome += row.income
    totalExpense += row.expense
  }
  const balance = totalIncome - totalExpense

  return (
    <PageShell title={t('nav.cash_bank')} description={t('cash.description')} actions={<CashCrudActions />}>
      <section className="grid gap-3 md:grid-cols-3 mb-6">
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{t('cash.income')}</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatCurrency(totalIncome)}</p>
        </article>
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{t('cash.expense')}</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600">{formatCurrency(totalExpense)}</p>
        </article>
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Saldo bersih</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(balance)}</p>
        </article>
      </section>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/cash/categories">Kategori Kas</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/cash/payment-methods">Metode Pembayaran</Link>
        </Button>
      </div>
      <ContentCard title={t('cash.transactions')} description={t('cash.description')}>
        <div className="mb-4 flex flex-row items-center gap-2 border-b pb-4">
          <input
            type="text"
            placeholder={t('common.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="relative flex items-center group shrink-0">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>
            <div className="absolute top-full right-0 mt-2 hidden group-hover:flex flex-col gap-2 rounded-md border bg-popover p-2 shadow-md z-10 w-48">
              <Select value={filterAccount} onValueChange={setFilterAccount}>
                <SelectTrigger>
                  <SelectValue placeholder={t('cash.all_accounts')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('cash.all_accounts')}</SelectItem>
                  {Array.from(new Set(cash.map(c => c.account))).filter(acc => acc !== "").map(acc => (
                    <SelectItem key={acc} value={acc}>{acc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('cash.all_categories')}</SelectItem>
                  {Array.from(new Set(cash.map(c => c.category))).filter(Boolean).filter(cat => cat !== "").map(cat => (
                    <SelectItem key={cat} value={cat}>{getCategoryName(cat)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.per_page', { count: 20 })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">{t('common.per_page', { count: 20 })}</SelectItem>
                  <SelectItem value="50">{t('common.per_page', { count: 50 })}</SelectItem>
                  <SelectItem value="100">{t('common.per_page', { count: 100 })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1 shrink-0">
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('list')}
              className="h-7 w-7"
              title={t('common.list_view')}
              aria-label={t('common.list_view')}
              aria-pressed={view === 'list'}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'card' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('card')}
              className="h-7 w-7"
              title={t('common.card_view')}
              aria-label={t('common.card_view')}
              aria-pressed={view === 'card'}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {view === 'list' ? (
          <DataTable
            data={paginated}
            columns={[
              { key: 'ref', header: 'Ref', sortable: true },
              { key: 'date', header: t('common.date'), sortable: true },
              { key: 'account', header: 'Akun', sortable: true },
              { key: 'category', header: t('common.category'), sortable: true, render: (row) => getCategoryName(row.category) },
              { key: 'income', header: t('cash.income'), render: (row) => row.income > 0 ? <span className="font-medium text-emerald-600">{formatCurrency(row.income)}</span> : '-' },
              { key: 'expense', header: t('cash.expense'), render: (row) => row.expense > 0 ? <span className="font-medium text-rose-600">{formatCurrency(row.expense)}</span> : '-' },
              { key: 'status', header: t('common.status'), render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
              { key: 'actions', header: t('common.actions'), render: (row) => <CashCrudActions cash={row} /> },
            ]}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 col-span-full">{t('cash.empty')}</p>
            ) : (
              paginated.map((row) => (
                <div key={row.id} className="rounded-2xl border bg-background p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-medium">{row.ref}</p>
                      <p className="text-sm text-muted-foreground">{row.account} · {getCategoryName(row.category)}</p>
                    </div>
                    <StatusBadge label={row.status} tone={tone(row.status)} />
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    {row.income > 0 ? <span className="font-medium text-emerald-600">{t('cash.income')} {formatCurrency(row.income)}</span> : null}
                    {row.expense > 0 ? <span className="font-medium text-rose-600">{t('cash.expense')} {formatCurrency(row.expense)}</span> : null}
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
