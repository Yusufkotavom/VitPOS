import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/format-currency'
import { selectPosTotals, usePosStore } from '@/features/pos/stores/pos-store'
import { type PosPaymentMethod } from '@/features/pos/types/pos.types'
import { posTransactionService } from '@/features/pos/services/pos-transaction.service'
import { toast } from 'sonner'

const paymentMethods: { code: PosPaymentMethod; label: string }[] = [
  { code: 'tunai', label: 'Tunai' },
  { code: 'qris', label: 'QRIS' },
  { code: 'kartu', label: 'Kartu' },
  { code: 'transfer', label: 'Transfer' },
  { code: 'e-wallet', label: 'E-wallet' },
  { code: 'piutang', label: 'Piutang' },
]

export function PaymentSummary() {
  const store = usePosStore()
  const totals = selectPosTotals(store)

  async function handleCheckout() {
    if (store.cartItems.length === 0) return

    try {
      await posTransactionService.checkout(store.cartItems, totals, store.paymentMethod, store.paidAmount, store.discount)
      toast.success('Pembayaran berhasil dicatat dan masuk antrean sinkron')
      store.clearCart()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mencatat pembayaran'
      toast.error(message)
    }
  }

  return (
    <div className="flex flex-col gap-4">
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
        {paymentMethods.map((method) => (
          <Button
            key={method.code}
            variant={store.paymentMethod === method.code ? 'default' : 'outline'}
            onClick={() => store.setPaymentMethod(method.code)}
          >
            {method.label}
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
