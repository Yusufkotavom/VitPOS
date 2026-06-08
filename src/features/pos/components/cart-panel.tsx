import { Minus, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format-currency'
import { usePosStore } from '@/features/pos/stores/pos-store'
import { EmptyState } from '@/shared/components/feedback/empty-state'

export function CartPanel() {
  const cartItems = usePosStore((state) => state.cartItems)
  const increaseQty = usePosStore((state) => state.increaseQty)
  const decreaseQty = usePosStore((state) => state.decreaseQty)
  const removeItem = usePosStore((state) => state.removeItem)

  if (cartItems.length === 0) {
    return <EmptyState title="Keranjang masih kosong" description="Pilih produk dari grid untuk mulai transaksi." />
  }

  return (
    <div className="flex flex-col gap-3">
      {cartItems.map((item) => (
        <div key={item.productId} className="rounded-2xl border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => removeItem(item.productId)}>
              <Trash2 />
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" onClick={() => decreaseQty(item.productId)}>
                <Minus />
              </Button>
              <span className="min-w-8 text-center text-sm font-medium">{item.qty}</span>
              <Button variant="outline" size="icon-sm" onClick={() => increaseQty(item.productId)}>
                <Plus />
              </Button>
            </div>
            <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
