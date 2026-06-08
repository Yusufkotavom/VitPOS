import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format-currency'
import { ProductCrudActions } from '@/features/products/components/product-crud-actions'
import { ProductStatusSummary } from '@/features/products/components/product-status-summary'
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
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')

  return (
    <PageShell title="Produk" description="Kelola barang dan jasa dengan table desktop dan card mobile." actions={<ProductCrudActions />}>
      <ProductStatusSummary products={productRows} />

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold tracking-tight">Daftar Produk</h2>
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 px-2"
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button
            variant={viewMode === 'card' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('card')}
            className="h-8 px-2"
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Card
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <ContentCard>
          <DataTable
            columns={[
              { key: 'name', header: 'Produk' },
              { key: 'category', header: 'Kategori' },
              { key: 'type', header: 'Jenis' },
              { key: 'price', header: 'Harga', render: (row) => formatCurrency(row.price) },
              { key: 'stock', header: 'Stok', render: (row) => displayStock(row) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={statusTone(row.status)} /> },
              { key: 'actions', header: 'Aksi', render: (row) => <ProductCrudActions product={row} /> },
            ]}
            data={productRows}
            emptyTitle="Belum ada produk"
            mobileRender={(row) => (
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-sm text-muted-foreground">{row.category} · {row.type}</p>
                  </div>
                  <StatusBadge label={row.status} tone={statusTone(row.status)} />
                </div>
                <div className="flex items-center justify-between text-sm"><span>{formatCurrency(row.price)}</span><span>{displayStock(row)}</span></div>
                <ProductCrudActions product={row} />
              </div>
            )}
          />
        </ContentCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productRows.length === 0 ? (
            <div className="col-span-full">
              <EmptyState title="Belum ada produk" description="Produk akan muncul di sini setelah tersedia." />
            </div>
          ) : (
            productRows.map((row) => (
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
            ))
          )}
        </div>
      )}
    </PageShell>
  )
}
