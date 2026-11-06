import { useState } from 'react'
import {
  Check,
  Copy,
  MessageCircle,
  Package,
  Truck,
  Store,
  Calendar,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format-currency'
import type { TrackedOrder, StoreInfo } from '@/features/storefront/api/storefront.api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: TrackedOrder | null
  store: StoreInfo | null
}

function formatDateFull(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return dateStr
  }
}

function parseOrderNotes(notes?: string | null) {
  if (!notes) return { isDelivery: false, address: null, notesText: null }
  const isDelivery = notes.includes('Kirim ke Alamat')
  const addressMatch = notes.match(/Alamat:\s*([^|]+)/)
  const notesMatch = notes.match(/Catatan:\s*([^|]+)/)
  return {
    isDelivery,
    address: addressMatch ? addressMatch[1].trim() : null,
    notesText: notesMatch ? notesMatch[1].trim() : null,
  }
}

function getStatusBadge(status: string) {
  const s = status?.toLowerCase() ?? ''
  if (s === 'paid' || s === 'lunas') {
    return { label: 'Lunas', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
  }
  if (s === 'partial' || s === 'sebagian') {
    return { label: 'Sebagian', className: 'bg-amber-100 text-amber-800 border-amber-200' }
  }
  if (s === 'confirmed' || s === 'dikonfirmasi') {
    return { label: 'Dikonfirmasi', className: 'bg-blue-100 text-blue-800 border-blue-200' }
  }
  if (s === 'unpaid' || s === 'belum bayar' || s === 'pending') {
    return { label: 'Belum Bayar', className: 'bg-rose-100 text-rose-800 border-rose-200' }
  }
  if (s === 'cancelled' || s === 'batal') {
    return { label: 'Batal', className: 'bg-gray-100 text-gray-700 border-gray-200' }
  }
  return { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' }
}

export function OrderTrackDetailDialog({ open, onOpenChange, order, store }: Props) {
  const [copied, setCopied] = useState(false)

  if (!order) return null

  const orderNum = order.orderNumber || order.code || order.id
  const statusInfo = getStatusBadge(order.status)
  const { isDelivery, address, notesText } = parseOrderNotes(order.notes)
  const remaining = Number(order.grandTotal) - Number(order.paidTotal)

  function handleCopyOrderNumber() {
    if (orderNum) {
      navigator.clipboard.writeText(orderNum)
      setCopied(true)
      toast.success('Nomor pesanan berhasil disalin')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleContactStore() {
    if (!store?.phone) {
      toast.info('Nomor kontak toko belum tersedia')
      return
    }
    const cleanPhone = store.phone.replace(/\D/g, '')
    const targetPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone
    const msg = `Halo ${store.name}, saya ingin menanyakan status pesanan saya dengan nomor *#${orderNum}*. Mohon informasinya, terima kasih!`
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Detail Pesanan
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Informasi lengkap pesanan Anda
              </DialogDescription>
            </div>
            <Badge className={`text-xs font-semibold px-2.5 py-1 ${statusInfo.className}`} variant="outline">
              {statusInfo.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-4">
          {/* Order Identity Card */}
          <div className="rounded-2xl border bg-muted/20 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Nomor Pesanan</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-bold text-primary">#{orderNum}</span>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-gray-900 transition-colors"
                  aria-label="Salin nomor pesanan"
                >
                  {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="size-3.5" />
                Tanggal
              </span>
              <span className="font-medium text-gray-800">{formatDateFull(order.date)}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                {isDelivery ? <Truck className="size-3.5" /> : <Store className="size-3.5" />}
                Metode
              </span>
              <span className="font-medium text-gray-800">
                {isDelivery ? 'Kirim ke Alamat' : 'Ambil di Toko'}
              </span>
            </div>

            {address && (
              <div className="border-t pt-2 text-xs">
                <span className="text-muted-foreground block mb-0.5">Alamat Pengiriman:</span>
                <p className="font-medium text-gray-800 leading-relaxed">{address}</p>
              </div>
            )}

            {notesText && (
              <div className="border-t pt-2 text-xs">
                <span className="text-muted-foreground block mb-0.5">Catatan Pesanan:</span>
                <p className="font-medium text-gray-700 italic">{notesText}</p>
              </div>
            )}
          </div>

          {/* Product Items List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="size-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Item Pesanan ({order.items?.length || order.itemCount || 0})
              </h3>
            </div>

            {order.items && order.items.length > 0 ? (
              <div className="divide-y rounded-2xl border bg-white overflow-hidden shadow-xs">
                {order.items.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.qty} × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 shrink-0">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                Detail item tidak tersedia
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="space-y-2 rounded-2xl border bg-white p-4 shadow-xs text-sm">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b">
              <CreditCard className="size-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rincian Pembayaran
              </h3>
            </div>

            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="text-gray-900">{formatCurrency(order.subtotal || order.grandTotal)}</span>
            </div>

            <div className="flex items-center justify-between font-bold text-gray-900 border-t pt-2">
              <span>Total Tagihan</span>
              <span className="text-primary text-base">{formatCurrency(order.grandTotal)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-emerald-700">
              <span>Sudah Dibayar</span>
              <span className="font-semibold">{formatCurrency(order.paidTotal)}</span>
            </div>

            {remaining > 0 && (
              <div className="flex items-center justify-between text-xs text-rose-600 font-semibold border-t border-dashed pt-1.5">
                <span>Sisa Pembayaran</span>
                <span>{formatCurrency(remaining)}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t bg-gray-50/70 px-6 py-4 flex-col sm:flex-row gap-2">
          {store?.phone && (
            <Button
              type="button"
              className="w-full sm:flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={handleContactStore}
            >
              <MessageCircle className="mr-2 size-4" />
              Tanya Toko via WhatsApp
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
