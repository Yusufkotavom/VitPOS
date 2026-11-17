import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { usePosStore } from '@/features/pos/stores/pos-store'
import { useProducts } from '@/features/products/hooks/use-products'

export function CategoryTabs() {
  const { t } = useTranslation()
  const selectedCategory = usePosStore((state) => state.selectedCategory)
  const setSelectedCategory = usePosStore((state) => state.setSelectedCategory)
  const products = useProducts()

  const categories = ['Semua', ...new Set(products.map((product) => product.category))]

  return (
    <div className="flex flex-wrap gap-2 pb-1">
      {categories.map((category) => {
        const isActive = selectedCategory === category
        return (
          <Button
            key={category}
            variant={isActive ? 'default' : 'outline'}
            className="h-9 shrink-0 px-3"
            onClick={() => setSelectedCategory(category)}
            aria-pressed={isActive}
          >
            {category === 'Semua' ? t('common.all') : category}
          </Button>
        )
      })}
    </div>
  )
}
