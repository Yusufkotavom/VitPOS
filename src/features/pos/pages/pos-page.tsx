import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HeldSaleBanner } from '@/features/pos/components/held-sale-banner'
import { useSyncStore } from '@/features/sync/stores/sync-store'
import { CartPanel } from '@/features/pos/components/cart-panel'
import { CategoryTabs } from '@/features/pos/components/category-tabs'
import { PaymentSummary } from '@/features/pos/components/payment-summary'
import { PosDraftDialog } from '@/features/pos/components/pos-draft-dialog'
import { PosSuccessDialog } from '@/features/pos/components/pos-success-dialog'
import { ProductGrid } from '@/features/pos/components/product-grid'
import { ProductSearch } from '@/features/pos/components/product-search'
import { PosCustomerSelect } from '@/features/pos/components/pos-customer-select'
import { CartItemEditDialog } from '@/features/pos/components/cart-item-edit-dialog'
import { ReceiptPrintLayout } from '@/features/pos/components/receipt-print-layout'
import { selectPosTotals, usePosStore } from '@/features/pos/stores/pos-store'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import { getDefaultCustomer } from '@/features/pos/lib/default-customer'
import { usePosShortcuts } from '@/features/pos/hooks/use-pos-shortcuts'
import { buildInvoicePdfData, buildOrderWhatsAppLink } from '@/features/pos/lib/order-receipt'
import { formatCurrency } from '@/lib/format-currency'
import { printPage } from '@/lib/print'
import { toast } from 'sonner'
import { posTransactionService } from '@/features/pos/services/pos-transaction.service'
import { useNavigate, Link } from 'react-router-dom'
import { FileText, Wrench, PlusCircle, ArrowLeft, ShoppingCart, Keyboard } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useMediaQuery } from '@/hooks/use-media-query'
import { usePdf } from '@/shared/components/pdf/use-pdf'
import { StatusBadge } from '@/shared/components/display/status-badge'
import type { PosOrderSummary } from '@/features/pos/types/pos-order.types'
import type { PosCartItem } from '@/features/pos/types/pos.types'

