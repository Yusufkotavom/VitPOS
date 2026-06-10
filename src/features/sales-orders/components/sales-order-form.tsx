import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { salesOrderFormSchema, salesOrderInitialValues, salesOrderStatusOptions, type SalesOrderFormValues } from '@/features/sales-orders/schemas/sales-order-form-schema'
import { FormSection } from '@/shared/components/forms/form-section'
import { FormSelect } from '@/shared/components/form/form-select'

export function SalesOrderForm({ defaultValues, submitLabel, onCancel, onSubmit }: { defaultValues?: SalesOrderFormValues; submitLabel: string; onCancel: () => void; onSubmit: (values: SalesOrderFormValues) => Promise<void> }) {
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
      <FormSection title="Info invoice" description="Nomor invoice, pelanggan, tanggal, dan status.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nomor invoice
          <Input aria-invalid={Boolean(errors.code)} {...form.register('code')} placeholder="INV-20260608-001" />
          {errors.code ? <span className="text-xs text-destructive">{errors.code.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Pelanggan
          <Input aria-invalid={Boolean(errors.customerName)} {...form.register('customerName')} placeholder="Nama pelanggan" />
          {errors.customerName ? <span className="text-xs text-destructive">{errors.customerName.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tanggal
          <Input type="date" aria-invalid={Boolean(errors.date)} {...form.register('date')} />
          {errors.date ? <span className="text-xs text-destructive">{errors.date.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Status
          <FormSelect control={form.control} name="status" options={salesOrderStatusOptions.map(o => ({ label: o, value: o }))} />
        </label>
      </FormSection>

      <FormSection title="Item pesanan" description="Tambah produk atau jasa yang dipesan.">
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 items-start gap-2 rounded-xl border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_80px_120px_auto] sm:border-0 sm:bg-transparent sm:p-0">
              <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`sales-order-item-name-${index}`}>
                <span className="sm:sr-only">Nama item {index + 1}</span>
                <Input id={`sales-order-item-name-${index}`} aria-label={`Nama item ${index + 1}`} aria-invalid={Boolean(errors.items?.[index]?.name)} {...form.register(`items.${index}.name`)} placeholder="Nama produk" />
                {errors.items?.[index]?.name ? <span className="text-xs text-destructive">{errors.items[index].name?.message}</span> : null}
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`sales-order-item-qty-${index}`}>
                <span className="sm:sr-only">Qty item {index + 1}</span>
                <Input id={`sales-order-item-qty-${index}`} aria-label={`Qty item ${index + 1}`} inputMode="numeric" aria-invalid={Boolean(errors.items?.[index]?.qty)} {...form.register(`items.${index}.qty`)} placeholder="Qty" />
                {errors.items?.[index]?.qty ? <span className="text-xs text-destructive">{errors.items[index].qty?.message}</span> : null}
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`sales-order-item-price-${index}`}>
                <span className="sm:sr-only">Harga item {index + 1}</span>
                <Input id={`sales-order-item-price-${index}`} aria-label={`Harga item ${index + 1}`} inputMode="numeric" aria-invalid={Boolean(errors.items?.[index]?.unitPrice)} {...form.register(`items.${index}.unitPrice`)} placeholder="Harga" />
                {errors.items?.[index]?.unitPrice ? <span className="text-xs text-destructive">{errors.items[index].unitPrice?.message}</span> : null}
              </label>
              {fields.length > 1 ? (
                <Button aria-label={`Hapus item ${index + 1}`} type="button" variant="ghost" size="sm" onClick={() => remove(index)}><Trash2Icon aria-hidden="true" /></Button>
              ) : null}
            </div>
          ))}
        </div>
        {errors.items?.message ? <span className="text-xs text-destructive">{errors.items.message}</span> : null}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', qty: '1', unitPrice: '0' })}>+ Tambah item</Button>
      </FormSection>

      <FormSection title="Diskon & pajak" description="Potongan dan pajak diterapkan ke subtotal.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Diskon
          <Input inputMode="numeric" {...form.register('discountTotal')} placeholder="0" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Pajak
          <Input inputMode="numeric" {...form.register('taxTotal')} placeholder="0" />
        </label>
      </FormSection>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
