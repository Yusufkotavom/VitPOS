import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  cashAccountOptions,
  cashFormSchema,
  cashInitialValues,
  cashStatusOptions,
  cashTypeOptions,
  type CashFormValues,
} from '@/features/cash/schemas/cash-form-schema'
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
          <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" {...form.register('account')}>
            {cashAccountOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
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
          <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" {...form.register('type')}>
            {cashTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {type === 'Pemasukan' ? 'Nominal masuk' : 'Nominal keluar'}
          <Input aria-invalid={Boolean(errors.amount)} inputMode="numeric" {...form.register('amount')} placeholder="0" />
          {errors.amount ? <span className="text-xs text-destructive">{errors.amount.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Status
          <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" {...form.register('status')}>
            {cashStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </FormSection>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
