import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/format-currency'
import { selectPosTotals, usePosStore } from '@/features/pos/stores/pos-store'
import { posTransactionService } from '@/features/pos/services/pos-transaction.service'
import { toast } from 'sonner'
import { usePaymentMethods } from '@/features/settings/hooks/use-payment-methods'
import { useState } from 'react'
import { PosSuccessDialog } from '@/features/pos/components/pos-success-dialog'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { printPage } from '@/lib/print'
import { type PosOrderSummary } from '@/features/pos/types/pos-order.types'

const defaultMethods = [
  { id: 'tunai', name: 'Tunai' },
  { id: 'qris', name: 'QRIS' },
  { id: 'transfer', name: 'Transfer' },
]

export function PaymentSummary() {
  const store = usePosStore()
  const totals = selectPosTotals(store)
  const dbMethods = usePaymentMethods()
  const activeMethods = dbMethods && dbMethods.length > 0 ? dbMethods.filter(m => m.status === 'Aktif') : defaultMethods
  
  const [successOrder, setSuccessOrder] = useState<PosOrderSummary | null>(null)

  async function handleCheckout() {
    if (store.cartItems.length === 0) return

    try {
      await posTransactionService.checkout(store.cartItems, totals, store.paymentMethod, store.paidAmount, store.discount)
      setSuccessOrder({
        id: `POS-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        date: new Date(),
        subtotal: totals.subtotal,
        tax: 0,
        discount: store.discount,
        total: totals.total,
        paymentMethod: store.paymentMethod,
        amountPaid: store.paymentMethod === 'tunai' ? store.paidAmount : totals.total,
        change: totals.change,
        items: store.cartItems,
        cashierName: 'Kasir',
      })
      store.clearCart()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mencatat pembayaran'
      toast.error(message)
    }
  }

  function handleWhatsApp() {
    if (!successOrder) return
    const text = `Nota Pesanan ${successOrder.id}\nTotal: ${formatCurrency(successOrder.total)}\nMetode: ${successOrder.paymentMethod}\nTerima kasih!`
    window.open(buildWhatsAppLink('0800000000', text), '_blank')
  }

  return (
    <div className="flex flex-col gap-4">
      <PosSuccessDialog 
        open={successOrder !== null} 
        onOpenChange={(open) => !open && setSuccessOrder(null)}
        order={successOrder}
        onPrint={printPage}
        onWhatsApp={handleWhatsApp}
        onNewSale={() => setSuccessOrder(null)}
      />

      <div className="space-y-2 rounded-2xl border p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Diskon</span>
          <span>{formatCurrency(store.discount)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatCurrency(totals.total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {activeMethods.map((method) => (
          <Button
            key={method.id}
            variant={store.paymentMethod === method.name.toLowerCase() ? 'default' : 'outline'}
            onClick={() => store.setPaymentMethod(method.name.toLowerCase())}
          >
            {method.name}
          </Button>
        ))}
      </div>

      {store.paymentMethod === 'tunai' ? (
        <div className="space-y-2">
          <Input
            inputMode="numeric"
            placeholder="Nominal diterima"
            value={store.paidAmount || ''}
            onChange={(event) => store.setPaidAmount(Number(event.target.value) || 0)}
          />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Kembalian</span>
            <span className="font-semibold">{formatCurrency(totals.change)}</span>
          </div>
        </div>
      ) : null}

      <Button className="h-12 text-base" disabled={store.cartItems.length === 0} onClick={handleCheckout}>
        Selesaikan Pembayaran
      </Button>
    </div>
  )
}
