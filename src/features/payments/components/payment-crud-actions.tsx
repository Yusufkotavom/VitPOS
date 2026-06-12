import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Field, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { syncSalesOrderPaymentSummary, deleteSalesOrderPayment } from '@/features/sales-orders/services/sales-order-finance.service'
import { syncServiceOrderPaymentSummary, deleteServiceOrderPayment } from '@/features/service-orders/services/service-order-finance.service'
import { syncPurchasePaymentSummary, deletePurchasePayment } from '@/features/purchases/services/purchase-payment.service'
import { useSalesOrders } from '@/features/sales-orders/hooks/use-sales-orders'
import { useServiceOrders } from '@/features/service-orders/hooks/use-service-orders'
import { usePurchases } from '@/features/purchases/hooks/use-purchases'
import { paymentFormSchema, paymentInitialValues, paymentMethodOptions, paymentStatusOptions, type PaymentFormValues } from '@/features/payments/schemas/payment-form-schema'
import { mapPaymentFormToRecord, mapPaymentRecordToFormValues } from '@/features/payments/schemas/payment-form-schema'
import { paymentRepository } from '@/services/local-db/repository'
import type { LocalPayment } from '@/services/local-db/schema'

export function PaymentCrudActions({ payment }: { payment?: LocalPayment }) {
  const { t } = useTranslation()
  const salesOrders = useSalesOrders()
  const serviceOrders = useServiceOrders()
  const purchases = usePurchases()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(payment)

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: payment ? mapPaymentRecordToFormValues(payment) : paymentInitialValues,
  })

  useEffect(() => {
    form.reset(payment ? mapPaymentRecordToFormValues(payment) : paymentInitialValues)
  }, [payment, form])

  async function handleSubmit(values: PaymentFormValues) {
    try {
      const id = payment?.id ?? crypto.randomUUID()
      const previousSalesOrderId = payment?.salesOrderId
      const previousServiceOrderId = payment?.serviceOrderId
      const previousPurchaseId = payment?.purchaseId
      const nextPayment = mapPaymentFormToRecord(values, id, payment)
      await paymentRepository.upsert(nextPayment)
      if (previousSalesOrderId && previousSalesOrderId !== nextPayment.salesOrderId) {
        await syncSalesOrderPaymentSummary(previousSalesOrderId)
      }
      if (nextPayment.salesOrderId) {
        await syncSalesOrderPaymentSummary(nextPayment.salesOrderId)
      }
      if (previousServiceOrderId && previousServiceOrderId !== nextPayment.serviceOrderId) {
        await syncServiceOrderPaymentSummary(previousServiceOrderId)
      }
      if (nextPayment.serviceOrderId) {
        await syncServiceOrderPaymentSummary(nextPayment.serviceOrderId)
      }
      if (previousPurchaseId && previousPurchaseId !== nextPayment.purchaseId) {
        await syncPurchasePaymentSummary(previousPurchaseId)
      }
      if (nextPayment.purchaseId) {
        await syncPurchasePaymentSummary(nextPayment.purchaseId)
      }
      toast.success(isEdit ? t('payments.updated') : t('payments.recorded'))
      setFormOpen(false)
    } catch (error) {
      toast.error(t('common.save_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  async function handleDelete() {
    if (!payment) return
    try {
      if (payment.salesOrderId) {
        await deleteSalesOrderPayment(payment.id)
      } else if (payment.serviceOrderId) {
        await deleteServiceOrderPayment(payment.id)
      } else if (payment.purchaseId) {
        await deletePurchasePayment(payment.id)
      } else {
        await paymentRepository.remove(payment.id)
      }
      toast.success(t('payments.deleted'))
      setDeleteOpen(false)
    } catch (error) {
      toast.error(t('common.delete_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  const errors = form.formState.errors

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger asChild>
          {payment
            ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />{t('common.edit')}</Button>
            : <Button><PlusIcon data-icon="inline-start" />{t('payments.record')}</Button>}
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>{isEdit ? t('payments.edit_title') : t('payments.record_title')}</DialogTitle>
              <DialogDescription>Pembayaran tersimpan lokal dulu, lalu masuk antrean sinkron.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={!!errors.ref}>
                <Label htmlFor="ref">No. Referensi</Label>
                <Input id="ref" {...form.register('ref')} aria-invalid={!!errors.ref} placeholder="PAY-20260608-001" />
              </Field>
              <Field data-invalid={!!errors.source}>
                <Label htmlFor="source">Sumber</Label>
                <Input id="source" {...form.register('source')} aria-invalid={!!errors.source} placeholder={t('payments.source_placeholder')} />
              </Field>
              <Field>
                <Label htmlFor="salesOrderId">Link Invoice</Label>
                <Controller
                  name="salesOrderId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} defaultValue={field.value || 'none'}>
                      <SelectTrigger id="salesOrderId">
                        <SelectValue placeholder={t('common.select_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="none">Tanpa invoice</SelectItem>
                          {salesOrders.map((order) => (
                            <SelectItem key={order.id} value={order.id}>{order.code} · {order.customerName}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <Label htmlFor="serviceOrderId">Link Service Order</Label>
                <Controller
                  name="serviceOrderId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} defaultValue={field.value || 'none'}>
                      <SelectTrigger id="serviceOrderId">
                        <SelectValue placeholder={t('common.select_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="none">Tanpa service order</SelectItem>
                          {serviceOrders.map((so) => (
                            <SelectItem key={so.id} value={so.id}>{so.code} · {so.customerName}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <Label htmlFor="purchaseId">Link Purchase Order</Label>
                <Controller
                  name="purchaseId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} defaultValue={field.value || 'none'}>
                      <SelectTrigger id="purchaseId">
                        <SelectValue placeholder={t('common.select_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="none">Tanpa PO</SelectItem>
                          {purchases.map((po) => (
                            <SelectItem key={po.id} value={po.id}>{po.code} · {po.supplierName}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <Label htmlFor="method">{t('payments.payment_method')}</Label>
                <Controller
                  name="method"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="method">
                        <SelectValue placeholder={t('common.select_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {paymentMethodOptions.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field data-invalid={!!errors.date}>
                <Label htmlFor="date">{t('common.date')}</Label>
                <Input id="date" type="date" {...form.register('date')} aria-invalid={!!errors.date} />
              </Field>
              <Field data-invalid={!!errors.amount}>
                <Label htmlFor="amount">{t('common.amount')}</Label>
                <Input id="amount" inputMode="numeric" {...form.register('amount')} aria-invalid={!!errors.amount} placeholder="0" />
              </Field>
              <Field>
                <Label htmlFor="status">{t('common.status')}</Label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder={t('common.select_status')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {paymentStatusOptions.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">{t('common.cancel')}</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEdit ? t('common.save') : t('payments.record')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {payment ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />{t('common.delete')}</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('payments.delete_title')}</DialogTitle>
                <DialogDescription>Pembayaran {payment.ref} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
                <Button variant="destructive" onClick={handleDelete}>{t('payments.delete_confirm')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
