import { Button } from '@/components/ui/button'
import { usePosStore } from '@/features/pos/stores/pos-store'
import { useProducts } from '@/features/products/hooks/use-products'

export function CategoryTabs() {
  const selectedCategory = usePosStore((state) => state.selectedCategory)
  const setSelectedCategory = usePosStore((state) => state.setSelectedCategory)
  const products = useProducts()
  
  const categories = ['Semua', ...new Set(products.map((product) => product.category))]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? 'default' : 'outline'}
          className="shrink-0"
          onClick={() => setSelectedCategory(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  )
}
