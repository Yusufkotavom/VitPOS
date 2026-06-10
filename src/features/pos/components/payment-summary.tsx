import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/format-currency'
import { selectPosTotals, usePosStore } from '@/features/pos/stores/pos-store'
import { posTransactionService } from '@/features/pos/services/pos-transaction.service'
import { usePaymentMethods } from '@/features/settings/hooks/use-payment-methods'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { PosSuccessDialog } from '@/features/pos/components/pos-success-dialog'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { localDb } from '@/services/local-db/client'
import { messageTemplateService } from '@/services/message-template.service'
import { type PosOrderSummary } from '@/features/pos/types/pos-order.types'
import type { LocalPaymentMethod } from '@/services/local-db/schema'
import { usePdf } from '@/shared/components/pdf/use-pdf'
import type { PdfData } from '@/shared/components/pdf/types'
import { User } from 'lucide-react'

const defaultMethods = [
  { id: 'tunai', name: 'Tunai' },
  { id: 'qris', name: 'QRIS' },
  { id: 'transfer', name: 'Transfer' },
]

export function PaymentSummary({ onComplete }: { onComplete?: () => void }) {
  const store = usePosStore()
  const totals = selectPosTotals(store)
  const dbMethods = usePaymentMethods()
  const activeMethods = dbMethods && dbMethods.length > 0 ? dbMethods.filter((m) => m.status === 'Aktif') : defaultMethods

  const selectedMethodObj = activeMethods.find(m => m.name.toLowerCase() === store.paymentMethod) as LocalPaymentMethod | undefined
  
  const [successOrder, setSuccessOrder] = useState<PosOrderSummary | null>(null)
  const { downloadPdf } = usePdf()

  const receiptData: PdfData | null = successOrder ? {
    type: 'receipt',
    code: successOrder.code,
    date: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(successOrder.date),
    cashierName: successOrder.cashierName || 'Kasir',
    customer: { name: successOrder.customerName ?? 'Umum' },
    items: successOrder.items.map(i => ({ name: i.name, qty: i.qty, price: i.price, subtotal: i.subtotal })),
    summary: {
      subtotal: successOrder.subtotal,
      discount: successOrder.discount,
      grandTotal: successOrder.total,
      paidTotal: successOrder.amountPaid,
      status: successOrder.amountPaid >= successOrder.total ? 'Lunas' : 'Sebagian',
    },
    paymentMethod: successOrder.paymentMethod,
  } : null

  const setPaidAmount = usePosStore(s => s.setPaidAmount)
  useEffect(() => {
    setPaidAmount(totals.total)
  }, [setPaidAmount, totals.total])

  async function handleCheckout() {
    if (store.cartItems.length === 0) return

    try {
      const result = await posTransactionService.checkout(store.cartItems, totals, store.paymentMethod, store.paidAmount, store.discount, store.customerName, store.customerId)
      if (!result) {
        throw new Error('Transaksi tidak menghasilkan data order')
      }
      setSuccessOrder({
        id: result.salesOrderId,
        code: result.code,
        date: new Date(),
        subtotal: totals.subtotal,
        tax: 0,
        discount: store.discount,
        total: totals.total,
        paymentMethod: store.paymentMethod,
        amountPaid: store.paidAmount,
        change: Math.max(store.paidAmount - totals.total, 0),
        items: store.cartItems,
        customerId: store.customerId,
        customerName: store.customerName ?? 'Umum',
        cashierName: 'Kasir',
      })
      store.clearCart()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mencatat pembayaran'
      toast.error(message)
    }
  }

  async function handlePrint() {
    if (!successOrder || !receiptData) return
    await downloadPdf(receiptData, `struk-${successOrder.code}`)
  }

  async function handleWhatsApp() {
    if (!successOrder) return
    const customerId = successOrder.customerId
    let phone = ''
    if (customerId) {
      const customer = await localDb.customers.get(customerId)
      phone = customer?.phone ?? ''
    }
    if (!phone) {
      toast.error('Nomor WhatsApp pelanggan tidak ditemukan')
      return
    }

    const paid = formatCurrency(successOrder.amountPaid)
    const total = formatCurrency(successOrder.total)
    const change = formatCurrency(successOrder.change)
    const items = successOrder.items
      .map((item) => `${item.name} x${item.qty} = ${formatCurrency(item.subtotal)}`)
      .join('\n')

    const text = await messageTemplateService.render('invoice', {
      code: successOrder.code,
      date: successOrder.date.toLocaleDateString('id-ID'),
      customer_name: successOrder.customerName ?? 'Umum',
      items,
      total,
      paid,
      change,
      payment_method: successOrder.paymentMethod,
      store_name: '',
    })

    window.open(buildWhatsAppLink(phone, text), '_blank')
  }

  return (
    <div className="flex flex-col gap-4">
      <PosSuccessDialog 
        open={successOrder !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setSuccessOrder(null)
            onComplete?.()
          }
        }}
        order={successOrder}
        onPrint={handlePrint}
        onWhatsApp={handleWhatsApp}
        onNewSale={() => {
          setSuccessOrder(null)
          onComplete?.()
        }}
      />

      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
        <User className="size-4 text-muted-foreground" />
        <span className="font-medium">{store.customerName || 'Umum'}</span>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground">Detail Pesanan</h3>
        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
          {store.cartItems.map(item => (
            <div key={item.productId} className="flex justify-between text-sm">
              <div className="flex-1 pr-2">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground ml-2">x{item.qty}</span>
                {item.note && <p className="text-xs text-muted-foreground truncate">{item.note}</p>}
              </div>
              <span className="font-medium">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>
      </div>
      
      <Separator />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Diskon Tambahan</span>
          <Input 
            type="number"
            className="w-28 h-8 text-right bg-muted/30"
            value={store.discount || ''}
            onChange={(e) => store.setDiscount(Number(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        <div className="flex justify-between text-xl font-bold pt-2">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(totals.total)}</span>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="text-sm font-medium">Metode Pembayaran</label>
        <div className="grid grid-cols-3 gap-2">
          {activeMethods.map((method: { id: string; name: string }) => (
            <Button
              key={method.id}
              variant={store.paymentMethod === method.name.toLowerCase() ? 'default' : 'outline'}
              onClick={() => store.setPaymentMethod(method.name.toLowerCase())}
              size="sm"
            >
              {method.name}
            </Button>
          ))}
        </div>
      </div>

      {selectedMethodObj && (selectedMethodObj.qrImageUrl || selectedMethodObj.instructions) && (
        <div className="bg-primary/5 rounded-xl p-4 flex flex-col items-center justify-center gap-3 border border-primary/20">
          <h4 className="font-semibold text-primary">{selectedMethodObj.name}</h4>
          {selectedMethodObj.qrImageUrl && (
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <img 
                src={selectedMethodObj.qrImageUrl} 
                alt={`QRIS ${selectedMethodObj.name}`} 
                className="w-48 h-48 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="w-48 h-48 flex items-center justify-center bg-muted/30 text-muted-foreground text-xs text-center rounded">Gambar<br/>Gagal Dimuat</div>';
                }}
              />
            </div>
          )}
          {selectedMethodObj.instructions && (
            <div className="text-sm text-center text-muted-foreground whitespace-pre-wrap mt-2">
              {selectedMethodObj.instructions}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 p-4 border rounded-2xl bg-muted/10">
        <label className="text-sm font-medium">Uang Diterima / Dibayar</label>
        <Input
          inputMode="numeric"
          placeholder={`Minimal ${formatCurrency(totals.total)}`}
          value={store.paidAmount || ''}
          onChange={(event) => store.setPaidAmount(Number(event.target.value) || 0)}
          className="text-lg font-semibold h-12"
        />
        <div className="flex justify-between items-center text-sm pt-2">
          {store.paidAmount > 0 && store.paidAmount < totals.total ? (
            <>
              <span className="text-destructive font-medium">Kurang Bayar (DP)</span>
              <span className="text-destructive font-bold">{formatCurrency(totals.total - store.paidAmount)}</span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">Kembalian</span>
              <span className="text-lg font-bold text-success">{formatCurrency(Math.max((store.paidAmount || totals.total) - totals.total, 0))}</span>
            </>
          )}
        </div>
      </div>

      <Button size="lg" className="h-14 text-lg font-semibold w-full mt-2" disabled={store.cartItems.length === 0} onClick={handleCheckout}>
        {selectedMethodObj?.qrImageUrl ? 'Verifikasi & Selesaikan' : 'Selesaikan Pembayaran'}
      </Button>
    </div>
  )
}

