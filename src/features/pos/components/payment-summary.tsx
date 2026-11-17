import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus, SplitSquareHorizontal, Trash2, User, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/format-currency'
import { selectPosTotals, usePosStore } from '@/features/pos/stores/pos-store'
import { posTransactionService } from '@/features/pos/services/pos-transaction.service'
import { usePaymentMethods } from '@/features/settings/hooks/use-payment-methods'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import { getDefaultCustomer, DEFAULT_CUSTOMER_NAME } from '@/features/pos/lib/default-customer'
import { getPaymentMethodDisplay, buildQuickCashOptions } from '@/features/pos/lib/payment-method-display'
import { CurrencyInput } from '@/shared/components/forms/currency-input'
import { useSubscription } from '@/features/settings/hooks/use-subscription'
import type { PosOrderSummary } from '@/features/pos/types/pos-order.types'
import type { LocalPaymentMethod } from '@/services/local-db/schema'

const defaultMethods = [
  { id: 'tunai', name: 'Tunai' },
  { id: 'qris', name: 'QRIS' },
  { id: 'transfer', name: 'Transfer' },
]

export function PaymentSummary({
  onSuccess,
}: {
  onSuccess?: (order: PosOrderSummary) => void
}) {
  const { t } = useTranslation()
  const store = usePosStore()
  const totals = selectPosTotals(store)
  const subscription = useSubscription()
  const localCustomers = useCustomers()
  const dbMethods = usePaymentMethods()
  const activeMethods = dbMethods && dbMethods.length > 0 ? dbMethods.filter((m) => m.status === 'Aktif') : defaultMethods

  const selectedMethodObj = activeMethods.find((m) => m.name.toLowerCase() === store.paymentMethod) as LocalPaymentMethod | undefined

  const [isProcessing, setIsProcessingState] = useState(false)
  const [allowPartial, setAllowPartial] = useState(false)
  const isProcessingRef = useRef(false)
  const setProcessing = (v: boolean) => { isProcessingRef.current = v; setIsProcessingState(v) }

  const setPaidAmount = usePosStore((s) => s.setPaidAmount)
  useEffect(() => {
    setPaidAmount(totals.total)
  }, [setPaidAmount, totals.total])

  const splitAllocated = store.paymentSplits.reduce((sum, split) => sum + (split.amount || 0), 0)
  const splitRemaining = Math.max(totals.total - splitAllocated, 0)

  const shortfall = store.isSplitPayment
    ? splitRemaining
    : Math.max(totals.total - store.paidAmount, 0)

  const hasPaymentMethod = store.isSplitPayment
    ? store.paymentSplits.some((split) => split.method && split.amount > 0)
    : Boolean(store.paymentMethod)

  const isFullyPaid = shortfall <= 0
  const canSubmit = store.cartItems.length > 0
    && !isProcessing
    && !subscription.isEnforced
    && hasPaymentMethod
    && (isFullyPaid || allowPartial)

  function handleSelectMethod(methodName: string) {
    store.setPaymentMethod(methodName.toLowerCase())
  }

  function handleToggleSplit() {
    const next = !store.isSplitPayment
    store.setSplitPayment(next)
    store.setPaymentSplits([])
    setAllowPartial(false)
    if (next) {
      store.setPaymentMethod('')
    }
  }

  async function handleCheckout() {
    if (store.cartItems.length === 0 || isProcessingRef.current) return

    if (subscription.isEnforced) {
      toast.error('Langganan unit usaha Anda telah berakhir atau ditangguhkan. Silakan perpanjang paket di menu Tagihan & Langganan.')
      return
    }

    if (!hasPaymentMethod) {
      toast.error(t('pos.payment_method_required'))
      return
    }

    if (!isFullyPaid && !allowPartial) {
      toast.error(t('pos.split_invalid'))
      return
    }

    setProcessing(true)
    try {
      const fallback = getDefaultCustomer(localCustomers)
      const finalCustomerName = store.customerName?.trim() || fallback.name
      const finalCustomerId = store.customerName?.trim() ? store.customerId : fallback.id

      const splits = store.isSplitPayment
        ? store.paymentSplits.filter((split) => split.method && split.amount > 0)
        : undefined

      const paidAmount = store.isSplitPayment ? splitAllocated : store.paidAmount

      const result = await posTransactionService.checkout(
        store.cartItems,
        totals,
        store.paymentMethod,
        paidAmount,
        store.discount,
        finalCustomerName,
        finalCustomerId,
        store.orderNote,
        splits,
      )
      if (!result) {
        throw new Error('Transaksi tidak menghasilkan data order')
      }

      const order: PosOrderSummary = {
        id: result.salesOrderId,
        code: result.code,
        date: new Date(),
        subtotal: totals.subtotal,
        tax: 0,
        discount: store.discount,
        total: totals.total,
        paymentMethod: store.isSplitPayment
          ? store.paymentSplits.map((split) => `${split.method} ${formatCurrency(split.amount)}`).join(' + ')
          : store.paymentMethod,
        amountPaid: paidAmount,
        change: Math.max(paidAmount - totals.total, 0),
        items: store.cartItems,
        customerId: finalCustomerId,
        customerName: finalCustomerName,
        cashierName: 'Kasir',
      }

      store.clearCart()
      store.setCustomer(fallback.id, fallback.name)
      setAllowPartial(false)
      onSuccess?.(order)
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error_generic')
      toast.error(message)
    } finally {
      setProcessing(false)
    }
  }

  const quickCashOptions = buildQuickCashOptions(totals.total)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
        <User className="size-4 text-muted-foreground" />
        <span className="font-medium">{store.customerName?.trim() || DEFAULT_CUSTOMER_NAME}</span>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground">{t('pos.order_detail')}</h3>
        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
          {store.cartItems.map((item) => (
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
          <span className="text-muted-foreground">{t('pos.subtotal')}</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <span className="text-muted-foreground">{t('pos.additional_discount')}</span>
          <CurrencyInput
            prefix="Rp"
            className="h-8 w-32 text-right bg-muted/30"
            value={store.discount}
            onValueChange={store.setDiscount}
            placeholder="0"
          />
        </div>
        <div className="flex items-end justify-between pt-2">
          <span className="font-medium">{t('common.total')}</span>
          <span className="text-2xl font-bold text-primary">{formatCurrency(totals.total)}</span>
        </div>
      </div>

      <div
        id="pos-payment-methods"
        className={`space-y-3 rounded-xl border p-2 transition-colors ${!hasPaymentMethod ? 'border-destructive/50 bg-destructive/10' : 'border-transparent'}`}
      >
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium">{t('pos.payment_method_select')}</label>
          <Button
            type="button"
            variant={store.isSplitPayment ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggleSplit}
            aria-pressed={store.isSplitPayment}
          >
            <SplitSquareHorizontal data-icon="inline-start" />
            {t('pos.split_payment')}
          </Button>
        </div>

        {store.isSplitPayment ? (
          <div className="space-y-3">
            {store.paymentSplits.map((split, index) => {
              return (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={split.method}
                    onValueChange={(value) => store.updatePaymentSplit(index, { method: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t('pos.select_payment_method')} />
                    </SelectTrigger>
                    <SelectContent>
                      {activeMethods.map((method: { id: string; name: string }) => {
                        const methodDisplay = getPaymentMethodDisplay(method.id, method.name)
                        const MethodIcon = methodDisplay.icon
                        return (
                          <SelectItem key={method.id} value={method.name.toLowerCase()}>
                            <span className="flex items-center gap-2">
                              <MethodIcon className={`size-4 ${methodDisplay.tone}`} aria-hidden="true" />
                              {method.name}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <CurrencyInput
                    prefix="Rp"
                    className="w-32 text-right"
                    value={split.amount}
                    onValueChange={(amount) => store.updatePaymentSplit(index, { amount })}
                    placeholder="0"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('pos.remove_split')}
                    onClick={() => store.removePaymentSplit(index)}
                  >
                    <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                  </Button>
                </div>
              )
            })}

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('pos.split_remaining')}</span>
              <span className={`font-semibold ${splitRemaining > 0 ? 'text-destructive' : 'text-success'}`}>
                {formatCurrency(splitRemaining)}
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => store.addPaymentSplit(activeMethods[0]?.name.toLowerCase() ?? 'tunai')}
            >
              <Plus data-icon="inline-start" />
              {t('pos.add_split')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {activeMethods.map((method: { id: string; name: string }) => {
              const display = getPaymentMethodDisplay(method.id, method.name)
              const MethodIcon = display.icon
              const isActive = store.paymentMethod === method.name.toLowerCase()
              return (
                <Button
                  key={method.id}
                  type="button"
                  variant={isActive ? 'default' : 'outline'}
                  onClick={() => handleSelectMethod(method.name)}
                  size="sm"
                  className="justify-start gap-2"
                  aria-pressed={isActive}
                >
                  <MethodIcon className={`size-4 ${isActive ? '' : display.tone}`} aria-hidden="true" />
                  {method.name}
                </Button>
              )
            })}
          </div>
        )}

        {!hasPaymentMethod && (
          <p className="text-xs font-medium text-destructive">{t('pos.payment_method_required')}</p>
        )}
      </div>

      {selectedMethodObj && (selectedMethodObj.qrImageUrl || selectedMethodObj.instructions) && !store.isSplitPayment && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h4 className="font-semibold text-primary">{selectedMethodObj.name}</h4>
          {selectedMethodObj.qrImageUrl && (
            <div className="rounded-xl bg-white p-2 shadow-sm">
              <img
                src={selectedMethodObj.qrImageUrl}
                alt={`QRIS ${selectedMethodObj.name}`}
                className="h-48 w-48 object-contain"
                onError={(event) => {
                  event.currentTarget.parentElement?.replaceChildren(
                    Object.assign(document.createElement('div'), {
                      className: 'flex h-48 w-48 items-center justify-center rounded bg-muted/30 text-center text-xs text-muted-foreground',
                      textContent: t('pos.image_load_failed'),
                    }),
                  )
                }}
              />
            </div>
          )}
          {selectedMethodObj.instructions && (
            <div className="mt-2 whitespace-pre-wrap text-center text-sm text-muted-foreground">
              {selectedMethodObj.instructions}
            </div>
          )}
        </div>
      )}

      {store.discount > totals.subtotal && (
        <p className="text-xs font-medium text-destructive">{t('pos.discount_exceeds_subtotal')}</p>
      )}

      {!store.isSplitPayment && (
        <div className="space-y-3 rounded-2xl border bg-muted/10 p-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="pos-paid-amount">{t('pos.paid_amount_label')}</label>
            <span className="text-xs text-muted-foreground">{t('pos.minimum_amount', { amount: formatCurrency(totals.total) })}</span>
          </div>
          <CurrencyInput
            id="pos-paid-amount"
            prefix="Rp"
            value={store.paidAmount}
            onValueChange={store.setPaidAmount}
            className="h-12 text-lg font-semibold"
            placeholder="0"
          />

          {quickCashOptions.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {quickCashOptions.map((amount, index) => (
                <Button
                  key={amount}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => store.setPaidAmount(amount)}
                >
                  {index === 0 ? t('pos.quick_cash_exact') : formatCurrency(amount)}
                </Button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            {store.paidAmount > 0 && store.paidAmount < totals.total ? (
              <>
                <span className="font-medium text-destructive">{t('pos.shortfall')}</span>
                <span className="font-bold text-destructive">{formatCurrency(totals.total - store.paidAmount)}</span>
              </>
            ) : (
              <>
                <span className="text-muted-foreground">{t('pos.change_due')}</span>
                <span className="text-lg font-bold text-success">
                  {formatCurrency(Math.max((store.paidAmount || totals.total) - totals.total, 0))}
                </span>
              </>
            )}
          </div>

          {!isFullyPaid && (
            <Button
              type="button"
              variant={allowPartial ? 'default' : 'outline'}
              size="sm"
              className="w-full"
              onClick={() => setAllowPartial((value) => !value)}
              aria-pressed={allowPartial}
            >
              <Wallet data-icon="inline-start" />
              {allowPartial ? t('pos.partial_payment_enabled') : t('pos.partial_payment')}
            </Button>
          )}
        </div>
      )}

      {store.isSplitPayment && !isFullyPaid && (
        <Button
          type="button"
          variant={allowPartial ? 'default' : 'outline'}
          size="sm"
          className="w-full"
          onClick={() => setAllowPartial((value) => !value)}
          aria-pressed={allowPartial}
        >
          <Wallet data-icon="inline-start" />
          {allowPartial ? t('pos.partial_payment_enabled') : t('pos.partial_payment')}
        </Button>
      )}

      <Button
        size="lg"
        className="h-14 w-full text-lg font-semibold"
        disabled={!canSubmit}
        onClick={handleCheckout}
      >
        {subscription.isEnforced
          ? t('pos.subscription_ended')
          : isProcessing
            ? t('pos.processing')
            : isFullyPaid
              ? t('pos.complete_payment')
              : t('pos.complete_partial_payment')}
      </Button>

      {!isFullyPaid && allowPartial && (
        <p className="text-center text-xs text-muted-foreground">{t('pos.partial_payment_hint')}</p>
      )}
    </div>
  )
}
