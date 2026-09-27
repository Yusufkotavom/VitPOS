import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  generatePurchaseCode,
  purchaseFormSchema,
  purchaseInitialValues,
  purchaseStatusOptions,
  type PurchaseFormValues,
} from '@/features/purchases/schemas/purchase-form-schema'
import { FormSelect } from '@/shared/components/form/form-select'
import { FormSection } from '@/shared/components/forms/form-section'
import { ProductLineItemSelect } from '@/shared/components/forms/product-line-item-select'
import { SupplierSelect } from '@/features/purchases/components/supplier-select'
import { parseDigits } from '@/features/catalog/lib/formatters'
import { formatCurrency } from '@/lib/format-currency'

export function PurchaseForm({
  defaultValues,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  defaultValues?: PurchaseFormValues
  submitLabel: string
  onCancel: () => void
  onSubmit: (values: PurchaseFormValues) => Promise<void>
}) {
  const { t } = useTranslation()
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: defaultValues ?? purchaseInitialValues,
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })

  useEffect(() => {
    form.reset(defaultValues ?? purchaseInitialValues)
    if (!defaultValues?.code) {
      generatePurchaseCode()
        .then((code) => {
          if (!form.getValues('code')) {
            form.setValue('code', code)
          }
        })
        .catch(() => {})
    }
  }, [defaultValues, form])

  const errors = form.formState.errors
  const watchItems = form.watch('items')
  const totalAmount = (watchItems || []).reduce((sum, item) => {
    const qty = parseDigits(item?.qty || '0')
    const price = parseDigits(item?.unitPrice || '0')
    return sum + qty * price
  }, 0)

  async function handleFormSubmit(values: PurchaseFormValues) {
    let code = values.code?.trim()
    if (!code) {
      code = await generatePurchaseCode()
    }
    await onSubmit({ ...values, code })
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(handleFormSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border bg-card/60 p-4 shadow-xs">
        <label className="flex flex-col gap-1.5 text-sm font-medium" htmlFor="purchase-po-code">
          <span>{t('purchases.po_number_label')}</span>
          <Input
            id="purchase-po-code"
            aria-invalid={Boolean(errors.code)}
            {...form.register('code')}
            placeholder="Otomatis jika kosong"
          />
          <span className="text-[11px] text-muted-foreground">Otomatis diisi sistem bila kosong.</span>
          {errors.code ? <span className="text-xs text-destructive">{errors.code.message}</span> : null}
        </label>

        <div className="flex flex-col gap-1.5 text-sm font-medium">
          <label htmlFor="purchase-supplier-select">{t('purchases.supplier_label')}</label>
          <Controller
            control={form.control}
            name="supplierName"
            render={({ field }) => (
              <SupplierSelect
                id="purchase-supplier-select"
                value={field.value}
                onChange={(name) => {
                  field.onChange(name)
                }}
                invalid={Boolean(errors.supplierName)}
                placeholder={t('purchases.supplier_name_placeholder') || 'Pilih atau cari supplier...'}
                ariaLabel={t('purchases.supplier_label')}
              />
            )}
          />
          {errors.supplierName ? (
            <span className="text-xs text-destructive">{errors.supplierName.message}</span>
          ) : (
            <span className="text-[11px] text-muted-foreground">Pilih dari daftar atau klik (+) untuk tambah baru.</span>
          )}
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium" htmlFor="purchase-date">
          <span>{t('common.date')}</span>
          <Input id="purchase-date" type="date" aria-invalid={Boolean(errors.date)} {...form.register('date')} />
          {errors.date ? <span className="text-xs text-destructive">{errors.date.message}</span> : null}
        </label>

        <div className="flex flex-col gap-1.5 text-sm font-medium">
          <span>{t('common.status')}</span>
          <FormSelect
            control={form.control}
            name="status"
            options={purchaseStatusOptions.map((o) => ({ label: o, value: o }))}
          />
        </div>
      </div>

      <FormSection title={t('purchases.items')} description={t('purchases.items_description')}>
        <div className="flex flex-col gap-3 md:col-span-2">
          <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_90px_140px_130px_40px] gap-2 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>{t('purchases.item_header') || 'Produk / Item'}</span>
            <span>Qty</span>
            <span>{t('common.price') || 'Harga Satuan'}</span>
            <span className="text-right">Subtotal</span>
            <span></span>
          </div>

          {fields.map((field, index) => {
            const qty = parseDigits(watchItems?.[index]?.qty || '0')
            const price = parseDigits(watchItems?.[index]?.unitPrice || '0')
            const subtotal = qty * price

            return (
              <div
                key={field.id}
                className="grid grid-cols-1 items-start gap-2 rounded-xl border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_90px_140px_130px_40px] sm:border-0 sm:bg-transparent sm:p-0 sm:items-center"
              >
                <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`purchase-item-name-${index}`}>
                  <span className="sm:sr-only">{t('purchases.item_name_sr_label', { index: index + 1 })}</span>
                  <Controller
                    control={form.control}
                    name={`items.${index}.name`}
                    render={({ field: nameField }) => (
                      <ProductLineItemSelect
                        id={`purchase-item-name-${index}`}
                        ariaLabel={t('purchases.item_name_aria_label', { index: index + 1 })}
                        placeholder={t('purchases.item_name_placeholder')}
                        emptyLabel={t('purchases.select_product_title')}
                        invalid={Boolean(errors.items?.[index]?.name)}
                        priceField="cost"
                        value={nameField.value}
                        onChange={(name) => {
                          nameField.onChange(name)
                          form.setValue(`items.${index}.productId`, '')
                        }}
                        onSelectProduct={(selection) => {
                          nameField.onChange(selection.name)
                          form.setValue(`items.${index}.productId`, selection.productId)
                          form.setValue(`items.${index}.unitPrice`, String(selection.unitPrice), {
                            shouldValidate: true,
                          })
                        }}
                      />
                    )}
                  />
                  {errors.items?.[index]?.name ? (
                    <span className="text-xs text-destructive">{errors.items[index].name?.message}</span>
                  ) : null}
                </label>

                <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`purchase-item-qty-${index}`}>
                  <span className="sm:sr-only">{t('purchases.item_qty_aria_label', { index: index + 1 })}</span>
                  <Input
                    id={`purchase-item-qty-${index}`}
                    aria-label={t('purchases.item_qty_aria_label', { index: index + 1 })}
                    inputMode="numeric"
                    aria-invalid={Boolean(errors.items?.[index]?.qty)}
                    {...form.register(`items.${index}.qty`)}
                    placeholder="Qty"
                  />
                  {errors.items?.[index]?.qty ? (
                    <span className="text-xs text-destructive">{errors.items[index].qty?.message}</span>
                  ) : null}
                </label>

                <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`purchase-item-price-${index}`}>
                  <span className="sm:sr-only">{t('purchases.item_price_aria_label', { index: index + 1 })}</span>
                  <Input
                    id={`purchase-item-price-${index}`}
                    aria-label={t('purchases.item_price_aria_label', { index: index + 1 })}
                    inputMode="numeric"
                    aria-invalid={Boolean(errors.items?.[index]?.unitPrice)}
                    {...form.register(`items.${index}.unitPrice`)}
                    placeholder="Harga"
                  />
                  {errors.items?.[index]?.unitPrice ? (
                    <span className="text-xs text-destructive">{errors.items[index].unitPrice?.message}</span>
                  ) : null}
                </label>

                <div className="flex sm:justify-end items-center text-sm font-semibold text-foreground/80 py-1 sm:py-0 pr-1">
                  <span className="sm:hidden text-xs text-muted-foreground mr-2">Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-end">
                  {fields.length > 1 ? (
                    <Button
                      aria-label={t('purchases.remove_item', { index: index + 1 })}
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2Icon className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        {errors.items?.message ? (
          <span className="text-xs text-destructive md:col-span-2">{errors.items.message}</span>
        ) : null}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t md:col-span-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ productId: '', name: '', qty: '1', unitPrice: '0' })}
          >
            {t('purchases.add_item')}
          </Button>

          <div className="flex items-center gap-3 text-sm bg-muted/30 px-4 py-2 rounded-lg border">
            <span className="text-muted-foreground">Total Estimasi Pembelian:</span>
            <span className="text-base font-bold text-primary">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </FormSection>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-3 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
