import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutGrid,
  List,
  Wallet,
  Building2,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/format-currency'
import { CashCrudActions } from '@/features/cash/components/cash-crud-actions'
import { useCash } from '@/features/cash/hooks/use-cash'
import { useCashCategories } from '@/features/cash/hooks/use-cash-categories'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'
import { BankTransferDialog } from '@/features/cash/components/bank-transfer-dialog'
import { OpeningBalanceDialog } from '@/features/accounting/components/opening-balance-dialog'

function tone(status: string) {
  if (status === 'Tercatat') return 'success'
  if (status === 'Pending Sinkron') return 'info'
  return 'warning'
}

export function CashPage() {
  const cash = useCash()
  const categories = useCashCategories()
  const [view, setView] = useState<'list' | 'card'>('list')
  const [activeTab, setActiveTab] = useState<'all' | 'cash' | 'bank' | 'transfer'>('all')
  const [search, setSearch] = useState('')
  const [filterAccount, setFilterAccount] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [pageSize, setPageSize] = useState('25')
  const { t } = useTranslation()

  const getCategoryName = useCallback(
    (id: string) => categories.find((c) => c.id === id)?.name ?? id,
    [categories],
  )

  // Calculate balances per account
  const accountBalances = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; balance: number }>()
    for (const row of cash) {
      const acc = row.account || 'Kas Toko'
      const cur = map.get(acc) ?? { income: 0, expense: 0, balance: 0 }
      cur.income += Number(row.income) || 0
      cur.expense += Number(row.expense) || 0
      cur.balance = cur.income - cur.expense
      map.set(acc, cur)
    }
    return map
  }, [cash])

  // Filter logic
  const filtered = useMemo(() => {
    return cash.filter((row) => {
      // Tab filter
      const isBank =
        row.account.toLowerCase().includes('bank') ||
        row.account.toLowerCase().includes('bca') ||
        row.account.toLowerCase().includes('mandiri') ||
        row.account.toLowerCase().includes('bri') ||
        row.account.toLowerCase().includes('bni') ||
        row.account.toLowerCase().includes('qris') ||
        row.account.toLowerCase().includes('transfer')
      const isCash = !isBank
      const isTransfer = row.category === 'Transfer Antar Kas/Bank'

      if (activeTab === 'cash' && !isCash) return false
      if (activeTab === 'bank' && !isBank) return false
      if (activeTab === 'transfer' && !isTransfer) return false

      if (
        search &&
        ![row.ref, row.account, getCategoryName(row.category), row.date].some((f) =>
          f.toLowerCase().includes(search.toLowerCase()),
        )
      ) {
        return false
      }
      if (filterAccount !== 'all' && row.account !== filterAccount) return false
      if (filterCategory !== 'all' && row.category !== filterCategory) return false
      return true
    })
  }, [cash, activeTab, search, filterAccount, filterCategory, getCategoryName])

  const paginated = filtered.slice(0, parseInt(pageSize, 10))

  let totalIncome = 0
  let totalExpense = 0
  for (const row of cash) {
    totalIncome += Number(row.income) || 0
    totalExpense += Number(row.expense) || 0
  }
  const netBalance = totalIncome - totalExpense

  const accountList = Array.from(accountBalances.entries())

  return (
    <PageShell
      title={t('nav.cash_bank')}
      description="Kelola arus kas masuk, pengeluaran operasional, mutasi rekening bank, dan transfer antar akun."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <OpeningBalanceDialog />
          <BankTransferDialog />
          <CashCrudActions />
        </div>
      }
    >
      {/* 1. Account Balances Overview Cards */}
      <section className="mb-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Semua Akun */}
          <div
            onClick={() => {
              setActiveTab('all')
              setFilterAccount('all')
            }}
            className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition-all hover:border-primary ${
              filterAccount === 'all' && activeTab === 'all'
                ? 'border-primary ring-1 ring-primary bg-primary/5'
                : 'bg-background'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Saldo Kas & Bank</span>
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{formatCurrency(netBalance)}</p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="text-emerald-600 font-medium">Masuk: {formatCurrency(totalIncome)}</span>
              <span className="text-rose-600 font-medium">Keluar: {formatCurrency(totalExpense)}</span>
            </div>
          </div>

          {/* Account Breakdown Cards */}
          {accountList.map(([accName, accData]) => {
            const isSelected = filterAccount === accName
            const isBankAcc = accName.toLowerCase().includes('bank') || accName.toLowerCase().includes('bca')
            return (
              <div
                key={accName}
                onClick={() => {
                  setFilterAccount(isSelected ? 'all' : accName)
                }}
                className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition-all hover:border-primary ${
                  isSelected ? 'border-primary ring-1 ring-primary bg-primary/5' : 'bg-background'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground truncate max-w-[150px]">{accName}</span>
                  {isBankAcc ? <Building2 className="h-4 w-4 text-blue-500" /> : <Wallet className="h-4 w-4 text-emerald-500" />}
                </div>
                <p className="mt-2 text-xl font-bold tracking-tight">
                  {formatCurrency(accData.balance)}
                </p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>+{formatCurrency(accData.income)}</span>
                  <span>-{formatCurrency(accData.expense)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 2. Sub-navigation Buttons */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-xl border bg-muted/40 p-1">
          <Button
            variant={activeTab === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => {
              setActiveTab('all')
              setFilterAccount('all')
            }}
            className="h-8 text-xs font-medium"
          >
            Semua Transaksi
          </Button>
          <Button
            variant={activeTab === 'cash' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('cash')}
            className="h-8 text-xs font-medium gap-1"
          >
            <Wallet className="h-3.5 w-3.5" />
            Kas Tunai
          </Button>
          <Button
            variant={activeTab === 'bank' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('bank')}
            className="h-8 text-xs font-medium gap-1"
          >
            <Building2 className="h-3.5 w-3.5" />
            Rekening Bank & QRIS
          </Button>
          <Button
            variant={activeTab === 'transfer' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('transfer')}
            className="h-8 text-xs font-medium gap-1"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Transfer Antar Kas/Bank
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-8 text-xs">
            <Link to="/cash/categories">Kategori Kas</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-8 text-xs">
            <Link to="/cash/payment-methods">Metode Pembayaran</Link>
          </Button>
        </div>
      </div>

      {/* 3. Transactions Content Card */}
      <ContentCard title="Daftar Mutasi Kas & Bank" description="Catatan lengkap penerimaan, pengeluaran, dan transfer dana.">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              placeholder="Cari no referensi, akun, kategori, tanggal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Select value={filterAccount} onValueChange={setFilterAccount}>
              <SelectTrigger className="w-40 h-9 text-xs">
                <SelectValue placeholder="Pilih Akun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Akun</SelectItem>
                {Array.from(new Set(cash.map((c) => c.account)))
                  .filter(Boolean)
                  .map((acc) => (
                    <SelectItem key={acc} value={acc}>
                      {acc}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40 h-9 text-xs">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {Array.from(new Set(cash.map((c) => c.category)))
                  .filter(Boolean)
                  .map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {getCategoryName(cat)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="w-28 h-9 text-xs">
                <SelectValue placeholder="25 / hal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 / hal</SelectItem>
                <SelectItem value="50">50 / hal</SelectItem>
                <SelectItem value="100">100 / hal</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setView('list')}
                className="h-7 w-7"
                title="Tampilan Tabel"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'card' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setView('card')}
                className="h-7 w-7"
                title="Tampilan Kartu"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {view === 'list' ? (
          <DataTable
            data={paginated}
            columns={[
              {
                key: 'ref',
                header: 'No. Ref',
                sortable: true,
                render: (row) => (
                  <span className="font-mono text-xs font-semibold">{row.ref}</span>
                ),
              },
              { key: 'date', header: t('common.date'), sortable: true },
              {
                key: 'account',
                header: 'Akun Kas / Bank',
                sortable: true,
                render: (row) => {
                  const isBank =
                    row.account.toLowerCase().includes('bank') ||
                    row.account.toLowerCase().includes('bca')
                  return (
                    <Badge variant="outline" className="text-xs font-medium gap-1">
                      {isBank ? (
                        <Building2 className="h-3 w-3 text-blue-500" />
                      ) : (
                        <Wallet className="h-3 w-3 text-emerald-500" />
                      )}
                      <span>{row.account}</span>
                    </Badge>
                  )
                },
              },
              {
                key: 'category',
                header: t('common.category'),
                sortable: true,
                render: (row) => {
                  const isTransfer = row.category === 'Transfer Antar Kas/Bank'
                  const isOpening = row.category === 'Saldo Awal'
                  return (
                    <div className="flex items-center gap-1.5">
                      {isTransfer && (
                        <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                          Transfer
                        </Badge>
                      )}
                      {isOpening && (
                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                          Saldo Awal
                        </Badge>
                      )}
                      <span className="text-sm">{getCategoryName(row.category)}</span>
                    </div>
                  )
                },
              },
              {
                key: 'income',
                header: 'Masuk (Rp)',
                render: (row) =>
                  row.income > 0 ? (
                    <span className="font-medium text-emerald-600 inline-flex items-center gap-1">
                      <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
                      {formatCurrency(row.income)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  ),
              },
              {
                key: 'expense',
                header: 'Keluar (Rp)',
                render: (row) =>
                  row.expense > 0 ? (
                    <span className="font-medium text-rose-600 inline-flex items-center gap-1">
                      <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" />
                      {formatCurrency(row.expense)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  ),
              },
              {
                key: 'status',
                header: t('common.status'),
                render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} />,
              },
              {
                key: 'actions',
                header: t('common.actions'),
                render: (row) => <CashCrudActions cash={row} />,
              },
            ]}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 col-span-full">
                Tidak ada data transaksi kas/bank yang sesuai.
              </p>
            ) : (
              paginated.map((row) => (
                <div key={row.id} className="rounded-2xl border bg-background p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold font-mono text-sm">{row.ref}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.account} · {getCategoryName(row.category)}
                      </p>
                    </div>
                    <StatusBadge label={row.status} tone={tone(row.status)} />
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    {row.income > 0 ? (
                      <span className="font-semibold text-emerald-600">
                        Masuk: {formatCurrency(row.income)}
                      </span>
                    ) : null}
                    {row.expense > 0 ? (
                      <span className="font-semibold text-rose-600">
                        Keluar: {formatCurrency(row.expense)}
                      </span>
                    ) : null}
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
