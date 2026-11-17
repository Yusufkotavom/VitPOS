import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { User, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/format-currency'
import { useServiceOrderCreateStore } from '@/features/service-orders/stores/service-order-create-store'
import { socTransactionService } from '@/features/service-orders/services/soc-transaction.service'
import { usePaymentMethods } from '@/features/settings/hooks/use-payment-methods'
import { CurrencyInput } from '@/shared/components/forms/currency-input'
import { getPaymentMethodDisplay, buildQuickCashOptions } from '@/features/pos/lib/payment-method-display'
import { sumJobLines } from '@/features/service-orders/lib/job-lines'
import { ServiceSuccessFlow, type ServiceSuccessMeta } from '@/features/service-orders/components/service-success-flow'
import type { PosOrderSummary } from '@/features/pos/types/pos-order.types'

const defaultMethods = [
  { id: 'tunai', name: 'Tunai' },
  { id: 'qris', name: 'QRIS' },
  { id: 'transfer', name: 'Transfer' },
]

export function SocPaymentSummary({
  onComplete,
  onSuccess,
}: {
  onComplete?: () => void
  onSuccess?: (order: PosOrderSummary, meta: ServiceSuccessMeta) => void
}) {
  const { t } = useTranslation()
  const store = useServiceOrderCreateStore()
  const dbMethods = usePaymentMethods()
  const activeMethods = dbMethods && dbMethods.length > 0
    ? dbMethods.filter((method) => method.status === 'Aktif')
    : defaultMethods

  const [successOrder, setSuccessOrder] = useState<PosOrderSummary | null>(null)
  const [successMeta, setSuccessMeta] = useState<ServiceSuccessMeta | null>(null)
  const [isProcessing, setIsProcessingState] = useState(false)
  const [allowPartial, setAllowPartial] = useState(false)
  const isProcessingRef = useRef(false)
  const setProcessing = (value: boolean) => { isProcessingRef.current = value; setIsProcessingState(value) }

  const subtotal = sumJobLines(store.lines)
  const total = Math.max(subtotal - store.discount, 0)

  const [paidAmount, setPaidAmount] = useState(total)
  const [paymentMethod, setPaymentMethod] = useState('')

  const shortfall = Math.max(total - paidAmount, 0)
  const isFullyPaid = shortfall <= 0
  const canSubmit = store.lines.length > 0 && Boolean(paymentMethod) && !isProcessing && (isFullyPaid || allowPartial)

  async function handleCheckout() {
    if (isProcessingRef.current) return

    if (!paymentMethod) {
      toast.error(t('pos.payment_method_required'))
      return
    }

    if (!isFullyPaid && !allowPartial) {
      toast.error(t('pos.split_invalid'))
      return
    }

    setProcessing(true)
    try {
      const meta: ServiceSuccessMeta = {
        device: [store.deviceBrand, store.deviceModel].filter(Boolean).join(' ') || store.jobCategory || '-',
        complaint: store.complaint,
        estimatedCompletion: store.estimatedCompletion,
      }

      const result = await socTransactionService.checkout(
        store.lines,
        { total, subtotal },
        paymentMethod,
        paidAmount,
        store.customerName,
        store.customerId,
        {
          description: store.complaint.trim() || store.description,
          notes: store.notes,
          estimatedCompletion: store.estimatedCompletion,
          hasWarranty: store.hasWarranty,
          warrantyValue: store.warrantyValue ? Number(store.warrantyValue) : undefined,
          warrantyUnit: store.warrantyUnit,
          complaint: store.complaint,
          diagnosis: store.diagnosis,
          jobCategory: store.jobCategory,
          deviceType: store.deviceType,
          deviceBrand: store.deviceBrand,
          deviceModel: store.deviceModel,
          deviceSerial: store.deviceSerial,
          accessories: store.accessories,
          priority: store.priority,
          technicianName: store.technicianName,
          details: store.details,
          discountTotal: store.discount,
        },
      )

      if (!result) throw new Error(t('common.error_generic'))

      const order: PosOrderSummary = {
        id: result.serviceOrderId,
        code: result.code,
        date: new Date(),
        subtotal,
        tax: 0,
        discount: store.discount,
        total,
        paymentMethod,
        amountPaid: paidAmount,
        change: Math.max(paidAmount - total, 0),
        items: store.lines.map((line) => ({
          productId: line.productId ?? line.id,
          name: line.name,
          price: line.unitPrice,
          qty: line.qty,
          subtotal: line.subtotal,
        })),
        customerId: store.customerId,
        customerName: store.customerName ?? 'Umum',
        cashierName: 'Kasir',
      }

      store.clear()
      setAllowPartial(false)

      if (onSuccess) {
        onSuccess(order, meta)
      } else {
        setSuccessMeta(meta)
        setSuccessOrder(order)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error_generic')
      toast.error(message)
    } finally {
      setProcessing(false)
    }
  }

  const quickCashOptions = buildQuickCashOptions(total)

  return (
    <div className="flex flex-col gap-4">
      {!onSuccess && (
        <ServiceSuccessFlow
          order={successOrder}
          meta={successMeta}
          onClose={() => {
            setSuccessOrder(null)
            onComplete?.()
          }}
        />
      )}

      <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
        <User className="size-4 text-muted-foreground" />
        <span className="font-medium">{store.customerName || 'Umum'}</span>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">{t('service_orders.job_detail')}</h3>
        <p className="rounded-lg border bg-muted/20 p-2 text-sm">{store.complaint || store.description || '-'}</p>

        <div className="max-h-44 space-y-2 overflow-y-auto pr-2">
          {store.lines.map((line) => (
            <div key={line.id} className="flex justify-between gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <span className="font-medium">{line.name}</span>
                <span className="ml-2 text-muted-foreground">
                  {line.qty} {line.unit}
                  {line.priceMode === 'area' && line.width && line.height ? ` · ${line.width}x${line.height}` : ''}
                </span>
              </div>
              <span className="shrink-0 font-medium">{formatCurrency(line.subtotal)}</span>
            </div>
          ))}
          {store.lines.length === 0 && (
            <p className="text-xs text-muted-foreground">{t('service_orders.no_lines')}</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('common.subtotal')}</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {store.discount > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('common.discount')}</span>
            <span className="text-destructive">-{formatCurrency(store.discount)}</span>
          </div>
        )}
        <div className="flex items-end justify-between pt-1">
          <span className="font-medium">{t('common.total')}</span>
          <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-transparent p-2">
        <label className="text-sm font-medium">{t('pos.payment_method_select')}</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {activeMethods.map((method: { id: string; name: string }) => {
            const display = getPaymentMethodDisplay(method.id, method.name)
            const MethodIcon = display.icon
            const isActive = paymentMethod === method.name.toLowerCase()
            return (
              <Button
                key={method.id}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                onClick={() => setPaymentMethod(method.name.toLowerCase())}
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
        {!paymentMethod && (
          <p className="text-xs font-medium text-destructive">{t('pos.payment_method_required')}</p>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border bg-muted/10 p-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" htmlFor="soc-paid-amount">
            {t('service_orders.down_payment_or_paid')}
          </label>
          <span className="text-xs text-muted-foreground">{t('pos.minimum_amount', { amount: formatCurrency(total) })}</span>
        </div>
        <CurrencyInput
          id="soc-paid-amount"
          prefix="Rp"
          value={paidAmount}
          onValueChange={setPaidAmount}
          className="h-12 text-lg font-semibold"
          placeholder="0"
        />

        {quickCashOptions.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickCashOptions.map((amount, index) => (
              <Button key={amount} type="button" variant="secondary" size="sm" onClick={() => setPaidAmount(amount)}>
                {index === 0 ? t('pos.quick_cash_exact') : formatCurrency(amount)}
              </Button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          {paidAmount > 0 && paidAmount < total ? (
            <>
              <span className="font-medium text-destructive">{t('service_orders.remaining_bill')}</span>
              <span className="font-bold text-destructive">{formatCurrency(shortfall)}</span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">{t('pos.change')}</span>
              <span className="text-lg font-bold text-success">{formatCurrency(Math.max(paidAmount - total, 0))}</span>
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

      <Button
        size="lg"
        className="h-14 w-full text-lg font-semibold"
        disabled={!canSubmit}
        onClick={handleCheckout}
      >
        {isProcessing
          ? t('common.processing')
          : isFullyPaid
            ? t('service_orders.process_service_order')
            : t('pos.complete_partial_payment')}
      </Button>

      {!isFullyPaid && allowPartial && (
        <p className="text-center text-xs text-muted-foreground">{t('pos.partial_payment_hint')}</p>
      )}
    </div>
  )
}
