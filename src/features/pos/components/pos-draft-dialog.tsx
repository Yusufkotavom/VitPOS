import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { localDb } from '@/services/local-db/client'
import { useLiveQuery } from 'dexie-react-hooks'
import { formatCurrency } from '@/lib/format-currency'
import { usePosStore } from '@/features/pos/stores/pos-store'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'
import type { PosCartItem } from '@/features/pos/types/pos.types'
import { EmptyState } from '@/shared/components/feedback/empty-state'

interface PosDraftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PosDraftDialog({ open, onOpenChange }: PosDraftDialogProps) {
  const store = usePosStore()

  const drafts = useLiveQuery(
    async () => {
      const rows = await localDb.salesOrders.where('status').equals('Draft').toArray()
      return rows.sort((a, b) => b.date.localeCompare(a.date))
    },
    []
  )

  async function handleLoadDraft(draftId: string) {
    try {
      const draft = await localDb.salesOrders.get(draftId)
      if (!draft) throw new Error('Draft tidak ditemukan')

      const items = await localDb.salesOrderItems.where('salesOrderId').equals(draftId).toArray()
      
      const cartItems: PosCartItem[] = await Promise.all(items.map(async (item) => {
        const product = await localDb.products.get(item.productId)
        return {
          productId: item.productId,
          name: product?.name ?? 'Produk Dihapus',
          price: item.unitPrice,
          qty: item.qty,
          subtotal: item.subtotal,
          wholesaleTiers: product?.wholesaleTiers ?? [],
        }
      }))

      store.clearCart()
      store.setCart(cartItems)
      store.setDiscount(draft.discountTotal || 0)
      if (draft.customerId) {
        store.setCustomer(draft.customerId, draft.customerName)
      } else if (draft.customerName) {
        store.setCustomer(null, draft.customerName)
      } else {
        store.setCustomer(null, null)
      }

      // Delete draft from DB because it's now actively in the POS cart
      await localDb.transaction('rw', localDb.salesOrders, localDb.salesOrderItems, async () => {
        await localDb.salesOrders.delete(draftId)
        await localDb.salesOrderItems.where('salesOrderId').equals(draftId).delete()
      })

      toast.success('Draft berhasil dimuat')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memuat draft')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pesanan Tertunda (Draft)</DialogTitle>
          <DialogDescription>Pilih draft untuk dilanjutkan di kasir.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4">
          {!drafts || drafts.length === 0 ? (
            <EmptyState title="Tidak ada draft" description="Belum ada pesanan yang ditunda." />
          ) : (
            <div className="grid gap-3">
              {drafts.map((draft) => (
                <div key={draft.id} className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/30 transition-colors">
                  <div>
                    <h3 className="font-semibold text-lg">{draft.code}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{draft.customerName || 'Umum'}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(draft.date).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-bold text-primary">{formatCurrency(draft.grandTotal)}</p>
                    </div>
                    <Button onClick={() => handleLoadDraft(draft.id)}>Muat</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
