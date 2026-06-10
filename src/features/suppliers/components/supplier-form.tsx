import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supplierFormSchema, supplierInitialValues, supplierStatusOptions, type SupplierFormValues } from '@/features/suppliers/schemas/supplier-form-schema'
import { FormSelect } from '@/shared/components/form/form-select'
import { FormSection } from '@/shared/components/forms/form-section'

export function SupplierForm({ defaultValues, submitLabel, onCancel, onSubmit }: { defaultValues?: SupplierFormValues; submitLabel: string; onCancel: () => void; onSubmit: (values: SupplierFormValues) => Promise<void> }) {
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: defaultValues ?? supplierInitialValues,
  })

  useEffect(() => {
    form.reset(defaultValues ?? supplierInitialValues)
  }, [defaultValues, form])

  const errors = form.formState.errors

  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title="Info supplier" description="Identitas dan kontak supplier.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nama supplier
          <Input aria-invalid={Boolean(errors.name)} {...form.register('name')} placeholder="PT Sumber Makmur" />
          {errors.name ? <span className="text-xs text-destructive">{errors.name.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Telepon
          <Input aria-invalid={Boolean(errors.phone)} {...form.register('phone')} placeholder="08123456789" />
          {errors.phone ? <span className="text-xs text-destructive">{errors.phone.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Kota
          <Input aria-invalid={Boolean(errors.city)} {...form.register('city')} placeholder="Jakarta" />
          {errors.city ? <span className="text-xs text-destructive">{errors.city.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Status
          <FormSelect control={form.control} name="status" options={supplierStatusOptions.map(o => ({ label: o, value: o }))} />
        </label>
      </FormSection>
      <FormSection title="Ringkasan transaksi" description="Hutang berjalan dan total order supplier.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Hutang
          <Input inputMode="numeric" aria-invalid={Boolean(errors.payable)} {...form.register('payable')} placeholder="0" />
          {errors.payable ? <span className="text-xs text-destructive">{errors.payable.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Total order
          <Input inputMode="numeric" aria-invalid={Boolean(errors.orders)} {...form.register('orders')} placeholder="0" />
          {errors.orders ? <span className="text-xs text-destructive">{errors.orders.message}</span> : null}
        </label>
      </FormSection>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
