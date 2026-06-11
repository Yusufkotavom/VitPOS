import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HeldSaleBanner } from '@/features/pos/components/held-sale-banner'
import { useSyncStore } from '@/features/sync/stores/sync-store'
import { CartPanel } from '@/features/pos/components/cart-panel'
import { CategoryTabs } from '@/features/pos/components/category-tabs'
import { PaymentSummary } from '@/features/pos/components/payment-summary'
import { ProductGrid } from '@/features/pos/components/product-grid'
import { ProductSearch } from '@/features/pos/components/product-search'
import { PosCustomerSelect } from '@/features/pos/components/pos-customer-select'
import { selectPosTotals, usePosStore } from '@/features/pos/stores/pos-store'
import { formatCurrency } from '@/lib/format-currency'
import { toast } from 'sonner'
import { posTransactionService } from '@/features/pos/services/pos-transaction.service'
import { useActiveShift } from '@/features/shift/hooks/use-active-shift'
import { useNavigate } from 'react-router-dom'
import { LockIcon } from 'lucide-react'

export function PosPage() {
  const syncSummary = useSyncStore()
  const store = usePosStore()
  const totals = selectPosTotals(store)
  const hasItems = totals.itemCount > 0
  const activeShift = useActiveShift()
  const navigate = useNavigate()
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isDrafting, setIsDraftingState] = useState(false)
  const isDraftingRef = useRef(false)
  const setDrafting = (v: boolean) => { isDraftingRef.current = v; setIsDraftingState(v) }

  if (activeShift === undefined) {
    return <div className="flex h-[100dvh] items-center justify-center text-muted-foreground">Memeriksa sesi kasir...</div>
  }

  if (activeShift === null) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-muted/20">
        <div className="rounded-2xl border bg-background p-8 text-center shadow-sm max-w-md w-full mx-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <LockIcon className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Sesi Kasir Belum Dibuka</h2>
          <p className="text-muted-foreground mb-6">
            Anda harus membuka sesi shift (memasukkan modal awal) sebelum dapat menggunakan mesin POS.
          </p>
          <Button size="lg" className="w-full" onClick={() => navigate('/shift')}>
            Buka Shift Sekarang
          </Button>
        </div>
      </div>
    )
  }

  async function handleDraft() {
    if (!hasItems || isDraftingRef.current) return
    setDrafting(true)
    try {
      await posTransactionService.saveDraft(store.cartItems, totals, store.discount, store.customerName, store.customerId, activeShift.id)
      toast.success('Draft berhasil disimpan')
      store.clearCart()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan draft')
    } finally {
      setDrafting(false)
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-muted/20">
      <header className="px-4 py-4">
        <div className="mx-auto grid max-w-screen-2xl gap-3 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Pelanggan</p>
            <PosCustomerSelect />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Produk</p>
            <ProductSearch />
          </div>
        </div>
      </header>

      <HeldSaleBanner visible={hasItems && syncSummary.pendingCount > 0} />

      <main className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="sticky top-0 z-10 border-b bg-background/95 p-4 backdrop-blur">
            <CategoryTabs />
          </div>
          <div className="p-4">
            <ProductGrid />
          </div>
        </div>

        {/* Kanan: Keranjang (Desktop) */}
        <aside className="hidden w-[400px] flex-col border-l bg-background xl:flex">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold">Keranjang</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {totals.itemCount} item
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <CartPanel />
          </div>
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Total</span>
              <span className="text-xl font-bold">{formatCurrency(totals.total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={!hasItems || isDrafting} onClick={handleDraft}>
                {isDrafting ? 'Menyimpan...' : 'Simpan Draft'}
              </Button>
              <Button disabled={!hasItems} onClick={() => setIsPaymentOpen(true)}>
                Bayar
              </Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer Bawah: Keranjang (Mobile) */}
      <div className="border-t bg-background p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] xl:hidden z-20 sticky bottom-0">
        <div className="mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{totals.itemCount} item</p>
            <p className="text-lg font-bold">{formatCurrency(totals.total)}</p>
          </div>
          <Button variant="outline" size="sm" disabled={!hasItems || isDrafting} onClick={handleDraft}>
            {isDrafting ? '...' : 'Draft'}
          </Button>
          <Button size="lg" className="min-w-32" disabled={!hasItems} onClick={() => setIsPaymentOpen(true)}>
            Bayar
          </Button>
        </div>
      </div>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <PaymentSummary onComplete={() => setIsPaymentOpen(false)} shiftId={activeShift.id} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
