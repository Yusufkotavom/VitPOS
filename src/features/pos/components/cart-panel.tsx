import { Minus, Plus, Trash2, Edit2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format-currency'
import { usePosStore } from '@/features/pos/stores/pos-store'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { CartItemEditDialog } from '@/features/pos/components/cart-item-edit-dialog'
import { type PosCartItem } from '@/features/pos/types/pos.types'

export function CartPanel() {
  const cartItems = usePosStore((state) => state.cartItems)
  const increaseQty = usePosStore((state) => state.increaseQty)
  const decreaseQty = usePosStore((state) => state.decreaseQty)
  const removeItem = usePosStore((state) => state.removeItem)
  const updateItem = usePosStore((state) => state.updateItem)

  const [editingItem, setEditingItem] = useState<PosCartItem | null>(null)

  if (cartItems.length === 0) {
    return <EmptyState title="Keranjang masih kosong" description="Pilih produk dari grid untuk mulai transaksi." />
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {cartItems.map((item) => (
          <div key={item.productId} className="rounded-2xl border p-4 group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                {item.note && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 bg-muted p-1 rounded-md">{item.note}</p>}
              </div>
              <div className="flex gap-1 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity">
                <Button aria-label={`Edit ${item.name}`} variant="ghost" size="icon-sm" onClick={() => setEditingItem(item)}>
                  <Edit2 className="size-4" aria-hidden="true" />
                </Button>
                <Button aria-label={`Hapus ${item.name} dari keranjang`} variant="ghost" size="icon-sm" onClick={() => removeItem(item.productId)}>
                  <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button aria-label={`Kurangi jumlah ${item.name}`} variant="outline" size="icon-sm" onClick={() => decreaseQty(item.productId)}>
                  <Minus className="size-4" aria-hidden="true" />
                </Button>
                <span className="min-w-8 text-center text-sm font-medium">{item.qty}</span>
                <Button aria-label={`Tambah jumlah ${item.name}`} variant="outline" size="icon-sm" onClick={() => increaseQty(item.productId)}>
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
