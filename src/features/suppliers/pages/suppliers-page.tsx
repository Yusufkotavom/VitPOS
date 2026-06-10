import { useState } from 'react'
import { LayoutGrid, List, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/format-currency'
import { SupplierCrudActions } from '@/features/suppliers/components/supplier-crud-actions'
import { useSuppliers } from '@/features/suppliers/hooks/use-suppliers'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Aktif') return 'success'
  if (status === 'Hutang') return 'warning'
  return 'neutral'
}

export function SuppliersPage() {
  const supplierRows = useSuppliers()
  const [view, setView] = useState<'list' | 'card'>('list')
  const [search, setSearch] = useState('')

  const filtered = supplierRows.filter(row =>
    !search || [row.name, row.phone, row.city].some(f => f.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <PageShell title="Supplier" description="Kontak supplier, hutang, dan histori." actions={<SupplierCrudActions />}>
      <ContentCard title="Daftar Supplier" description="Tampilkan supplier dalam bentuk table atau card.">
        <div className="mb-4 flex flex-row items-center gap-2 border-b pb-4">
          <input
            type="text"
            placeholder="Cari supplier..."
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
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Hutang">Hutang</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="20 / halaman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 / halaman</SelectItem>
                  <SelectItem value="50">50 / halaman</SelectItem>
                  <SelectItem value="100">100 / halaman</SelectItem>
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
              { key: 'name', header: 'Supplier', sortable: true },
              { key: 'phone', header: 'Telepon' },
              { key: 'city', header: 'Alamat', sortable: true },
              { key: 'payable', header: 'Hutang', sortable: true, render: (row) => <span className={row.payable > 0 ? 'font-medium text-rose-600' : ''}>{formatCurrency(row.payable)}</span> },
              { key: 'orders', header: 'Order', sortable: true, render: (row) => String(row.orders) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
              { key: 'actions', header: 'Aksi', render: (row) => <SupplierCrudActions supplier={row} /> },
            ]}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 col-span-full">Belum ada supplier</p>
            ) : (
              filtered.map((row) => (
                <div key={row.id} className="rounded-2xl border bg-background p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-sm text-muted-foreground">{row.phone}</p>
                      <p className="text-xs text-muted-foreground">{row.city}</p>
                    </div>
                    <StatusBadge label={row.status} tone={tone(row.status)} />
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Hutang <span className={row.payable > 0 ? 'font-semibold text-rose-600' : ''}>{formatCurrency(row.payable)}</span></span>
                    <span>{row.orders} order</span>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <SupplierCrudActions supplier={row} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </ContentCard>
    </PageShell>
  )
}
