import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { salesOrderFormSchema, salesOrderInitialValues, salesOrderStatusOptions, type SalesOrderFormValues } from '@/features/sales-orders/schemas/sales-order-form-schema'
import { FormSelect } from '@/shared/components/form/form-select'
import { FormSection } from '@/shared/components/forms/form-section'

export function SalesOrderForm({ defaultValues, submitLabel, onCancel, onSubmit }: { defaultValues?: SalesOrderFormValues; submitLabel: string; onCancel: () => void; onSubmit: (values: SalesOrderFormValues) => Promise<void> }) {
  const { t } = useTranslation()
  const form = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderFormSchema),
    defaultValues: defaultValues ?? salesOrderInitialValues,
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })

  useEffect(() => {
    form.reset(defaultValues ?? salesOrderInitialValues)
  }, [defaultValues, form])

  const errors = form.formState.errors

  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('sales_orders.invoice_number_label')}
          <Input aria-invalid={Boolean(errors.code)} {...form.register('code')} placeholder={t('sales_orders.invoice_number_placeholder')} />
          {errors.code ? <span className="text-xs text-destructive">{errors.code.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('common.customer')}
          <Input aria-invalid={Boolean(errors.customerName)} {...form.register('customerName')} placeholder={t('sales_orders.customer_name_placeholder')} />
          {errors.customerName ? <span className="text-xs text-destructive">{errors.customerName.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('common.date')}
          <Input type="date" aria-invalid={Boolean(errors.date)} {...form.register('date')} />
          {errors.date ? <span className="text-xs text-destructive">{errors.date.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('common.status')}
          <FormSelect control={form.control} name="status" options={salesOrderStatusOptions.map(o => ({ label: o, value: o }))} />
        </label>
      </div>

      <FormSection title={t('sales_orders.order_items')} description={t('sales_orders.order_items_description')}>
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 items-start gap-2 rounded-xl border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_80px_120px_auto] sm:border-0 sm:bg-transparent sm:p-0">
              <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`sales-order-item-name-${index}`}>
                <span className="sm:sr-only">{t('sales_orders.item_name_sr_label', { index: index + 1 })}</span>
                <Input id={`sales-order-item-name-${index}`} aria-label={t('sales_orders.item_name_aria_label', { index: index + 1 })} aria-invalid={Boolean(errors.items?.[index]?.name)} {...form.register(`items.${index}.name`)} placeholder={t('sales_orders.item_name_placeholder')} />
                {errors.items?.[index]?.name ? <span className="text-xs text-destructive">{errors.items[index].name?.message}</span> : null}
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`sales-order-item-qty-${index}`}>
                <span className="sm:sr-only">{t('sales_orders.item_qty_aria_label', { index: index + 1 })}</span>
                <Input id={`sales-order-item-qty-${index}`} aria-label={t('sales_orders.item_qty_aria_label', { index: index + 1 })} inputMode="numeric" aria-invalid={Boolean(errors.items?.[index]?.qty)} {...form.register(`items.${index}.qty`)} placeholder={t('common.qty')} />
                {errors.items?.[index]?.qty ? <span className="text-xs text-destructive">{errors.items[index].qty?.message}</span> : null}
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`sales-order-item-price-${index}`}>
                <span className="sm:sr-only">{t('sales_orders.item_price_aria_label', { index: index + 1 })}</span>
                <Input id={`sales-order-item-price-${index}`} aria-label={t('sales_orders.item_price_aria_label', { index: index + 1 })} inputMode="numeric" aria-invalid={Boolean(errors.items?.[index]?.unitPrice)} {...form.register(`items.${index}.unitPrice`)} placeholder={t('common.price')} />
                {errors.items?.[index]?.unitPrice ? <span className="text-xs text-destructive">{errors.items[index].unitPrice?.message}</span> : null}
              </label>
              {fields.length > 1 ? (
                <Button aria-label={t('sales_orders.remove_item', { index: index + 1 })} type="button" variant="ghost" size="sm" onClick={() => remove(index)}><Trash2Icon aria-hidden="true" /></Button>
              ) : null}
            </div>
          ))}
        </div>
        {errors.items?.message ? <span className="text-xs text-destructive">{errors.items.message}</span> : null}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', qty: '1', unitPrice: '0' })}>{t('sales_orders.add_item')}</Button>
      </FormSection>

      <FormSection title={t('sales_orders.discount_tax_section_title')} description={t('sales_orders.discount_tax_section_description')}>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('common.discount')}
          <Input inputMode="numeric" {...form.register('discountTotal')} placeholder="0" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('common.tax')}
          <Input inputMode="numeric" {...form.register('taxTotal')} placeholder="0" />
        </label>
      </FormSection>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
