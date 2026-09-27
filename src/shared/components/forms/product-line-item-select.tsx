import { useMemo, useState } from 'react'

import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox'
import { useProducts } from '@/features/products/hooks/use-products'
import { formatCurrency } from '@/lib/format-currency'
import type { LocalProduct } from '@/services/local-db/schema'

export type ProductLineItemSelection = {
  productId: string
  name: string
  unitPrice: number
}

/**
 * Searchable product picker for order/purchase line items.
 *
 * Lets the user pick from existing products (auto-filling name, price and
 * productId) while still allowing a free-text name for ad-hoc items. The
 * `priceField` prop controls which product price is used to prefill the unit
 * price: `sell` for sales orders, `cost` for purchase orders (falls back to the
 * sell price when a cost price is not set).
 */
export function ProductLineItemSelect({
  id,
  value,
  ariaLabel,
  placeholder,
  emptyLabel,
  invalid,
  priceField = 'sell',
  onChange,
  onSelectProduct,
}: {
  id?: string
  value: string
  ariaLabel?: string
  placeholder?: string
  emptyLabel?: string
  invalid?: boolean
  priceField?: 'sell' | 'cost'
  onChange: (name: string) => void
  onSelectProduct: (selection: ProductLineItemSelection) => void
}) {
  const products = useProducts()
  const [open, setOpen] = useState(false)

  const activeProducts = useMemo(
    () => products.filter((product) => product.status === 'Aktif'),
    [products],
  )

  function resolvePrice(product: LocalProduct) {
    if (priceField === 'cost') return product.costPrice ?? product.price
    return product.price
  }

  return (
    <Combobox items={activeProducts} value={value} className={open ? 'z-50' : undefined}>
      <ComboboxInput
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
      />
      <ComboboxContent>
        <ComboboxList>
          {(product: LocalProduct) => (
            <ComboboxItem
              value={product.name}
              onSelect={() => {
                onSelectProduct({
                  productId: product.id,
                  name: product.name,
                  unitPrice: resolvePrice(product),
                })
                setOpen(false)
              }}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col text-left">
                  <span className="truncate font-medium">{product.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {product.sku ? `${product.sku} · ` : ''}
                    {product.category}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-semibold">{formatCurrency(resolvePrice(product))}</span>
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
        {activeProducts.length === 0 ? <ComboboxEmpty>{emptyLabel}</ComboboxEmpty> : null}
      </ComboboxContent>
    </Combobox>
  )
}
