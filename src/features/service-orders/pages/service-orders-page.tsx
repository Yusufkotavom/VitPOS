import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, List, ShieldCheck, ShieldX, Clock } from 'lucide-react'

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

function warrantyBadge(row: { hasWarranty?: boolean; status: string; warrantyStartDate?: string; warrantyEndDate?: string }) {
  if (!row.hasWarranty) return { label: 'Tanpa', tone: 'neutral' as const, icon: ShieldX }
  if (row.status !== 'Selesai' || !row.warrantyStartDate) return { label: 'Menunggu', tone: 'warning' as const, icon: Clock }
  return isWarrantyExpired(row.warrantyEndDate)
    ? { label: 'Berakhir', tone: 'danger' as const, icon: ShieldX }
    : { label: 'Aktif', tone: 'success' as const, icon: ShieldCheck }
}

function ServiceOrderCard({ row }: { row: ReturnType<typeof useServiceOrders>[number] }) {
  if (!row) return null

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-background p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Service</p>
            <h3 className="text-lg font-semibold leading-none text-primary hover:underline">
              <Link to={`/service-orders/${row.id}`}>{row.code}</Link>
            </h3>
            <p className="text-sm text-muted-foreground">{row.customerName}</p>
          </div>
          <StatusBadge label={row.status} tone={tone(row.status)} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Tanggal</p>
            <p className="mt-1 font-medium">{row.date}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Pekerjaan</p>
            <p className="mt-1 font-medium line-clamp-1">{row.description}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Biaya</p>
            <p className="mt-1 font-medium">{formatCurrency(row.cost)}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="mt-1"><StatusBadge label={row.status} tone={tone(row.status)} /></p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Garansi</p>
            <p className="mt-1"><StatusBadge label={warrantyBadge(row).label} tone={warrantyBadge(row).tone} /></p>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <Link to={`/service-orders/${row.id}`} className="text-sm font-medium text-primary hover:underline">Lihat Detail</Link>
      </div>
    </article>
  )
}

export function ServiceOrdersPage() {
  const serviceRows = useServiceOrders()
  const [view, setView] = useState<'list' | 'card'>('list')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterWarranty, setFilterWarranty] = useState('')

  const filtered = serviceRows.filter(row => {
    const matchSearch = !search || [row.code, row.customerName, row.description, row.date].some(f => f.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = !filterStatus || filterStatus === 'all' || row.status === filterStatus
    const w = warrantyBadge({ hasWarranty: row.hasWarranty, status: row.status, warrantyStartDate: row.warrantyStartDate, warrantyEndDate: row.warrantyEndDate })
    const matchWarranty = !filterWarranty || filterWarranty === 'all' || w.label.toLowerCase() === filterWarranty
    return matchSearch && matchStatus && matchWarranty
  })

  return (
    <PageShell title="Service Order" description="Penerimaan, pengerjaan, biaya, dan status service." actions={<ServiceOrderCrudActions />}>
      <ContentCard title="Daftar Service Order" description="Tampilkan service order dalam bentuk table atau card.">
        <div className="mb-4 flex flex-row items-center gap-2 border-b pb-4">
          <Input type="text" placeholder="Cari service..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-64" />

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Diterima">Diterima</SelectItem>
              <SelectItem value="Dikerjakan">Dikerjakan</SelectItem>
              <SelectItem value="Selesai">Selesai</SelectItem>
              <SelectItem value="Diambil">Diambil</SelectItem>
              <SelectItem value="Batal">Batal</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterWarranty} onValueChange={setFilterWarranty}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Garansi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Garansi</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="berakhir">Berakhir</SelectItem>
              <SelectItem value="tanpa">Tanpa</SelectItem>
              <SelectItem value="menunggu">Menunggu</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="20">
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20 / halaman</SelectItem>
              <SelectItem value="50">50 / halaman</SelectItem>
              <SelectItem value="100">100 / halaman</SelectItem>
            </SelectContent>
          </Select>

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
              { key: 'code', header: 'Kode', sortable: true, render: (row) => <Link to={`/service-orders/${row.id}`} className="font-medium text-primary hover:underline">{row.code}</Link> },
              { key: 'customerName', header: 'Pelanggan', sortable: true },
              { key: 'description', header: 'Pekerjaan' },
              { key: 'date', header: 'Tanggal', sortable: true },
              { key: 'cost', header: 'Biaya', sortable: true, render: (row) => formatCurrency(row.cost) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
              { key: 'warranty', header: 'Garansi', render: (row) => { const w = warrantyBadge(row); return <StatusBadge label={w.label} tone={w.tone} /> } },
              { key: 'actions', header: 'Aksi', render: (row) => <ServiceOrderCrudActions order={row} /> },
            ]}
          />
        ) : filtered.length === 0 ? (
          <div className="col-span-full">
            <p className="text-center text-muted-foreground py-12">Belum ada service order</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((row) => (
              <ServiceOrderCard key={row.id} row={row} />
            ))}
          </div>
        )}
      </ContentCard>
    </PageShell>
  )
}