export function PosPage() {
  const { t } = useTranslation()
  const localCustomers = useCustomers()
  const syncSummary = useSyncStore()
  const store = usePosStore()
  const totals = selectPosTotals(store)
  const hasItems = totals.itemCount > 0
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const isWide = useMediaQuery('(min-width: 1280px)')
  const navigate = useNavigate()
  const { printPdf } = usePdf()
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isDrafting, setIsDraftingState] = useState(false)
  const isDraftingRef = useRef(false)
  const setDrafting = (v: boolean) => { isDraftingRef.current = v; setIsDraftingState(v) }
  const [isDraftsOpen, setIsDraftsOpen] = useState(false)
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)
  const [successOrder, setSuccessOrder] = useState<PosOrderSummary | null>(null)
  const [cartPulse, setCartPulse] = useState(false)
  const [editingItem, setEditingItem] = useState<PosCartItem | null>(null)

  function handleEditCartItem(item: PosCartItem) {
    setIsMobileCartOpen(false)
    setEditingItem(item)
  }

  useEffect(() => {
    if (!hasItems) return
    setCartPulse(true)
    const timeout = setTimeout(() => setCartPulse(false), 220)
    return () => clearTimeout(timeout)
  }, [totals.itemCount, hasItems])

  usePosShortcuts(
    {
      onFocusSearch: () => document.getElementById('pos-product-search')?.focus(),
      onOpenPayment: () => handlePayClick(),
      onClose: () => {
        setIsMobileCartOpen(false)
        setIsDraftsOpen(false)
        setIsPaymentOpen(false)
      },
    },
    isWide,
  )

  function handlePayClick() {
    if (!store.customerName || store.customerName.trim() === '') {
      const fallback = getDefaultCustomer(localCustomers)
      store.setCustomer(fallback.id, fallback.name)
    }
    if (!hasItems) {
      toast.error(t('pos.empty_cart_title'))
      return
    }
    setIsMobileCartOpen(false)
    setSuccessOrder(null)
    setIsPaymentOpen(true)
  }

  async function handleDraft() {
    if (!hasItems || isDraftingRef.current) return
    setDrafting(true)
    try {
      const fallback = getDefaultCustomer(localCustomers)
      const finalName = store.customerName?.trim() || fallback.name
      const finalId = store.customerName?.trim() ? store.customerId : fallback.id
      await posTransactionService.saveDraft(store.cartItems, totals, store.discount, finalName, finalId, store.orderNote)
      toast.success(t('pos.draft_saved'))
      store.clearCart()
      store.setCustomer(fallback.id, fallback.name)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('pos.draft_save_failed'))
    } finally {
      setDrafting(false)
    }
  }

  async function handlePrintSalesOrder() {
    if (!successOrder) return
    printPdf(await buildInvoicePdfData(successOrder, store.orderNote))
  }

  async function handleWhatsApp() {
    if (!successOrder) return
    const link = await buildOrderWhatsAppLink(successOrder)
    if (!link) {
      toast.error(t('pos.whatsapp_not_found'))
      return
    }
    window.open(link, '_blank')
  }

  const syncLabel = !syncSummary.isOnline
    ? t('sync.status_pending')
    : syncSummary.pendingCount > 0
      ? t('sync.status_pending')
      : t('sync.status_synced')

  const syncTone = !syncSummary.isOnline || syncSummary.pendingCount > 0 ? 'warning' : 'success'

  return (
    <div className="flex h-[100dvh] flex-col bg-muted/20">
      <div className="flex items-center gap-2 px-4 pt-4 pb-0 md:hidden">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="font-semibold text-sm">{t('common.back')}</span>
      </div>
      <header className="px-4 py-2 md:py-4">
        <div className="mx-auto max-w-screen-2xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">{t('pos.customer')}</p>
              <StatusBadge label={syncLabel} tone={syncTone} />
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsDraftsOpen(true)}>
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('pos.draft_list')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/service-orders')}>
                      <Wrench className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('pos.service_list')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/service-orders/new')}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('pos.new_service')}</p>
                  </TooltipContent>
                </Tooltip>
                {isWide && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => document.getElementById('pos-product-search')?.focus()}>
                        <Keyboard className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('pos.shortcut_hint')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          </div>
          <PosCustomerSelect />
        </div>
      </header>

      <HeldSaleBanner visible={hasItems && syncSummary.pendingCount > 0} />

      <main className="flex flex-1 overflow-hidden">
        <div className={`flex flex-1 flex-col overflow-y-auto ${isWide ? 'pb-0' : 'pb-[calc(5.5rem+env(safe-area-inset-bottom))]'}`}>
          <div className="sticky top-0 z-10 border-b bg-background/95 p-4 backdrop-blur">
            <CategoryTabs />
          </div>
          <div className="border-b px-4 py-3 md:py-3">
            <ProductSearch />
          </div>
          <div className="p-4">
            <ProductGrid />
          </div>
        </div>

        {/* Kanan: Keranjang (Tablet & Desktop) */}
        <aside className="hidden w-[360px] flex-col border-l bg-background md:flex xl:w-[400px]">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold">{t('pos.cart')}</h2>
            <span className={`rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition-transform ${cartPulse ? 'scale-110' : 'scale-100'}`}>
              {t('pos.item_count', { count: totals.itemCount })}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <CartPanel onEditItem={handleEditCartItem} />
          </div>
          <div className="space-y-3 border-t p-4">
            <div className="flex items-end justify-between">
              <span className="text-sm font-medium text-muted-foreground">{t('common.total')}</span>
              <span className="text-2xl font-bold">{formatCurrency(totals.total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={!hasItems || isDrafting} onClick={handleDraft}>
                {isDrafting ? t('pos.saving') : t('pos.save_draft')}
              </Button>
              <Button className="h-11" disabled={!hasItems} onClick={handlePayClick}>
                {t('pos.submit_payment')}
              </Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer Bawah: Keranjang (Mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:hidden">
        <div className="mx-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={() => setIsMobileCartOpen(true)}
            aria-label={t('pos.open_cart')}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{t('pos.item_count', { count: totals.itemCount })}</p>
            <p className="truncate text-lg font-bold">{formatCurrency(totals.total)}</p>
          </div>

          <Button size="lg" className="h-11 min-w-32" disabled={!hasItems} onClick={() => setIsMobileCartOpen(true)}>
            {t('pos.checkout')}
          </Button>
        </div>
      </div>

      {isDesktop ? (
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{t('pos.payment')}</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <PaymentSummary
                onSuccess={(order) => {
                  setIsPaymentOpen(false)
                  setSuccessOrder(order)
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DrawerContent className="h-[90vh]">
            <DrawerHeader className="border-b text-left">
              <DrawerTitle>{t('pos.payment')}</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <PaymentSummary
                onSuccess={(order) => {
                  setIsPaymentOpen(false)
                  setSuccessOrder(order)
                }}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Drawer Keranjang (Mobile) */}
      <Drawer open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
        <DrawerContent className="h-[85vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle>{t('pos.cart')} ({t('pos.item_count', { count: totals.itemCount })})</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <CartPanel onEditItem={handleEditCartItem} />
          </div>
          <div className="space-y-3 border-t bg-background p-4">
            <div className="space-y-2">
              <Label htmlFor="pos-mobile-order-note">{t('pos.note_optional')}</Label>
              <Textarea
                id="pos-mobile-order-note"
                value={store.orderNote}
                onChange={(event) => store.setOrderNote(event.target.value)}
                placeholder={t('pos.note_optional')}
                className="min-h-20 resize-none"
              />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-sm font-medium text-muted-foreground">{t('common.total')}</span>
              <span className="text-2xl font-bold">{formatCurrency(totals.total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-11" disabled={!hasItems || isDrafting} onClick={() => { setIsMobileCartOpen(false); handleDraft() }}>
                {isDrafting ? t('pos.saving') : t('pos.save_draft')}
              </Button>
              <Button className="h-11" disabled={!hasItems} onClick={handlePayClick}>
                {t('pos.submit_payment')}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <PosSuccessDialog
        open={successOrder !== null}
        onOpenChange={(open) => {
          if (!open) setSuccessOrder(null)
        }}
        order={successOrder}
        onPrint={() => printPage()}
        onPrintSalesOrder={handlePrintSalesOrder}
        onWhatsApp={handleWhatsApp}
        onNewSale={() => setSuccessOrder(null)}
      />

      <PosDraftDialog open={isDraftsOpen} onOpenChange={setIsDraftsOpen} />

      <CartItemEditDialog
        key={editingItem?.productId ?? 'empty'}
        item={editingItem}
        open={editingItem !== null}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSave={(updates) => {
          if (editingItem) store.updateItem(editingItem.productId, updates)
        }}
      />

      <ReceiptPrintLayout order={successOrder} />
    </div>
  )
}
