import { Button } from '@/components/ui/button'
import { mockPosProducts } from '@/features/pos/data/mock-products'
import { usePosStore } from '@/features/pos/stores/pos-store'

const categories = ['Semua', ...new Set(mockPosProducts.map((product) => product.category))]

export function CategoryTabs() {
  const selectedCategory = usePosStore((state) => state.selectedCategory)
  const setSelectedCategory = usePosStore((state) => state.setSelectedCategory)

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
