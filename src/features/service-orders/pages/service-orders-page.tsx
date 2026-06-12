import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, List, ShieldCheck, ShieldX, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
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
  const [filterStatus, setFilterStatus] = useState('')
  const [filterWarranty, setFilterWarranty] = useState('')

  const filtered = serviceRows.filter(row => {
    const matchSearch = !search || [row.code, row.customerName, row.description, row.date].some(f => f.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = !filterStatus || filterStatus === 'all' || row.status === filterStatus
    const w = warrantyBadge({ hasWarranty: row.hasWarranty, status: row.status, warrantyStartDate: row.warrantyStartDate, warrantyEndDate: row.warrantyEndDate }, t)
    const matchWarranty = !filterWarranty || filterWarranty === 'all' || w.filterValue === filterWarranty
    return matchSearch && matchStatus && matchWarranty
  })

  return (
    <PageShell title={t('nav.service_order')} description={t('service_orders.page_description')} actions={<ServiceOrderCrudActions />}>
      <ContentCard title={t('service_orders.list_title')} description={t('service_orders.list_description')}>
        <div className="mb-4 flex flex-row items-center gap-2 border-b pb-4">
          <Input type="text" placeholder={t('service_orders.search_placeholder')} value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-64" />

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('common.status')} />
            </SelectTrigger>
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
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('service_orders.warranty')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('service_orders.all_warranty')}</SelectItem>
              <SelectItem value="aktif">{t('common.active')}</SelectItem>
              <SelectItem value="berakhir">{t('service_orders.warranty_expired')}</SelectItem>
              <SelectItem value="tanpa">{t('service_orders.no_warranty')}</SelectItem>
              <SelectItem value="menunggu">{t('service_orders.warranty_pending')}</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="20">
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">{t('common.per_page', { count: 20 })}</SelectItem>
              <SelectItem value="50">{t('common.per_page', { count: 50 })}</SelectItem>
              <SelectItem value="100">{t('common.per_page', { count: 100 })}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1 shrink-0">
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('list')}
              className="h-7 w-7"
              title={t('common.list_view')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'card' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('card')}
              className="h-7 w-7"
              title={t('common.card_view')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {view === 'list' ? (
          <DataTable
            data={filtered}
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
        ) : filtered.length === 0 ? (
          <div className="col-span-full">
            <p className="text-center text-muted-foreground py-12">{t('service_orders.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((row) => (
              <ServiceOrderCard key={row.id} row={row} t={t} />
            ))}
          </div>
        )}
      </ContentCard>
    </PageShell>
  )
}
