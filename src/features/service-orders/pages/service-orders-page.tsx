import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Filter, LayoutGrid, List, ShieldCheck, ShieldX } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/format-currency'
import { ServiceOrderCrudActions } from '@/features/service-orders/components/service-order-crud-actions'
import { useServiceOrders } from '@/features/service-orders/hooks/use-service-orders'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { isWarrantyExpired } from '@/features/service-orders/lib/warranty'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Selesai' || status === 'Diambil') return 'success'
  if (status === 'Dikerjakan') return 'info'
  if (status === 'Batal') return 'danger'
  return 'warning'
}

function warrantyBadge(row: { hasWarranty?: boolean; status: string; warrantyStartDate?: string; warrantyEndDate?: string }, t: (key: string) => string) {
  if (!row.hasWarranty) return { label: t('service_orders.no_warranty'), tone: 'neutral' as const, icon: ShieldX, filterValue: 'tanpa' }
  if (row.status !== 'Selesai' || !row.warrantyStartDate) return { label: t('service_orders.warranty_pending'), tone: 'warning' as const, icon: Clock, filterValue: 'menunggu' }
  return isWarrantyExpired(row.warrantyEndDate)
    ? { label: t('service_orders.warranty_expired'), tone: 'danger' as const, icon: ShieldX, filterValue: 'berakhir' }
    : { label: t('common.active'), tone: 'success' as const, icon: ShieldCheck, filterValue: 'aktif' }
}

function dateKey(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function ServiceOrderCard({ row, t }: { row: ReturnType<typeof useServiceOrders>[number]; t: (key: string) => string }) {
  if (!row) return null

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-background p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t('service_orders.label')}</p>
            <h3 className="text-lg font-semibold leading-none text-primary hover:underline">
              <Link to={`/service-orders/${row.id}`}>{row.code}</Link>
            </h3>
            <p className="text-sm text-muted-foreground">{row.customerName}</p>
          </div>
          <StatusBadge label={row.status} tone={tone(row.status)} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">{t('common.date')}</p>
            <p className="mt-1 font-medium">{row.date}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">{t('service_orders.job')}</p>
            <p className="mt-1 font-medium line-clamp-1">{row.description}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">{t('service_orders.cost')}</p>
            <p className="mt-1 font-medium">{formatCurrency(row.cost)}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">{t('common.status')}</p>
            <p className="mt-1"><StatusBadge label={row.status} tone={tone(row.status)} /></p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">{t('service_orders.warranty')}</p>
            <p className="mt-1"><StatusBadge label={warrantyBadge(row, t).label} tone={warrantyBadge(row, t).tone} /></p>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <Link to={`/service-orders/${row.id}`} className="text-sm font-medium text-primary hover:underline">{t('common.view_detail')}</Link>
      </div>
    </article>
  )
}

