import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, Filter, LayoutGrid, List, ShieldCheck, ShieldX } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/format-currency'
import { cn } from '@/lib/utils'
import { ServiceOrderCrudActions } from '@/features/service-orders/components/service-order-crud-actions'
import { ServiceWarrantyLookupDialog } from '@/features/service-orders/components/service-warranty-lookup-dialog'
import { useServiceOrders } from '@/features/service-orders/hooks/use-service-orders'
import { useServiceVertical } from '@/features/service-orders/hooks/use-service-vertical'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { isWarrantyExpired, resolveServiceWarranty } from '@/features/service-orders/lib/warranty'
import { PageShell } from '@/shared/components/layout/page-shell'

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

function tone(status: string): Tone {
  if (status === 'Selesai' || status === 'Diambil') return 'success'
  if (status === 'Dikerjakan') return 'info'
  if (status === 'Batal') return 'danger'
  if (status === 'Diagnosa' || status === 'Menunggu Persetujuan') return 'info'
  return 'warning'
}

function warrantyBadge(
  row: Parameters<typeof resolveServiceWarranty>[0] & { status: string },
  t: (key: string) => string,
) {
  const resolved = resolveServiceWarranty(row)
  if (!resolved.hasWarranty) return { label: t('service_orders.no_warranty'), tone: 'neutral' as const, icon: ShieldX, filterValue: 'tanpa' }
  if (row.status !== 'Selesai' && row.status !== 'Diambil') return { label: t('service_orders.warranty_pending'), tone: 'warning' as const, icon: Clock, filterValue: 'menunggu' }
  return isWarrantyExpired(resolved.warrantyEndDate)
    ? { label: t('service_orders.warranty_expired'), tone: 'danger' as const, icon: ShieldX, filterValue: 'berakhir' }
    : { label: t('common.active'), tone: 'success' as const, icon: ShieldCheck, filterValue: 'aktif' }
}

