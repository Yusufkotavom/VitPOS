import { Search, LayoutGrid, List } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { usePosStore } from '@/features/pos/stores/pos-store'
import { useProducts } from '@/features/products/hooks/use-products'

export function ProductSearch() {
  const searchQuery = usePosStore((state) => state.searchQuery)
  const setSearchQuery = usePosStore((state) => state.setSearchQuery)
  const viewMode = usePosStore((state) => state.viewMode)
  const setViewMode = usePosStore((state) => state.setViewMode)
  const addItem = usePosStore((state) => state.addItem)
  const localProducts = useProducts()

  function handleInputChange(val: string) {
    setSearchQuery(val)
    
    const cleanVal = val.trim()
    if (cleanVal.length >= 6) {
      const match = localProducts.find(p => p.status === 'Aktif' && p.barcode === cleanVal)
      if (match) {
        addItem({
          id: match.id,
          sku: match.sku ?? match.id.slice(0, 8),
          barcode: match.barcode,
          name: match.name,
          category: match.category,
          price: match.price,
          stock: match.stock,
          unit: match.type === 'Jasa' ? 'unit' : 'pcs',
          isFavorite: false,
        })
        setSearchQuery('')
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => handleInputChange(event.target.value)}
          placeholder="Cari produk / scan barcode"
          className="h-11 rounded-xl pl-10"
        />
      </div>
      <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1 shrink-0 h-11">
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setViewMode('list')}
          className="h-full w-9"
          title="List View"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setViewMode('grid')}
          className="h-full w-9"
          title="Grid View"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
