import { CheckCircle2, MessageCircle, ExternalLink, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format-currency'
import type { CheckoutResponse } from '@/features/storefront/api/storefront.api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderData: CheckoutResponse | null
  slug: string
  onContinueShopping: () => void
}

export function StorefrontSuccessDialog({
  open,
  onOpenChange,
  orderData,
  slug,
  onContinueShopping,
}: Props) {
  if (!orderData) return null

  const { order, customer, store, whatsappUrl } = orderData

  function handleSendWhatsApp() {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="size-8" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Pesanan Berhasil Dibuat!
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Pesanan Anda telah tercatat di sistem kami. Silakan kirim detail pesanan ke WhatsApp toko untuk konfirmasi pembayaran & proses pesanan.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 space-y-3 rounded-2xl border bg-muted/20 p-4 text-sm">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-muted-foreground">Nomor Pesanan</span>
            <span className="font-mono font-bold text-primary">{order.orderNumber}</span>
          </div>

          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-muted-foreground">Nama Pemesan</span>
            <span className="font-medium text-gray-800">{customer.name}</span>
          </div>

          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-muted-foreground">Nomor WhatsApp</span>
            <span className="font-medium text-gray-800">{customer.phone}</span>
          </div>

          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-muted-foreground">Tipe Pengambilan</span>
            <span className="font-medium text-gray-800">
              {order.orderType === 'pickup' ? 'Ambil di Toko' : 'Kirim ke Alamat'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold text-gray-900">Total Pembayaran</span>
            <span className="text-base font-bold text-emerald-600">
              {formatCurrency(order.grandTotal)}
            </span>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
          {whatsappUrl ? (
            <Button
              size="lg"
              className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700 shadow-md transition-all"
              onClick={handleSendWhatsApp}
            >
              <MessageCircle className="mr-2 size-5 fill-current" />
              Kirim Pesanan ke WhatsApp Toko
            </Button>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Nomor WhatsApp toko ({store.phone || '-'}) belum terdaftar untuk auto-redirect.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button asChild variant="outline" className="w-full text-xs sm:text-sm">
              <Link to={`/store/${slug}/track?phone=${encodeURIComponent(customer.phone)}`}>
                <ExternalLink className="mr-1.5 size-3.5" />
                Lacak Pesanan
              </Link>
            </Button>

            <Button
              variant="secondary"
              className="w-full text-xs sm:text-sm"
              onClick={onContinueShopping}
            >
              <Package className="mr-1.5 size-3.5" />
              Belanja Lagi
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