export function ServiceOrdersPage() {
  const { t } = useTranslation()
  const serviceRows = useServiceOrders()
  const [view, setView] = useState<'list' | 'card'>('list')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterWarranty, setFilterWarranty] = useState('all')
  const [customer, setCustomer] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [pageSize, setPageSize] = useState('20')
  const [filterOpen, setFilterOpen] = useState(false)

  const customers = useMemo(
    () => Array.from(new Set(serviceRows.map((row) => row.customerName).filter(Boolean))).toSorted((a, b) => a.localeCompare(b)),
    [serviceRows],
  )

  const filtered = serviceRows
    .filter(row => {
      const query = search.toLowerCase()
      const rowDate = dateKey(row.date)
      const matchSearch = !query || [row.code, row.customerName, row.description, row.date, row.status]
        .some(f => f.toLowerCase().includes(query))
      const matchStatus = filterStatus === 'all' || row.status === filterStatus
      const w = warrantyBadge({ hasWarranty: row.hasWarranty, status: row.status, warrantyStartDate: row.warrantyStartDate, warrantyEndDate: row.warrantyEndDate }, t)
      const matchWarranty = filterWarranty === 'all' || w.filterValue === filterWarranty
      const matchCustomer = customer === 'all' || row.customerName === customer
      const matchFrom = !fromDate || rowDate >= fromDate
      const matchTo = !toDate || rowDate <= toDate
      return matchSearch && matchStatus && matchWarranty && matchCustomer && matchFrom && matchTo
    })
    .toSorted((a, b) => {
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sortBy === 'cost_desc') return b.cost - a.cost
      if (sortBy === 'cost_asc') return a.cost - b.cost
      if (sortBy === 'code_asc') return a.code.localeCompare(b.code)
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

  const paginated = filtered.slice(0, Number(pageSize))
  const hasActiveFilter = filterStatus !== 'all' || filterWarranty !== 'all' || customer !== 'all' || fromDate !== '' || toDate !== '' || sortBy !== 'newest' || pageSize !== '20'

  function resetFilters() {
    setFilterStatus('all')
    setFilterWarranty('all')
    setCustomer('all')
    setFromDate('')
    setToDate('')
    setSortBy('newest')
    setPageSize('20')
  }

  return (
    <PageShell title={t('nav.service_order')} description={t('service_orders.page_description')} actions={<ServiceOrderCrudActions />}>
      <ContentCard title={t('service_orders.list_title')} description={t('service_orders.list_description')}>
        <div className="mb-4 space-y-3 border-b pb-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <Input type="text" placeholder={t('service_orders.search_placeholder')} value={search} onChange={e => setSearch(e.target.value)} className="w-full lg:w-64" />
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
                    <DialogTitle>Filter Service Order</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger><SelectValue placeholder={t('common.status')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.all_statuses')}</SelectItem>
                        <SelectItem value="Diterima">{t('service_orders.status_received')}</SelectItem>
                        <SelectItem value="Dikerjakan">{t('service_orders.status_in_progress')}</SelectItem>
                        <SelectItem value="Selesai">{t('service_orders.status_completed')}</SelectItem>
                        <SelectItem value="Diambil">{t('service_orders.status_picked_up')}</SelectItem>
                        <SelectItem value="Batal">{t('service_orders.status_cancelled')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterWarranty} onValueChange={setFilterWarranty}>
                      <SelectTrigger><SelectValue placeholder={t('service_orders.warranty')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('service_orders.all_warranty')}</SelectItem>
                        <SelectItem value="aktif">{t('common.active')}</SelectItem>
                        <SelectItem value="berakhir">{t('service_orders.warranty_expired')}</SelectItem>
                        <SelectItem value="tanpa">{t('service_orders.no_warranty')}</SelectItem>
                        <SelectItem value="menunggu">{t('service_orders.warranty_pending')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={customer} onValueChange={setCustomer}>
                      <SelectTrigger><SelectValue placeholder={t('common.customer')} /></SelectTrigger>
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
                        <SelectItem value="cost_desc">Biaya Tertinggi</SelectItem>
                        <SelectItem value="cost_asc">Biaya Terendah</SelectItem>
                        <SelectItem value="code_asc">Kode A-Z</SelectItem>
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
                <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')} className="h-7 w-7" title={t('common.list_view')} aria-label={t('common.list_view')} aria-pressed={view === 'list'}>
                  <List className="h-4 w-4" />
                </Button>
                <Button variant={view === 'card' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('card')} className="h-7 w-7" title={t('common.card_view')} aria-label={t('common.card_view')} aria-pressed={view === 'card'}>
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Menampilkan {paginated.length} dari {filtered.length} service order</p>
        </div>

        {view === 'list' ? (
          <DataTable
            data={paginated}
            columns={[
              { key: 'code', header: t('common.code'), sortable: true, render: (row) => <Link to={`/service-orders/${row.id}`} className="font-medium text-primary hover:underline">{row.code}</Link> },
              { key: 'customerName', header: t('common.customer'), sortable: true },
              { key: 'description', header: t('service_orders.job') },
              { key: 'date', header: t('common.date'), sortable: true },
              { key: 'cost', header: t('service_orders.cost'), sortable: true, render: (row) => formatCurrency(row.cost) },
              { key: 'status', header: t('common.status'), render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
              { key: 'warranty', header: t('service_orders.warranty'), render: (row) => { const w = warrantyBadge(row, t); return <StatusBadge label={w.label} tone={w.tone} /> } },
              { key: 'actions', header: t('common.actions'), render: (row) => <ServiceOrderCrudActions order={row} /> },
            ]}
          />
        ) : paginated.length === 0 ? (
          <div className="col-span-full">
            <p className="text-center text-muted-foreground py-12">{t('service_orders.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.map((row) => (
              <ServiceOrderCard key={row.id} row={row} t={t} />
            ))}
          </div>
        )}
      </ContentCard>
    </PageShell>
  )
}
