import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, List, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format-currency'
import { useSalesOrders } from '@/features/sales-orders/hooks/use-sales-orders'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Lunas') return 'success'
  if (status === 'Sebagian') return 'warning'
  if (status === 'Belum Bayar') return 'danger'
  return 'neutral'
}

function paymentSummary(paidTotal: number | undefined | null, grandTotal: number | undefined | null) {
  const pTotal = paidTotal || 0;
  const gTotal = grandTotal || 0;

  if (gTotal <= 0) return 'Belum ada pembayaran'
  if (pTotal >= gTotal) return 'Lunas'
  if (pTotal <= 0) return 'Belum dibayar'
  return `Terbayar ${Math.round((pTotal / gTotal) * 100)}%`
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
            <p className="mt-1 font-medium">{row.date}</p>
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
  const orderRows = useSalesOrders()
  const [view, setView] = useState<'list' | 'card'>('list')
  const activeView = view

  return (
    <PageShell title="Pesanan Penjualan" description="Invoice, pembayaran, piutang, print, PDF, dan WhatsApp." actions={
      <Button asChild>
        <Link to="/pos">+ Invoice</Link>
      </Button>
    }>
      <ContentCard title="Daftar Invoice" description="Tampilkan invoice dalam bentuk table atau card.">
        <div className="mb-4 flex flex-row items-center gap-2 border-b pb-4">
          <input type="text" placeholder="Search invoice..." className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
          
          <div className="relative flex items-center group shrink-0">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>
            
            <div className="absolute top-full right-0 mt-2 hidden group-hover:flex flex-col gap-2 rounded-md border bg-popover p-2 shadow-md z-10 w-48">
              <select className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">Status</option>
                <option value="Lunas">Lunas</option>
                <option value="Sebagian">Sebagian</option>
                <option value="Belum Bayar">Belum Bayar</option>
              </select>
              <select className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
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
            data={orderRows}
              columns={[
                { key: 'code', header: 'Invoice', sortable: true, render: (row) => <Link to={`/sales-orders/${row.id}`} className="font-medium text-primary hover:underline">{row.code}</Link> },
                { key: 'customerName', header: 'Pelanggan', sortable: true },
              { key: 'date', header: 'Tanggal', sortable: true },
              { key: 'grandTotal', header: 'Total', sortable: true, render: (row) => formatCurrency(row.grandTotal) },
              { key: 'paidTotal', header: 'Dibayar', render: (row) => formatCurrency(row.paidTotal) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
            ]}
          />
        ) : orderRows.length === 0 ? (
          <EmptyState title="Belum ada invoice" description="Invoice akan muncul di sini setelah tersedia." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {orderRows.map((row) => (
              <SalesOrderCard key={row.id} row={row} />
            ))}
          </div>
        )}
      </ContentCard>
    </PageShell>
  )
}
