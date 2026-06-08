import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { formatCurrency } from '@/lib/format-currency'
import { SalesOrderCrudActions } from '@/features/sales-orders/components/sales-order-crud-actions'
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

function paymentSummary(paidTotal: number, grandTotal: number) {
  if (grandTotal <= 0) return 'Belum ada pembayaran'
  if (paidTotal >= grandTotal) return 'Lunas'
  if (paidTotal <= 0) return 'Belum dibayar'
  return `Terbayar ${Math.round((paidTotal / grandTotal) * 100)}%`
}

function SalesOrderCard({ row }: { row: ReturnType<typeof useSalesOrders>[number] }) {
  if (!row) return null

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-background p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Invoice</p>
            <h3 className="text-lg font-semibold leading-none">{row.code}</h3>
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
        <SalesOrderCrudActions order={row} />
      </div>
    </article>
  )
}

export function SalesOrdersPage() {
  const orderRows = useSalesOrders()
  const isMobile = useIsMobile()
  const [desktopView, setDesktopView] = useState<'list' | 'card'>('list')
  const activeView = isMobile ? 'card' : desktopView

  return (
    <PageShell title="Pesanan Penjualan" description="Invoice, pembayaran, piutang, print, PDF, dan WhatsApp." actions={<SalesOrderCrudActions />}>
      <ContentCard title="Daftar Invoice" description="Desktop pakai table untuk scan cepat. Mobile pakai card untuk cek status dan pembayaran.">
        <div className="mb-4 flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold tracking-tight">Tampilan daftar</h3>
            <p className="text-sm text-muted-foreground">
              {isMobile ? 'Mode card aktif otomatis di mobile.' : 'Pilih table untuk kerja cepat atau card untuk ringkasan visual.'}
            </p>
          </div>

          {!isMobile ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-1">
              <Button
                variant={activeView === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDesktopView('list')}
                className="h-8 px-3"
              >
                <List className="mr-1 h-4 w-4" />
                List
              </Button>
              <Button
                variant={activeView === 'card' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDesktopView('card')}
                className="h-8 px-3"
              >
                <LayoutGrid className="mr-1 h-4 w-4" />
                Card
              </Button>
            </div>
          ) : null}
        </div>

        {activeView === 'list' ? (
          <DataTable
            data={orderRows}
            columns={[
              { key: 'code', header: 'Invoice' },
              { key: 'customerName', header: 'Pelanggan' },
              { key: 'date', header: 'Tanggal' },
              { key: 'grandTotal', header: 'Total', render: (row) => formatCurrency(row.grandTotal) },
              { key: 'paidTotal', header: 'Dibayar', render: (row) => formatCurrency(row.paidTotal) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
              { key: 'actions', header: 'Aksi', render: (row) => <SalesOrderCrudActions order={row} /> },
            ]}
            mobileRender={(row) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{row.code}</p>
                    <p className="text-sm text-muted-foreground">{row.customerName} · {row.date}</p>
                  </div>
                  <StatusBadge label={row.status} tone={tone(row.status)} />
                </div>
                <div className="flex items-center justify-between text-sm"><span>{formatCurrency(row.grandTotal)}</span><span>{formatCurrency(row.paidTotal)}</span></div>
                <SalesOrderCrudActions order={row} />
              </div>
            )}
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