function dateKey(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function isOverdue(row: { status: string; estimatedCompletion?: string }) {
  if (!row.estimatedCompletion) return false
  if (row.status === 'Selesai' || row.status === 'Diambil' || row.status === 'Batal') return false
  return new Date(row.estimatedCompletion).getTime() < Date.now()
}

function deviceLabel(row: { deviceBrand?: string; deviceModel?: string; jobCategory?: string; description: string }) {
  const device = [row.deviceBrand, row.deviceModel].filter(Boolean).join(' ')
  return device || row.jobCategory || row.description
}

export function ServiceOrdersPage() {
  const { t } = useTranslation()
  const serviceRows = useServiceOrders()
  const vertical = useServiceVertical()

  const [view, setView] = useState<'board' | 'list'>('board')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterWarranty, setFilterWarranty] = useState('all')
  const [customer, setCustomer] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [pageSize, setPageSize] = useState('20')
  const [filterOpen, setFilterOpen] = useState(false)
  const [warrantyLookupOpen, setWarrantyLookupOpen] = useState(false)

  const customers = useMemo(
    () => Array.from(new Set(serviceRows.map((row) => row.customerName).filter(Boolean))).toSorted((a, b) => a.localeCompare(b)),
    [serviceRows],
  )

  const filtered = serviceRows
    .filter((row) => {
      const query = search.toLowerCase()
      const rowDate = dateKey(row.date)
      const matchSearch = !query || [row.code, row.customerName, row.description, row.deviceModel, row.deviceBrand, row.date, row.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
      const matchStatus = filterStatus === 'all'
        || (filterStatus === 'overdue' ? isOverdue(row) : row.status === filterStatus)
      const warranty = warrantyBadge(row, t)
      const matchWarranty = filterWarranty === 'all' || warranty.filterValue === filterWarranty
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

  const boardColumns = useMemo(() => {
    const flow = vertical.statusFlow
    const extraStatuses = Array.from(
      new Set(
        filtered
          .map((row) => row.status)
          .filter((status) => !flow.includes(status)),
      ),
    )

    return [...flow, ...extraStatuses].map((status) => ({
      status,
      rows: filtered.filter((row) => row.status === status),
    }))
  }, [filtered, vertical.statusFlow])

  const overdueCount = filtered.filter(isOverdue).length
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
            <Input
              type="text"
              placeholder={t('service_orders.search_placeholder')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full lg:w-64"
            />
            <div className="flex items-center gap-2 lg:ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-emerald-700 dark:text-emerald-400 border-emerald-600/30 hover:bg-emerald-500/10"
                onClick={() => setWarrantyLookupOpen(true)}
              >
                <ShieldCheck className="h-4 w-4" />
                Cek Garansi
              </Button>
              <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="relative gap-2">
                    <Filter className="h-4 w-4" />
                    {t('common.filter')}
                    {hasActiveFilter ? <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" /> : null}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{t('service_orders.filter_dialog_title')}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger><SelectValue placeholder={t('common.status')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.all_statuses')}</SelectItem>
                        <SelectItem value="overdue">{t('service_orders.filter_overdue')}</SelectItem>
                        {vertical.statusFlow.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                        <SelectItem value="Batal">Batal</SelectItem>
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
                        <SelectItem value="all">{t('common.all_customers')}</SelectItem>
                        {customers.filter((name) => name !== '').map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger><SelectValue placeholder={t('common.sort_by')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">{t('common.sort_newest')}</SelectItem>
                        <SelectItem value="oldest">{t('common.sort_oldest')}</SelectItem>
                        <SelectItem value="cost_desc">{t('service_orders.sort_cost_desc')}</SelectItem>
                        <SelectItem value="cost_asc">{t('service_orders.sort_cost_asc')}</SelectItem>
                        <SelectItem value="code_asc">{t('service_orders.sort_code_asc')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} aria-label={t('common.start_date')} />
                    <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} aria-label={t('common.end_date')} />
                    <Select value={pageSize} onValueChange={setPageSize}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">{t('common.page_size', { count: 20 })}</SelectItem>
                        <SelectItem value="50">{t('common.page_size', { count: 50 })}</SelectItem>
                        <SelectItem value="100">{t('common.page_size', { count: 100 })}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={resetFilters}>{t('common.reset')}</Button>
                    <Button onClick={() => setFilterOpen(false)}>{t('common.close')}</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex shrink-0 items-center gap-1 rounded-lg border bg-muted/50 p-1">
                <Button
                  variant={view === 'board' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setView('board')}
                  className="h-7 w-7"
                  title={t('service_orders.board_view')}
                  aria-label={t('service_orders.board_view')}
                  aria-pressed={view === 'board'}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
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
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
            >
              {t('common.all')} ({filtered.length})
            </Button>
            {vertical.statusFlow.map((status) => {
              const count = filtered.filter((row) => row.status === status).length
              if (count === 0) return null
              return (
                <Button
                  key={status}
                  size="sm"
                  variant={filterStatus === status ? 'default' : 'outline'}
                  onClick={() => setFilterStatus(status)}
                >
                  {status} ({count})
                </Button>
              )
            })}
            {(() => {
              const batalCount = filtered.filter((row) => row.status === 'Batal').length
              if (batalCount === 0) return null
              return (
                <Button
                  size="sm"
                  variant={filterStatus === 'Batal' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('Batal')}
                >
                  Batal ({batalCount})
                </Button>
              )
            })()}
            {overdueCount > 0 && (
              <Button
                size="sm"
                variant={filterStatus === 'overdue' ? 'destructive' : 'outline'}
                className="gap-1 text-destructive"
                onClick={() => setFilterStatus('overdue')}
              >
                <AlertTriangle className="size-3.5" />
                {t('service_orders.filter_overdue')} ({overdueCount})
              </Button>
            )}
          </div>
        </div>

        {view === 'list' ? (
          <DataTable
            data={paginated}
            columns={[
              { key: 'code', header: t('common.code'), sortable: true, render: (row) => <Link to={`/service-orders/${row.id}`} className="font-medium text-primary hover:underline">{row.code}</Link> },
              { key: 'customerName', header: t('common.customer'), sortable: true },
              { key: 'description', header: t('service_orders.job'), render: (row) => deviceLabel(row) },
              { key: 'date', header: t('common.date'), sortable: true },
              { key: 'cost', header: t('service_orders.cost'), sortable: true, render: (row) => formatCurrency(row.cost) },
              { key: 'status', header: t('common.status'), render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
              { key: 'warranty', header: t('service_orders.warranty'), render: (row) => { const badge = warrantyBadge(row, t); return <StatusBadge label={badge.label} tone={badge.tone} /> } },
              { key: 'actions', header: t('common.actions'), render: (row) => <ServiceOrderCrudActions order={row} /> },
            ]}
          />
        ) : paginated.length === 0 ? (
          <EmptyState title={t('service_orders.empty')} description={t('service_orders.empty_description')} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {boardColumns.map((column) => (
              <div key={column.status} className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{column.status}</span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium">{column.rows.length}</span>
                </div>

                {column.rows.length === 0 ? (
                  <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                    {t('service_orders.board_empty')}
                  </p>
                ) : (
                  column.rows.map((row) => {
                    const overdue = isOverdue(row)
                    return (
                      <Link
                        key={row.id}
                        to={`/service-orders/${row.id}`}
                        className={cn(
                          'flex flex-col gap-2 rounded-xl border bg-background p-3 shadow-sm transition hover:border-primary/40 hover:shadow-md',
                          overdue && 'border-destructive/40',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs font-medium text-primary">{row.code}</span>
                          {overdue ? (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                              <AlertTriangle className="size-3" />
                              {t('service_orders.overdue')}
                            </span>
                          ) : row.priority === 'Mendesak' ? (
                            <span className="text-[11px] font-medium text-amber-600">{t('service_orders.priority_mendesak')}</span>
                          ) : null}
                        </div>
                        <p className="line-clamp-2 text-sm font-medium leading-tight">{deviceLabel(row)}</p>
                        <p className="truncate text-xs text-muted-foreground">{row.customerName}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-sm font-semibold">{formatCurrency(row.cost)}</span>
                          {row.estimatedCompletion && (
                            <span className={cn('text-[11px]', overdue ? 'text-destructive' : 'text-muted-foreground')}>
                              {new Date(row.estimatedCompletion).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          {t('service_orders.showing_count', { count: paginated.length, total: filtered.length })}
        </p>
      </ContentCard>

      <ServiceWarrantyLookupDialog
        open={warrantyLookupOpen}
        onOpenChange={setWarrantyLookupOpen}
      />
    </PageShell>
  )
}
