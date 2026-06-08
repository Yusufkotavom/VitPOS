import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, List, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format-currency'
import { CustomerCrudActions } from '@/features/customers/components/customer-crud-actions'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Piutang') return 'warning'
  if (status === 'Aktif') return 'success'
  return 'neutral'
}

export function CustomersPage() {
  const customerRows = useCustomers()
  const [view, setView] = useState<'list' | 'card'>('list')
  const [search, setSearch] = useState('')

  const filtered = customerRows.filter(row =>
    !search || [row.name, row.phone, row.city].some(f => f.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <PageShell title="Pelanggan" description="Kelola pelanggan aktif, histori belanja, dan piutang." actions={<CustomerCrudActions />}>
      <ContentCard>
        <div className="mb-4 flex flex-row items-center gap-2 border-b pb-4">
          <input type="text" placeholder="Cari pelanggan..." value={search} onChange={e => setSearch(e.target.value)} className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          
          <div className="relative flex items-center group shrink-0">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>
            
            <div className="absolute top-full right-0 mt-2 hidden group-hover:flex flex-col gap-2 rounded-md border bg-popover p-2 shadow-md z-10 w-48">
              <select className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Piutang">Piutang</option>
              </select>
              <select className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="20">20 / halaman</option>
                <option value="50">50 / halaman</option>
                <option value="100">100 / halaman</option>
              </select>
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
              { key: 'name', header: 'Pelanggan', sortable: true, render: (row) => <Link to={`/customers/${row.id}`} className="font-medium text-primary hover:underline">{row.name}</Link> },
              { key: 'phone', header: 'WhatsApp' },
              { key: 'city', header: 'Kota', sortable: true },
              { key: 'receivable', header: 'Piutang', sortable: true, render: (row) => formatCurrency(row.receivable) },
              { key: 'orders', header: 'Order', sortable: true, render: (row) => String(row.orders) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
              { key: 'actions', header: 'Aksi', render: (row) => <CustomerCrudActions customer={row} /> },
            ]}
          />
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Belum ada pelanggan</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((row) => (
              <div key={row.id} className="relative flex flex-col gap-3 rounded-2xl border bg-background p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-primary hover:underline">
                      <Link to={`/customers/${row.id}`}>{row.name}</Link>
                    </p>
                    <p className="text-sm text-muted-foreground">{row.phone} · {row.city}</p>
                  </div>
                  <StatusBadge label={row.status} tone={tone(row.status)} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="rounded-xl bg-muted/40 px-3 py-1 text-xs">
                    Piutang <span className="font-medium text-foreground">{formatCurrency(row.receivable)}</span>
                  </div>
                  <div className="rounded-xl bg-muted/40 px-3 py-1 text-xs">
                    <span className="font-medium text-foreground">{row.orders}</span> order
                  </div>
                </div>
                <div className="mt-2 border-t pt-2">
                  <CustomerCrudActions customer={row} />
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentCard>
    </PageShell>
  )
}
