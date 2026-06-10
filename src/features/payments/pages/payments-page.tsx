import { useState } from 'react'
import { LayoutGrid, List, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PaymentCrudActions } from '@/features/payments/components/payment-crud-actions'
import { formatCurrency } from '@/lib/format-currency'
import { usePayments } from '@/features/payments/hooks/use-payments'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function tone(status: string) {
  if (status === 'Berhasil') return 'success'
  if (status === 'Pending') return 'info'
  if (status === 'Refund') return 'warning'
  return 'danger'
}

export function PaymentsPage() {
  const payments = usePayments()
  const [view, setView] = useState<'list' | 'card'>('list')
  const [search, setSearch] = useState('')

  const filtered = payments.filter(row =>
    !search || [row.ref, row.source, row.method, row.salesOrderId ?? ''].some(f => f.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <PageShell title="Pembayaran" description="Record payment, refund, metode bayar, dan status transaksi." actions={<PaymentCrudActions />}>
      <ContentCard>
        <div className="mb-4 flex flex-row items-center gap-2 border-b pb-4">
          <input
            type="text"
            placeholder="Cari pembayaran..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
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
        
                <SelectItem value="">Status</SelectItem>
                <SelectItem value="Berhasil">Berhasil</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Gagal">Gagal</SelectItem>
                <SelectItem value="Refund">Refund</SelectItem>
              
      </SelectContent>
    </Select>
            </div>
          </div>
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
              { key: 'ref', header: 'Ref', sortable: true },
              { key: 'salesOrderId', header: 'Invoice', render: (row) => row.salesOrderId ?? '-' },
              { key: 'source', header: 'Sumber', sortable: true },
              { key: 'method', header: 'Metode' },
              { key: 'amount', header: 'Nominal', sortable: true, render: (row) => formatCurrency(row.amount) },
              { key: 'date', header: 'Tanggal', sortable: true },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
              { key: 'actions', header: 'Aksi', render: (row) => <PaymentCrudActions payment={row} /> },
            ]}
          />
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Belum ada pembayaran</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((row) => (
              <div key={row.id} className="rounded-2xl border bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-medium">{row.ref}</p>
                    <p className="text-sm text-muted-foreground">{row.source} · {row.method}</p>
                  </div>
                  <StatusBadge label={row.status} tone={tone(row.status)} />
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold">{formatCurrency(row.amount)}</span>
                  <span>{row.date}</span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <PaymentCrudActions payment={row} />
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentCard>
    </PageShell>
  )
}
