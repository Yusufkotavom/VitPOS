import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, List, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format-currency'
import { ServiceOrderCrudActions } from '@/features/service-orders/components/service-order-crud-actions'
import { useServiceOrders } from '@/features/service-orders/hooks/use-service-orders'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Selesai' || status === 'Diambil') return 'success'
  if (status === 'Dikerjakan') return 'info'
  if (status === 'Batal') return 'danger'
  return 'warning'
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
  const activeView = view

  return (
    <PageShell title="Service Order" description="Penerimaan, pengerjaan, biaya, dan status service." actions={<ServiceOrderCrudActions />}>
      <ContentCard title="Daftar Service Order" description="Tampilkan service order dalam bentuk table atau card.">
        <div className="mb-4 flex flex-row items-center gap-2 border-b pb-4">
          <input type="text" placeholder="Cari service..." className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />

          <div className="relative flex items-center group shrink-0">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>

            <div className="absolute top-full right-0 mt-2 hidden group-hover:flex flex-col gap-2 rounded-md border bg-popover p-2 shadow-md z-10 w-48">
              <select className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">Status</option>
                <option value="Diterima">Diterima</option>
                <option value="Dikerjakan">Dikerjakan</option>
                <option value="Selesai">Selesai</option>
                <option value="Diambil">Diambil</option>
                <option value="Batal">Batal</option>
              </select>
              <select className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value="20">20 / halaman</option>
                <option value="50">50 / halaman</option>
                <option value="100">100 / halaman</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1 shrink-0">
            <Button
              variant={activeView === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('list')}
              className="h-7 w-7"
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={activeView === 'card' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('card')}
              className="h-7 w-7"
              title="Card View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {activeView === 'list' ? (
          <DataTable
            data={serviceRows}
            columns={[
              { key: 'code', header: 'No Service', sortable: true, render: (row) => <Link to={`/service-orders/${row.id}`} className="font-medium text-primary hover:underline">{row.code}</Link> },
              { key: 'customerName', header: 'Pelanggan', sortable: true },
              { key: 'date', header: 'Tanggal', sortable: true },
              { key: 'description', header: 'Pekerjaan' },
              { key: 'cost', header: 'Biaya', sortable: true, render: (row) => formatCurrency(row.cost) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
            ]}
          />
        ) : serviceRows.length === 0 ? (
          <div className="col-span-full">
            <p className="text-center text-muted-foreground py-12">Belum ada service order</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {serviceRows.map((row) => (
              <ServiceOrderCard key={row.id} row={row} />
            ))}
          </div>
        )}
      </ContentCard>
    </PageShell>
  )
}
