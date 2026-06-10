import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { returnFormSchema, returnInitialValues, returnStatusOptions, returnTypeOptions, type ReturnFormValues } from '@/features/returns/schemas/return-form-schema'
import { FormSelect } from '@/shared/components/form/form-select'
import { FieldGroup } from '@/components/ui/field'

export function ReturnForm({ defaultValues, submitLabel, onCancel, onSubmit }: { defaultValues?: ReturnFormValues; submitLabel: string; onCancel: () => void; onSubmit: (values: ReturnFormValues) => Promise<void> }) {
  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: defaultValues ?? returnInitialValues,
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })

  useEffect(() => {
    form.reset(defaultValues ?? returnInitialValues)
  }, [defaultValues, form])

  const errors = form.formState.errors

  return (
    <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nomor retur
          <Input aria-invalid={Boolean(errors.code)} {...form.register('code')} placeholder="Otomatis jika kosong" />
          {errors.code ? <span className="text-xs text-destructive">{errors.code.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tipe retur
          <FormSelect control={form.control} name="type" options={returnTypeOptions.map(o => ({ label: o, value: o }))} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Kode referensi
          <Input aria-invalid={Boolean(errors.referenceCode)} {...form.register('referenceCode')} placeholder="INV/PO asal" />
          {errors.referenceCode ? <span className="text-xs text-destructive">{errors.referenceCode.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tanggal
          <Input type="date" aria-invalid={Boolean(errors.date)} {...form.register('date')} />
          {errors.date ? <span className="text-xs text-destructive">{errors.date.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Status
          <FormSelect control={form.control} name="status" options={returnStatusOptions.map(o => ({ label: o, value: o }))} />
        </label>
      </FieldGroup>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Item Retur</h3>
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 items-start gap-2 rounded-xl border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_80px_120px_auto] sm:border-0 sm:bg-transparent sm:p-0">
              <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`return-item-name-${index}`}>
                <span className="sm:sr-only">Nama item {index + 1}</span>
                <Input id={`return-item-name-${index}`} aria-label={`Nama item ${index + 1}`} aria-invalid={Boolean(errors.items?.[index]?.name)} {...form.register(`items.${index}.name`)} placeholder="Nama produk" />
                {errors.items?.[index]?.name ? <span className="text-xs text-destructive">{errors.items[index].name?.message}</span> : null}
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`return-item-qty-${index}`}>
                <span className="sm:sr-only">Qty item {index + 1}</span>
                <Input id={`return-item-qty-${index}`} aria-label={`Qty item ${index + 1}`} inputMode="numeric" aria-invalid={Boolean(errors.items?.[index]?.qty)} {...form.register(`items.${index}.qty`)} placeholder="Qty" />
                {errors.items?.[index]?.qty ? <span className="text-xs text-destructive">{errors.items[index].qty?.message}</span> : null}
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`return-item-price-${index}`}>
                <span className="sm:sr-only">Harga item {index + 1}</span>
                <Input id={`return-item-price-${index}`} aria-label={`Harga item ${index + 1}`} inputMode="numeric" aria-invalid={Boolean(errors.items?.[index]?.unitPrice)} {...form.register(`items.${index}.unitPrice`)} placeholder="Harga" />
                {errors.items?.[index]?.unitPrice ? <span className="text-xs text-destructive">{errors.items[index].unitPrice?.message}</span> : null}
              </label>
              {fields.length > 1 ? (
                <Button aria-label={`Hapus item ${index + 1}`} type="button" variant="ghost" size="sm" onClick={() => remove(index)}><Trash2Icon aria-hidden="true" /></Button>
              ) : null}
            </div>
          ))}
        </div>
        {errors.items?.message ? <span className="text-xs text-destructive">{errors.items.message}</span> : null}
        <Button type="button" variant="outline" size="sm" className="w-max" onClick={() => append({ name: '', qty: '1', unitPrice: '0' })}>+ Tambah item</Button>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
