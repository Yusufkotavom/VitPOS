import { formatCurrency } from '@/lib/format-currency'
import { mockPosProducts } from '@/features/pos/data/mock-products'
import { usePosStore } from '@/features/pos/stores/pos-store'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { EmptyState } from '@/shared/components/feedback/empty-state'

export function ProductGrid() {
  const searchQuery = usePosStore((state) => state.searchQuery)
  const selectedCategory = usePosStore((state) => state.selectedCategory)
  const addItem = usePosStore((state) => state.addItem)

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const products = mockPosProducts.filter((product) => {
    const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory
    const matchesSearch =
      normalizedSearch.length === 0 ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.sku.toLowerCase().includes(normalizedSearch)

    return matchesCategory && matchesSearch
  })

  if (products.length === 0) {
    return <EmptyState title="Produk tidak ditemukan" description="Coba kata kunci lain atau pilih kategori berbeda." />
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => addItem(product)}
          className="rounded-2xl border bg-background p-4 text-left shadow-sm transition hover:border-primary hover:bg-muted/40 active:scale-[0.99]"
        >
          <div className="flex min-h-32 flex-col justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium leading-tight">{product.name}</p>
                {product.isFavorite ? <StatusBadge label="Favorit" tone="info" /> : null}
              </div>
              <p className="text-xs text-muted-foreground">{product.category}</p>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold">{formatCurrency(product.price)}</p>
              <p className="text-xs text-muted-foreground">Stok {product.stock} {product.unit}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
