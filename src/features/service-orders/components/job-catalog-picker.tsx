import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Package, Search, Wrench } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format-currency'
import { matchesProductSearch } from '@/features/pos/lib/product-search'
import { useProducts } from '@/features/products/hooks/use-products'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import type { LocalProduct } from '@/services/local-db/schema'

type PickerTab = 'all' | 'product' | 'service'

export function JobCatalogPicker({ onPick }: { onPick: (product: LocalProduct) => void }) {
  const { t } = useTranslation()
  const products = useProducts()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<PickerTab>('all')

  const filtered = useMemo(() => {
    return products.filter((product) => {
      if (product.status !== 'Aktif') return false
      if (!matchesProductSearch(product, query)) return false
      if (tab === 'product') return product.type !== 'Jasa'
      if (tab === 'service') return product.type === 'Jasa'
      return true
    })
  }, [products, query, tab])

  function handleSearch(value: string) {
    setQuery(value)

    const clean = value.trim()
    if (clean.length >= 6) {
      const barcodeMatch = products.find((product) => product.status === 'Aktif' && product.barcode === clean)
      if (barcodeMatch) {
        onPick(barcodeMatch)
        setQuery('')
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder={t('service_orders.picker_search')}
          className="h-11 pl-10"
          autoFocus
        />
      </div>

      <div className="flex gap-2">
        {([
          { id: 'all', label: t('common.all') },
          { id: 'product', label: t('service_orders.tab_products') },
          { id: 'service', label: t('service_orders.tab_services') },
        ] as const).map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={tab === item.id ? 'default' : 'outline'}
            onClick={() => setTab(item.id)}
            aria-pressed={tab === item.id}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('service_orders.picker_empty')} description={t('service_orders.picker_empty_desc')} />
      ) : (
        <div className="grid max-h-[45vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {filtered.map((product) => {
            const isService = product.type === 'Jasa'
            const outOfStock = !isService && product.stock <= 0

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onPick(product)}
                disabled={outOfStock}
                className="flex flex-col gap-1 rounded-xl border bg-background p-3 text-left transition hover:border-primary hover:bg-muted/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-start justify-between gap-1">
                  {isService
                    ? <Wrench className="size-4 text-sky-600" aria-hidden="true" />
                    : <Package className="size-4 text-emerald-600" aria-hidden="true" />}
                  {!isService && (
                    <Badge variant={product.stock <= 5 ? 'outline' : 'secondary'} className="text-xs font-medium">
                      {product.stock}
                    </Badge>
                  )}
                </div>
                <p className="line-clamp-2 text-xs font-medium leading-tight">{product.name}</p>
                <p className="text-sm font-semibold">{formatCurrency(product.price)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {isService ? t('service_orders.tab_services') : t('service_orders.tab_products')}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
