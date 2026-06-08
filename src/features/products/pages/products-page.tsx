import { useState } from 'react'
import { LayoutGrid, List, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format-currency'
import { ProductCrudActions } from '@/features/products/components/product-crud-actions'
import { useProducts } from '@/features/products/hooks/use-products'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'
import { EmptyState } from '@/shared/components/feedback/empty-state'

function statusTone(status: string) {
  if (status === 'Aktif') return 'success'
  if (status === 'Draft') return 'warning'
  return 'neutral'
}

function displayStock(product: { type: string; stock: number }) {
  return product.type === 'Jasa' ? '-' : `${product.stock} pcs`
}

export function ProductsPage() {
  const productRows = useProducts()
  const [view, setView] = useState<'list' | 'card'>('list')
  const activeView = view

  return (
    <PageShell title="Barang & Jasa" actions={<ProductCrudActions />}>
      <ContentCard>
        <div className="mb-4 flex flex-row items-center gap-2 border-b pb-4">
          <input type="text" placeholder="Cari barang..." className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />

          <div className="relative flex items-center group shrink-0">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>

            <div className="absolute top-full right-0 mt-2 hidden group-hover:flex flex-col gap-2 rounded-md border bg-popover p-2 shadow-md z-10 w-48">
              <select className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">Jenis</option>
                <option value="Barang">Barang</option>
                <option value="Jasa">Jasa</option>
              </select>
              <select className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Draft">Draft</option>
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
            columns={[
              { key: 'name', header: 'Nama' },
              { key: 'category', header: 'Kategori' },
              { key: 'type', header: 'Jenis' },
              { key: 'price', header: 'Harga', render: (row) => formatCurrency(row.price) },
              { key: 'stock', header: 'Stok', render: (row) => displayStock(row) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={statusTone(row.status)} /> },
              { key: 'actions', header: 'Aksi', render: (row) => <ProductCrudActions product={row} /> },
            ]}
            data={productRows}
          />
        ) : productRows.length === 0 ? (
          <EmptyState title="Belum ada barang atau jasa" description="Barang dan jasa akan muncul di sini setelah tersedia." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productRows.map((row) => (
              <div key={row.id} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-background p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <StatusBadge label={row.status} tone={statusTone(row.status)} />
                    <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md text-muted-foreground">{row.type}</span>
                  </div>
                  <h3 className="font-semibold text-lg line-clamp-1">{row.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">{row.category}</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col bg-muted/30 p-2 rounded-lg">
                      <span className="text-muted-foreground text-xs mb-0.5">Harga Jual</span>
                      <span className="font-medium">{formatCurrency(row.price)}</span>
                    </div>
                    <div className="flex flex-col bg-muted/30 p-2 rounded-lg">
                      <span className="text-muted-foreground text-xs mb-0.5">Sisa Stok</span>
                      <span className="font-medium">{displayStock(row)}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t flex justify-end">
                    <ProductCrudActions product={row} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentCard>
    </PageShell>
  )
}
