import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HeldSaleBanner } from '@/features/pos/components/held-sale-banner'
import { useSyncStore } from '@/features/sync/stores/sync-store'
import { CartPanel } from '@/features/pos/components/cart-panel'
import { CategoryTabs } from '@/features/pos/components/category-tabs'
import { PaymentSummary } from '@/features/pos/components/payment-summary'
import { PosDraftDialog } from '@/features/pos/components/pos-draft-dialog'
import { ProductGrid } from '@/features/pos/components/product-grid'
import { ProductSearch } from '@/features/pos/components/product-search'
import { PosCustomerSelect } from '@/features/pos/components/pos-customer-select'
import { selectPosTotals, usePosStore } from '@/features/pos/stores/pos-store'
import { formatCurrency } from '@/lib/format-currency'
import { toast } from 'sonner'
import { posTransactionService } from '@/features/pos/services/pos-transaction.service'
import { useActiveShift } from '@/features/shift/hooks/use-active-shift'
import { useNavigate, Link } from 'react-router-dom'
import { LockIcon, Clock, FileText, Wrench, PlusCircle, ArrowLeft } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { shiftRepository } from '@/services/local-db/repository'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { useQueryClient } from '@tanstack/react-query'
import { useMediaQuery } from '@/hooks/use-media-query'

export function PosPage() {
  const { t } = useTranslation()
  const syncSummary = useSyncStore()
  const store = usePosStore()
  const totals = selectPosTotals(store)
  const hasItems = totals.itemCount > 0
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const activeShift = useActiveShift()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isDrafting, setIsDraftingState] = useState(false)
  const isDraftingRef = useRef(false)
  const setDrafting = (v: boolean) => { isDraftingRef.current = v; setIsDraftingState(v) }

  const [startCash, setStartCash] = useState('')
  const [isDraftsOpen, setIsDraftsOpen] = useState(false)
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)

  async function handleOpenShift() {
    if (!startCash) return toast.error(t('pos.start_cash_required'))
    try {
      await shiftRepository.upsert({
        id: crypto.randomUUID(),
        tenantId: resolveTenantId(),
        cashierName: t('shift.active_cashier'),
        startTime: new Date().toISOString(),
        startCash: parseFloat(startCash),
        status: 'open',
      })
      toast.success(t('shift.opened'))
      setStartCash('')
      await queryClient.invalidateQueries({ queryKey: ['active-shift'] })
    } catch (error) {
      toast.error(`${t('pos.shift_open_failed')}${error instanceof Error ? error.message : t('common.error_generic')}`)
    }
  }

  if (activeShift === undefined) {
    return <div className="flex h-[100dvh] items-center justify-center text-muted-foreground">{t('pos.checking_session')}</div>
  }

  async function handleDraft() {
    if (!hasItems || isDraftingRef.current) return
    setDrafting(true)
    try {
      await posTransactionService.saveDraft(store.cartItems, totals, store.discount, store.customerName, store.customerId, activeShift?.id)
      toast.success(t('pos.draft_saved'))
      store.clearCart()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('pos.draft_save_failed'))
    } finally {
      setDrafting(false)
    }
  }

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
        <div className="mx-auto grid max-w-screen-2xl gap-3 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{t('pos.customer')}</p>
              <div className="flex items-center gap-1 text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/shift')}>
                        <Clock className={`h-4 w-4 ${activeShift ? 'text-emerald-500' : 'text-orange-500'}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('pos.check_shift')}</p>
                    </TooltipContent>
                  </Tooltip>
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
                </TooltipProvider>
              </div>
            </div>
            <PosCustomerSelect />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t('nav.products')}</p>
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
            <h2 className="font-semibold">{t('pos.cart')}</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {t('pos.item_count', { count: totals.itemCount })}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <CartPanel />
          </div>
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">{t('common.total')}</span>
              <span className="text-xl font-bold">{formatCurrency(totals.total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={!hasItems || isDrafting} onClick={handleDraft}>
                {isDrafting ? t('pos.saving') : t('pos.save_draft')}
              </Button>
              <Button disabled={!hasItems} onClick={() => setIsPaymentOpen(true)}>
                {t('pos.submit_payment')}
              </Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer Bawah: Keranjang (Mobile) */}
      <div className="border-t bg-background p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] xl:hidden z-20 sticky bottom-0">
        <div className="mx-auto flex items-center gap-3">
          <div className="flex-1 cursor-pointer" onClick={() => setIsMobileCartOpen(true)}>
            <p className="text-xs text-muted-foreground">{t('pos.item_count', { count: totals.itemCount })} <span className="underline ml-1">{t('pos.see_detail')}</span></p>
            <p className="text-lg font-bold">{formatCurrency(totals.total)}</p>
          </div>
          <Button variant="outline" size="sm" disabled={!hasItems || isDrafting} onClick={handleDraft}>
            {isDrafting ? '...' : t('pos.draft_short')}
          </Button>
          <Button size="lg" className="min-w-32" disabled={!hasItems} onClick={() => setIsPaymentOpen(true)}>
            {t('pos.submit_payment')}
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
              <PaymentSummary onComplete={() => setIsPaymentOpen(false)} shiftId={activeShift?.id} />
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
              <PaymentSummary onComplete={() => setIsPaymentOpen(false)} shiftId={activeShift?.id} />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {isDesktop ? (
        <Dialog open={activeShift === null} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md pointer-events-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <LockIcon className="h-8 w-8 text-orange-600" />
              </div>
              <DialogTitle className="text-center text-xl">{t('pos.cashier_session_closed')}</DialogTitle>
              <DialogDescription className="text-center">
                {t('pos.enter_start_cash')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>{t('pos.start_cash_label')}</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={startCash}
                  onChange={(e) => setStartCash(e.target.value)}
                  placeholder={t('pos.example_cash')}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button size="lg" className="w-full sm:w-auto" onClick={handleOpenShift}>{t('pos.open_shift_now')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={activeShift === null} onOpenChange={() => {}} dismissible={false}>
          <DrawerContent>
            <DrawerHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <LockIcon className="h-8 w-8 text-orange-600" />
              </div>
              <DrawerTitle className="text-center text-xl">{t('pos.cashier_session_closed')}</DrawerTitle>
              <DrawerDescription className="text-center">
                {t('pos.enter_start_cash')}
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>{t('pos.start_cash_label')}</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={startCash}
                  onChange={(e) => setStartCash(e.target.value)}
                  placeholder={t('pos.example_cash')}
                  autoFocus
                />
              </div>
              <Button size="lg" className="w-full" onClick={handleOpenShift}>{t('pos.open_shift_now')}</Button>
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
            <CartPanel />
          </div>
          <div className="border-t p-4 space-y-3 bg-background">
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">{t('common.total')}</span>
              <span className="text-xl font-bold">{formatCurrency(totals.total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={!hasItems || isDrafting} onClick={() => { setIsMobileCartOpen(false); handleDraft(); }}>
                {isDrafting ? t('pos.saving') : t('pos.save_draft')}
              </Button>
              <Button disabled={!hasItems} onClick={() => { setIsMobileCartOpen(false); setIsPaymentOpen(true); }}>
                {t('pos.submit_payment')}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <PosDraftDialog open={isDraftsOpen} onOpenChange={setIsDraftsOpen} />
    </div>
  )
}
