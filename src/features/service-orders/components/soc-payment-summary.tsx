import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/format-currency'
import { useServiceOrderCreateStore } from '@/features/service-orders/stores/service-order-create-store'
import { socTransactionService } from '@/features/service-orders/services/soc-transaction.service'
import { usePaymentMethods } from '@/features/settings/hooks/use-payment-methods'
import { toast } from 'sonner'
import { useState } from 'react'
import { PosSuccessDialog } from '@/features/pos/components/pos-success-dialog'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { localDb } from '@/services/local-db/client'
import { messageTemplateService } from '@/services/message-template.service'
import { type PosOrderSummary } from '@/features/pos/types/pos-order.types'
import { usePdf } from '@/shared/components/pdf/use-pdf'
import type { PdfData } from '@/shared/components/pdf/types'
import { User } from 'lucide-react'

const defaultMethods = [
  { id: 'tunai', name: 'Tunai' },
  { id: 'qris', name: 'QRIS' },
  { id: 'transfer', name: 'Transfer' },
]

export function SocPaymentSummary({ onComplete }: { onComplete?: () => void }) {
  const store = useServiceOrderCreateStore()
  const dbMethods = usePaymentMethods()
  const activeMethods = dbMethods && dbMethods.length > 0 ? dbMethods.filter((m) => m.status === 'Aktif') : defaultMethods
  
  const [successOrder, setSuccessOrder] = useState<PosOrderSummary | null>(null)
  const { downloadPdf } = usePdf()

  const totals = {
    subtotal: store.items.reduce((sum, item) => sum + item.subtotal, 0),
    total: store.items.reduce((sum, item) => sum + item.subtotal, 0)
  }

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

  const [paidAmount, setPaidAmount] = useState(totals.total)
  const [paymentMethod, setPaymentMethod] = useState('tunai')

  async function handleCheckout() {
    try {
      const result = await socTransactionService.checkout(
        store.items,
        totals,
        paymentMethod,
        paidAmount,
        store.customerName,
        store.customerId,
        {
          description: store.description,
          notes: store.notes,
          status: store.status,
          estimatedCompletion: store.estimatedCompletion
        }
      )

      if (!result) {
        throw new Error('Transaksi gagal')
      }

      setSuccessOrder({
        id: result.serviceOrderId,
        code: result.code,
        date: new Date(),
        subtotal: totals.subtotal,
        tax: 0,
        discount: 0,
        total: totals.total,
        paymentMethod: paymentMethod,
        amountPaid: paidAmount,
        change: Math.max(paidAmount - totals.total, 0),
        items: store.items,
        customerId: store.customerId,
        customerName: store.customerName ?? 'Umum',
        cashierName: 'Kasir',
      })
      store.clear()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mencatat order'
      toast.error(message)
    }
  }

  async function handlePrint() {
    if (!successOrder || !receiptData) return
    await downloadPdf(receiptData, `struk-srv-${successOrder.code}`)
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

    const text = await messageTemplateService.render('service_order_masuk', {
      code: successOrder.code,
      date: successOrder.date.toLocaleDateString('id-ID'),
      customer_name: successOrder.customerName ?? 'Umum',
      device: store.description.split('\n')[0] || store.description,
      problem: store.description,
      status: store.status,
      cost: formatCurrency(successOrder.total),
      estimated_completion: store.estimatedCompletion ? new Date(store.estimatedCompletion).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-',
      items,
      total,
      paid,
      remaining: formatCurrency(Math.max(successOrder.total - successOrder.amountPaid, 0)),
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
        detailRoute="/service-orders"
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
        <h3 className="font-medium text-sm text-muted-foreground">Detail Pekerjaan</h3>
        <p className="text-sm border p-2 rounded bg-muted/20">{store.description}</p>

        <h3 className="font-medium text-sm text-muted-foreground mt-3">Item Biaya</h3>
        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
          {store.items.map(item => (
            <div key={item.productId} className="flex justify-between text-sm">
              <div className="flex-1 pr-2">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground ml-2">x{item.qty}</span>
              </div>
              <span className="font-medium">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
          {store.items.length === 0 && (
            <p className="text-xs text-muted-foreground">Tidak ada item biaya khusus (hanya service)</p>
          )}
        </div>
      </div>
      
      <Separator />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-xl font-bold pt-2">
          <span>Total Estimasi Biaya</span>
          <span className="text-primary">{formatCurrency(totals.total)}</span>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="text-sm font-medium">Metode Pembayaran</label>
        <div className="grid grid-cols-3 gap-2">
          {activeMethods.map((method: { id: string; name: string }) => (
            <Button
              key={method.id}
              variant={paymentMethod === method.name.toLowerCase() ? 'default' : 'outline'}
              onClick={() => setPaymentMethod(method.name.toLowerCase())}
              size="sm"
            >
              {method.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3 p-4 border rounded-2xl bg-muted/10">
        <label className="text-sm font-medium">DP / Uang Dibayar</label>
        <Input
          inputMode="numeric"
          placeholder="Isi 0 jika tidak ada DP"
          value={paidAmount || ''}
          onChange={(event) => setPaidAmount(Number(event.target.value) || 0)}
          className="text-lg font-semibold h-12"
        />
        <div className="flex justify-between items-center text-sm pt-2">
          {paidAmount > 0 && paidAmount < totals.total ? (
            <>
              <span className="text-destructive font-medium">Sisa Tagihan</span>
              <span className="text-destructive font-bold">{formatCurrency(totals.total - paidAmount)}</span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">Kembalian</span>
              <span className="text-lg font-bold text-success">{formatCurrency(Math.max((paidAmount || totals.total) - totals.total, 0))}</span>
            </>
          )}
        </div>
      </div>

      <Button size="lg" className="h-14 text-lg font-semibold w-full mt-2" onClick={handleCheckout}>
        Proses Service Order
      </Button>
    </div>
  )
}
