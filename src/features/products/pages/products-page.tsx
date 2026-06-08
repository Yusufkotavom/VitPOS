import { Button } from '@/components/ui/button'
import { ProductFormSheet } from '@/features/products/components/product-form-sheet'
import { ProductStatusSummary } from '@/features/products/components/product-status-summary'
import { useProducts } from '@/features/products/hooks/use-products'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

export function ProductsPage() {
  const productRows = useProducts()

  return (
    <PageShell
      title="Produk"
      description="Kelola barang dan jasa dengan table desktop dan card mobile."
      actions={
        <>
          <Button variant="outline">Import CSV</Button>
          <ProductFormSheet />
        </>
      }
    >
      <ProductStatusSummary products={productRows} />
      <ContentCard title="Daftar Produk" description="Search, filter, import/export, dan aksi cepat produk.">
        <DataTable
          columns={[
            { key: 'name', header: 'Produk' },
            { key: 'category', header: 'Kategori' },
            { key: 'type', header: 'Jenis' },
            { key: 'price', header: 'Harga' },
            { key: 'stock', header: 'Stok' },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <StatusBadge label={row.status} tone="success" />,
            },
          ]}
          data={productRows}
          mobileRender={(row) => (
            <div className="space-y-2">
              <p className="font-medium">{row.name}</p>
              <p className="text-sm text-muted-foreground">{row.category}</p>
              <div className="flex items-center justify-between text-sm">
                <span>{row.price}</span>
                <span>{row.stock}</span>
              </div>
              <StatusBadge label={row.status} tone="success" />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
