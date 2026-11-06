import { useState } from 'react'
import { Plus, Minus, Trash2, ShoppingBag, Truck, Store, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { formatCurrency } from '@/lib/format-currency'
import {
  submitStoreCheckout,
  type StoreProduct,
  type CheckoutResponse,
} from '@/features/storefront/api/storefront.api'

interface CartItem {
  product: StoreProduct
  qty: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  slug: string
  items: CartItem[]
  onUpdateQty: (productId: string, qty: number) => void
  onRemoveItem: (productId: string) => void
  onCheckoutSuccess: (data: CheckoutResponse) => void
}

export function StorefrontCartDrawer({
  open,
  onOpenChange,
  slug,
  items,
  onUpdateQty,
  onRemoveItem,
  onCheckoutSuccess,
}: Props) {
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0)
  const totalPrice = items.reduce((sum, i) => sum + Number(i.product.price) * i.qty, 0)

  async function handleCheckout() {
    if (items.length === 0) {
      toast.error('Keranjang belanja Anda masih kosong')
      return
    }

    const trimmedName = name.trim()
    const cleanPhone = phone.replace(/\D/g, '')

    if (!trimmedName) {
      toast.error('Silakan isi nama lengkap pemesan')
      return
    }

    if (cleanPhone.length < 8) {
      toast.error('Silakan masukkan nomor WhatsApp yang valid (minimal 8 digit)')
      return
    }

    if (orderType === 'delivery' && !address.trim()) {
      toast.error('Alamat pengiriman wajib diisi untuk layanan kirim ke alamat')
      return
    }

    setSubmitting(true)
    try {
      const response = await submitStoreCheckout(slug, {
        customer: {
          name: trimmedName,
          phone: cleanPhone,
          address: orderType === 'delivery' ? address.trim() : undefined,
          notes: notes.trim() || undefined,
        },
        orderType,
        items: items.map((i) => ({
          productId: i.product.id,
          qty: i.qty,
        })),
      })

      onOpenChange(false)
      onCheckoutSuccess(response)
      toast.success('Pesanan berhasil dibuat!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses pesanan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
        {/* Header */}
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-lg font-bold">
            <ShoppingBag className="size-5 text-primary" />
            Keranjang Belanja ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="size-12 text-muted-foreground/30 mb-3" />
              <p className="font-semibold text-gray-700">Keranjang masih kosong</p>
              <p className="text-sm text-muted-foreground mt-1">
                Pilih produk dari etalase untuk mulai memesan.
              </p>
            </div>
          ) : (
            <>
              {/* Product items list */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Daftar Produk
                </h3>
                {items.map(({ product, qty }) => {
                  const price = Number(product.price) || 0
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs font-semibold text-primary mt-0.5">
                          {formatCurrency(price)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center rounded-xl border bg-muted/40 p-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, qty - 1)}
                            className="flex size-7 items-center justify-center rounded-lg hover:bg-white active:scale-95 transition-all text-gray-700"
                            aria-label="Kurang satu"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-gray-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, qty + 1)}
                            className="flex size-7 items-center justify-center rounded-lg hover:bg-white active:scale-95 transition-all text-gray-700"
                            aria-label="Tambah satu"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(product.id)}
                          className="flex size-8 items-center justify-center rounded-xl text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label="Hapus item"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Delivery method */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Metode Pengambilan
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                      orderType === 'delivery'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm font-semibold'
                        : 'border-muted bg-white text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    <Truck className="size-4" />
                    Kirim ke Alamat
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                      orderType === 'pickup'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm font-semibold'
                        : 'border-muted bg-white text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    <Store className="size-4" />
                    Ambil di Toko
                  </button>
                </div>
              </div>

              {/* Customer info form */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Informasi Pemesan
                </h3>

                <div className="space-y-1.5">
                  <Label htmlFor="order-name" className="text-xs">
                    Nama Lengkap <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="order-name"
                    placeholder="Contoh: Budi Santoso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="order-phone" className="text-xs">
                    Nomor WhatsApp <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="order-phone"
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Digunakan untuk konfirmasi pesanan dan notifikasi pengiriman.
                  </p>
                </div>

                {orderType === 'delivery' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="order-address" className="text-xs">
                      Alamat Pengiriman Lengkap <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="order-address"
                      placeholder="Jalan, nomor rumah, RT/RW, kelurahan, patokan lokasi..."
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="rounded-xl text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="order-notes" className="text-xs">
                    Catatan Pesanan (Opsional)
                  </Label>
                  <Textarea
                    id="order-notes"
                    placeholder="Contoh: Tolong bungkus terpisah, instruksi khusus..."
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer sticky checkout */}
        {items.length > 0 && (
          <SheetFooter className="border-t bg-muted/20 px-6 py-4 flex flex-col gap-3 sm:flex-col sm:space-x-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Pembayaran</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(totalPrice)}
              </span>
            </div>

            <Button
              size="lg"
              className="w-full font-semibold rounded-xl h-12 text-base shadow"
              disabled={submitting}
              onClick={handleCheckout}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Memproses Pesanan...
                </>
              ) : (
                <>
                  Pesan Sekarang
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
