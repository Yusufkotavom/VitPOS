import { Input } from '@/components/ui/input'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Filter, LayoutGrid, List } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatDateTime } from '@/lib/date'
import { formatCurrency } from '@/lib/format-currency'
import { useSalesOrders } from '@/features/sales-orders/hooks/use-sales-orders'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { PageShell } from '@/shared/components/layout/page-shell'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function tone(status: string) {
  if (status === 'Lunas') return 'success'
  if (status === 'Sebagian') return 'warning'
  if (status === 'Belum Bayar') return 'danger'
  return 'neutral'
}

function paymentSummary(paidTotal: number | undefined | null, grandTotal: number | undefined | null) {
  const pTotal = paidTotal || 0
  const gTotal = grandTotal || 0

  if (gTotal <= 0) return 'Belum ada pembayaran'
  if (pTotal >= gTotal) return 'Lunas'
  if (pTotal <= 0) return 'Belum dibayar'
  return `Terbayar ${Math.round((pTotal / gTotal) * 100)}%`
}

function paymentFilterValue(paidTotal: number | undefined | null, grandTotal: number | undefined | null) {
  const pTotal = paidTotal || 0
  const gTotal = grandTotal || 0

  if (gTotal <= 0 || pTotal <= 0) return 'belum'
  if (pTotal >= gTotal) return 'lunas'
  return 'sebagian'
}

