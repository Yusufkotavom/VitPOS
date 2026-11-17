import { Minus, Plus, Trash2, Edit2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format-currency'
import { usePosStore } from '@/features/pos/stores/pos-store'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { CartItemEditDialog } from '@/features/pos/components/cart-item-edit-dialog'
import { type PosCartItem } from '@/features/pos/types/pos.types'

export function CartPanel({ onEditItem }: { onEditItem?: (item: PosCartItem) => void }) {
  const { t } = useTranslation()
  const cartItems = usePosStore((state) => state.cartItems)
  const increaseQty = usePosStore((state) => state.increaseQty)
  const decreaseQty = usePosStore((state) => state.decreaseQty)
  const removeItem = usePosStore((state) => state.removeItem)
  const updateItem = usePosStore((state) => state.updateItem)

  const [editingItem, setEditingItem] = useState<PosCartItem | null>(null)

  function handleEdit(item: PosCartItem) {
    if (onEditItem) {
      onEditItem(item)
      return
    }
    setEditingItem(item)
  }

  if (cartItems.length === 0) {
    return <EmptyState title={t('pos.empty_cart_title')} description={t('pos.empty_cart_desc')} />
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {cartItems.map((item) => (
          <div key={item.productId} className="group rounded-2xl border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium leading-tight">{item.name}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                {item.note && (
                  <p className="mt-1 line-clamp-2 rounded-md bg-muted p-1 text-xs text-muted-foreground">{item.note}</p>
                )}
              </div>
              <div className="flex gap-1 opacity-100 transition-opacity xl:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
                <Button
                  aria-label={t('pos.edit_item', { name: item.name })}
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleEdit(item)}
                >
                  <Edit2 className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  aria-label={t('pos.remove_from_cart', { name: item.name })}
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeItem(item.productId)}
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <Button
                  aria-label={t('pos.decrease_qty', { name: item.name })}
                  variant="outline"
                  size="icon"
                  className="size-9"
                  onClick={() => decreaseQty(item.productId)}
                >
                  <Minus className="size-4" aria-hidden="true" />
                </Button>
                <span className="min-w-9 text-center text-base font-semibold" aria-live="polite">{item.qty}</span>
                <Button
                  aria-label={t('pos.increase_qty', { name: item.name })}
                  variant="outline"
                  size="icon"
                  className="size-9"
                  onClick={() => increaseQty(item.productId)}
                >
                  <Plus className="size-4" aria-hidden="true" />
                </Button>
              </div>
              <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
            </div>
          </div>
        ))}
      </div>

      <CartItemEditDialog
        key={editingItem?.productId ?? 'empty'}
        item={editingItem}
        open={editingItem !== null}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSave={(updates) => editingItem && updateItem(editingItem.productId, updates)}
      />
    </>
  )
}
