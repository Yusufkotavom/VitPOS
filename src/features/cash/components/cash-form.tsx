import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch, Controller } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/shared/components/forms/currency-input'
import {
  cashAccountOptions,
  cashFormSchema,
  cashInitialValues,
  cashStatusOptions,
  cashTypeOptions,
  type CashFormValues,
} from '@/features/cash/schemas/cash-form-schema'
import { FormSelect } from '@/shared/components/form/form-select'
import { FormSection } from '@/shared/components/forms/form-section'

export function CashForm({
  defaultValues,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  defaultValues?: CashFormValues
  submitLabel: string
  onCancel: () => void
  onSubmit: (values: CashFormValues) => Promise<void>
}) {
  const form = useForm<CashFormValues>({
    resolver: zodResolver(cashFormSchema),
    defaultValues: defaultValues ?? cashInitialValues,
  })

  useEffect(() => {
    form.reset(defaultValues ?? cashInitialValues)
  }, [defaultValues, form])

  const errors = form.formState.errors
  const type = useWatch({ control: form.control, name: 'type' })

  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title="Info transaksi" description="Nomor referensi, tanggal, dan akun kas.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nomor referensi
          <Input aria-invalid={Boolean(errors.ref)} {...form.register('ref')} placeholder="KAS-004" />
          {errors.ref ? <span className="text-xs text-destructive">{errors.ref.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tanggal
          <Input aria-invalid={Boolean(errors.date)} {...form.register('date')} placeholder="8 Juni 2026" />
          {errors.date ? <span className="text-xs text-destructive">{errors.date.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Akun kas
          <FormSelect control={form.control} name="account" options={cashAccountOptions.map(o => ({ label: o, value: o }))} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Kategori
          <Input aria-invalid={Boolean(errors.category)} {...form.register('category')} placeholder="Penjualan" />
          {errors.category ? <span className="text-xs text-destructive">{errors.category.message}</span> : null}
        </label>
      </FormSection>
      <FormSection title="Nilai" description="Jenis arus kas dan nominal.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Jenis
          <FormSelect control={form.control} name="type" options={cashTypeOptions.map(o => ({ label: o, value: o }))} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {type === 'Pemasukan' ? 'Nominal masuk' : 'Nominal keluar'}
          <Controller
            control={form.control}
            name="amount"
            render={({ field }) => (
              <CurrencyInput prefix="Rp" aria-invalid={Boolean(errors.amount)} value={field.value} onChange={field.onChange} placeholder="0" />
            )}
          />
          {errors.amount ? <span className="text-xs text-destructive">{errors.amount.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Status
          <FormSelect control={form.control} name="status" options={cashStatusOptions.map(o => ({ label: o, value: o }))} />
        </label>
      </FormSection>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