function dateKey(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function SalesOrderCard({ row }: { row: ReturnType<typeof useSalesOrders>[number] }) {
  if (!row) return null

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-background p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Invoice</p>
            <h3 className="text-lg font-semibold leading-none text-primary hover:underline">
              <Link to={`/sales-orders/${row.id}`}>{row.code}</Link>
            </h3>
            <p className="text-sm text-muted-foreground">{row.customerName}</p>
          </div>
          <StatusBadge label={row.status} tone={tone(row.status)} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Tanggal</p>
            <p className="mt-1 font-medium">{formatDateTime(row.date)}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Pembayaran</p>
            <p className="mt-1 font-medium">{paymentSummary(row.paidTotal, row.grandTotal)}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="mt-1 font-medium">{formatCurrency(row.grandTotal)}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Dibayar</p>
            <p className="mt-1 font-medium">{formatCurrency(row.paidTotal)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <Link to={`/sales-orders/${row.id}`} className="text-sm font-medium text-primary hover:underline">Lihat Detail</Link>
      </div>
    </article>
  )
}

export function SalesOrdersPage() {
  const { t } = useTranslation()
  const orderRows = useSalesOrders()
  const [view, setView] = useState<'list' | 'card'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches ? 'list' : 'card'
  )
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')
  const [customer, setCustomer] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [pageSize, setPageSize] = useState('20')
  const [filterOpen, setFilterOpen] = useState(false)
  const activeView = view

  const customers = useMemo(
    () => Array.from(new Set(orderRows.map((row) => row.customerName).filter(Boolean))).toSorted((a, b) => a.localeCompare(b)),
    [orderRows],
  )

  const filtered = orderRows
    .filter((row) => {
      const query = search.toLowerCase()
      const rowDate = dateKey(row.date)
      const matchSearch = !query || [row.code, row.customerName, row.date, row.status]
        .some((field) => field.toLowerCase().includes(query))
      const matchStatus = status === 'all' || row.status === status
      const matchPayment = paymentStatus === 'all' || paymentFilterValue(row.paidTotal, row.grandTotal) === paymentStatus
      const matchCustomer = customer === 'all' || row.customerName === customer
      const matchFrom = !fromDate || rowDate >= fromDate
      const matchTo = !toDate || rowDate <= toDate

      return matchSearch && matchStatus && matchPayment && matchCustomer && matchFrom && matchTo
    })
    .toSorted((a, b) => {
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sortBy === 'total_desc') return b.grandTotal - a.grandTotal
      if (sortBy === 'total_asc') return a.grandTotal - b.grandTotal
      if (sortBy === 'code_asc') return a.code.localeCompare(b.code)
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

  const paginated = filtered.slice(0, Number(pageSize))
  const hasActiveFilter = status !== 'all' || paymentStatus !== 'all' || customer !== 'all' || fromDate !== '' || toDate !== '' || sortBy !== 'newest' || pageSize !== '20'

  function resetFilters() {
    setStatus('all')
    setPaymentStatus('all')
    setCustomer('all')
    setFromDate('')
    setToDate('')
    setSortBy('newest')
    setPageSize('20')
  }

  return (
    <PageShell title="Pesanan Penjualan" description="Invoice, pembayaran, piutang, print, PDF, dan WhatsApp." actions={
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link to="/returns">Retur</Link>
        </Button>
        <Button asChild>
          <Link to="/pos">+ Invoice</Link>
        </Button>
      </div>
    }>
      <ContentCard title="Daftar Invoice" description="Tampilkan invoice dalam bentuk table atau card.">
        <div className="mb-4 space-y-3 border-b pb-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <Input placeholder="Cari invoice..." value={search} onChange={e => setSearch(e.target.value)} className="w-full lg:w-64" />
            <div className="flex items-center gap-2 lg:ml-auto">
              <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="relative gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                    {hasActiveFilter ? <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" /> : null}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Filter Invoice</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="Lunas">Lunas</SelectItem>
                        <SelectItem value="Sebagian">Sebagian</SelectItem>
                        <SelectItem value="Belum Bayar">Belum Bayar</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                      <SelectTrigger><SelectValue placeholder="Pembayaran" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Bayar</SelectItem>
                        <SelectItem value="lunas">Lunas</SelectItem>
                        <SelectItem value="sebagian">Sebagian</SelectItem>
                        <SelectItem value="belum">Belum Dibayar</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={customer} onValueChange={setCustomer}>
                      <SelectTrigger><SelectValue placeholder="Pelanggan" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Pelanggan</SelectItem>
                        {customers.filter(name => name !== "").map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger><SelectValue placeholder="Urutkan" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Terbaru</SelectItem>
                        <SelectItem value="oldest">Terlama</SelectItem>
                        <SelectItem value="total_desc">Total Tertinggi</SelectItem>
                        <SelectItem value="total_asc">Total Terendah</SelectItem>
                        <SelectItem value="code_asc">Invoice A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} aria-label="Tanggal awal" />
                    <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} aria-label="Tanggal akhir" />
                    <Select value={pageSize} onValueChange={setPageSize}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20 / page</SelectItem>
                        <SelectItem value="50">50 / page</SelectItem>
                        <SelectItem value="100">100 / page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={resetFilters}>Reset</Button>
                    <Button onClick={() => setFilterOpen(false)}>Tutup</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1 shrink-0">
                <Button variant={activeView === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')} className="h-7 w-7" title={t('common.list_view')} aria-label={t('common.list_view')} aria-pressed={activeView === 'list'}>
                  <List className="h-4 w-4" />
                </Button>
                <Button variant={activeView === 'card' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('card')} className="h-7 w-7" title={t('common.card_view')} aria-label={t('common.card_view')} aria-pressed={activeView === 'card'}>
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Menampilkan {paginated.length} dari {filtered.length} invoice</p>
        </div>

        {activeView === 'list' ? (
          <DataTable
            data={paginated}
            columns={[
              { key: 'code', header: 'Invoice', sortable: true, render: (row) => <Link to={`/sales-orders/${row.id}`} className="font-medium text-primary hover:underline">{row.code}</Link> },
              { key: 'customerName', header: 'Pelanggan', sortable: true },
              { key: 'date', header: 'Tanggal', sortable: true, render: (row) => formatDateTime(row.date) },
              { key: 'grandTotal', header: 'Total', sortable: true, render: (row) => formatCurrency(row.grandTotal) },
              { key: 'paidTotal', header: 'Dibayar', render: (row) => formatCurrency(row.paidTotal) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
            ]}
          />
        ) : paginated.length === 0 ? (
          <EmptyState title="Belum ada invoice" description="Invoice akan muncul di sini setelah tersedia." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.map((row) => (
              <SalesOrderCard key={row.id} row={row} />
            ))}
          </div>
        )}
      </ContentCard>
    </PageShell>
  )
}
