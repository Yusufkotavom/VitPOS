import { ProductCrudActions } from '@/features/products/components/product-crud-actions'
import { ProductStatusSummary } from '@/features/products/components/product-status-summary'
import { useProducts } from '@/features/products/hooks/use-products'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function statusTone(status: string) {
  if (status === 'Aktif') return 'success'
  if (status === 'Draft') return 'warning'
  return 'neutral'
}

export function ProductsPage() {
  const productRows = useProducts()

  return (
    <PageShell title="Produk" description="Kelola barang dan jasa dengan table desktop dan card mobile." actions={<ProductCrudActions />}>
      <ProductStatusSummary products={productRows} />
      <ContentCard title="Daftar Produk" description="Produk lokal tersimpan dulu, lalu masuk antrean sinkron.">
        <DataTable
          columns={[
            { key: 'name', header: 'Produk' },
            { key: 'category', header: 'Kategori' },
            { key: 'type', header: 'Jenis' },
            { key: 'price', header: 'Harga' },
            { key: 'stock', header: 'Stok' },
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
              <div className="flex items-center justify-between text-sm"><span>{row.price}</span><span>{row.stock}</span></div>
              <ProductCrudActions product={row} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
