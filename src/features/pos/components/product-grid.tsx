import { formatCurrency } from '@/lib/format-currency'
import { usePosStore } from '@/features/pos/stores/pos-store'
import { matchesProductSearch } from '@/features/pos/lib/product-search'
import { useProducts } from '@/features/products/hooks/use-products'
import { EmptyState } from '@/shared/components/feedback/empty-state'

import { Image as ImageIcon, Package, Coffee, Shirt, MonitorSmartphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const iconMap: Record<string, React.ReactNode> = {
  Package: <Package className="size-8 text-muted-foreground" />,
  Coffee: <Coffee className="size-8 text-muted-foreground" />,
  Shirt: <Shirt className="size-8 text-muted-foreground" />,
  MonitorSmartphone: <MonitorSmartphone className="size-8 text-muted-foreground" />,
}

function ProductMedia({ imageUrl, iconName, className }: { imageUrl?: string; iconName?: string; className?: string }) {
  if (imageUrl) {
    return (
      <div className={`bg-muted overflow-hidden shrink-0 ${className}`}>
        <img src={imageUrl} alt="Product" className="w-full h-full object-cover" loading="lazy" />
      </div>
    )
  }
  return (
    <div className={`bg-muted/30 flex items-center justify-center shrink-0 border-b ${className}`}>
      {iconName && iconMap[iconName] ? iconMap[iconName] : <ImageIcon className="size-8 text-muted-foreground" />}
    </div>
  )
}

export function ProductGrid() {
  const searchQuery = usePosStore((state) => state.searchQuery)
  const selectedCategory = usePosStore((state) => state.selectedCategory)
  const viewMode = usePosStore((state) => state.viewMode)
  const addItem = usePosStore((state) => state.addItem)
  const localProducts = useProducts()

  const products = localProducts.filter((product) => {
    const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory
    const isActive = product.status === 'Aktif'

    return isActive && matchesCategory && matchesProductSearch(product, searchQuery)
  })

  if (products.length === 0) {
    return <EmptyState title="Produk tidak ditemukan" description="Coba kata kunci lain atau pilih kategori berbeda." />
  }

  function handleAddItem(product: { id: string; sku?: string; barcode?: string; name: string; category: string; price: number; stock: number; type: string; wholesaleTiers?: { minQty: number; price: number }[] }) {
    addItem({
      id: product.id,
      sku: product.sku ?? product.id.slice(0, 8),
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      unit: product.type === 'Jasa' ? 'unit' : 'pcs',
      isFavorite: false,
      wholesaleTiers: product.wholesaleTiers,
    })
  }

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-2">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => handleAddItem(product)}
            className="flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-xl border bg-background p-3 text-left shadow-sm transition hover:border-primary hover:bg-muted/40 active:scale-[0.99]"
          >
            <ProductMedia imageUrl={product.imageUrl} iconName={product.icon} className="size-16 rounded-md border" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <p className="truncate font-medium leading-tight">{product.name}</p>
              <Badge variant="secondary" className="w-fit font-normal text-[10px] px-1.5 py-0">{product.category}</Badge>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <p className="font-semibold">{formatCurrency(product.price)}</p>
              <p className="text-xs text-muted-foreground">Stok {product.type === 'Jasa' ? '-' : `${product.stock} pcs`}</p>
            </div>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3 md:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => handleAddItem(product)}
          className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-background text-left shadow-sm transition-all hover:border-primary hover:shadow-md active:scale-[0.98]"
        >
          <div className="relative w-full overflow-hidden bg-muted">
            <ProductMedia imageUrl={product.imageUrl} iconName={product.icon} className="h-24 w-full border-b transition-transform duration-300 group-hover:scale-110" />
            {product.type !== 'Jasa' && (
              <span className="absolute right-1.5 top-1.5 rounded-md border bg-background/90 px-1.5 py-0.5 text-[10px] font-medium shadow-sm backdrop-blur-sm">
                {product.stock}
              </span>
            )}
          </div>
          <div className="flex w-full flex-col gap-1 p-2.5">
            <p className="line-clamp-2 text-xs font-medium leading-tight">{product.name}</p>
            <p className="text-sm font-semibold">{formatCurrency(product.price)}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
