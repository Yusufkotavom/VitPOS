import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, List, Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
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
  const activeView = view

  const filtered = orderRows
    .filter(row => !search || [row.code, row.customerName, row.date].some(f => f.toLowerCase().includes(search.toLowerCase())))
    .toSorted((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <PageShell title="Pesanan Penjualan" description="Invoice, pembayaran, piutang, print, PDF, dan WhatsApp." actions={
      <Button asChild>
        <Link to="/pos">+ Invoice</Link>
      </Button>
    }>
      <ContentCard title="Daftar Invoice" description="Tampilkan invoice dalam bentuk table atau card.">
        <div className="mb-4 flex flex-row items-center gap-2 border-b pb-4">
          <Input placeholder="Cari invoice..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-64" />
          
          <div className="relative flex items-center group shrink-0">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>
            
            <div className="absolute top-full right-0 mt-2 hidden group-hover:flex flex-col gap-2 rounded-md border bg-popover p-2 shadow-md z-10 w-48">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Lunas">Lunas</SelectItem>
                  <SelectItem value="Sebagian">Sebagian</SelectItem>
                  <SelectItem value="Belum Bayar">Belum Bayar</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1 shrink-0">
            <Button
              variant={activeView === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('list')}
              className="h-7 w-7"
              title={t('common.list_view')}
              aria-label={t('common.list_view')}
              aria-pressed={activeView === 'list'}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={activeView === 'card' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('card')}
              className="h-7 w-7"
              title={t('common.card_view')}
              aria-label={t('common.card_view')}
              aria-pressed={activeView === 'card'}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {activeView === 'list' ? (
              <DataTable
            data={filtered}
              columns={[
                { key: 'code', header: 'Invoice', sortable: true, render: (row) => <Link to={`/sales-orders/${row.id}`} className="font-medium text-primary hover:underline">{row.code}</Link> },
                { key: 'customerName', header: 'Pelanggan', sortable: true },
              { key: 'date', header: 'Tanggal', sortable: true, render: (row) => formatDateTime(row.date) },
              { key: 'grandTotal', header: 'Total', sortable: true, render: (row) => formatCurrency(row.grandTotal) },
              { key: 'paidTotal', header: 'Dibayar', render: (row) => formatCurrency(row.paidTotal) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
            ]}
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="Belum ada invoice" description="Invoice akan muncul di sini setelah tersedia." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((row) => (
              <SalesOrderCard key={row.id} row={row} />
            ))}
          </div>
        )}
      </ContentCard>
    </PageShell>
  )
}
