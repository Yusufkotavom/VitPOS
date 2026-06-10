import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/shared/components/forms/currency-input'
import { paymentFormSchema, paymentInitialValues, paymentMethodOptions, paymentStatusOptions, type PaymentFormValues } from '@/features/payments/schemas/payment-form-schema'
import { FormSelect } from '@/shared/components/form/form-select'
import { FormSection } from '@/shared/components/forms/form-section'

export function PaymentForm({ defaultValues, submitLabel, onCancel, onSubmit }: { defaultValues?: PaymentFormValues; submitLabel: string; onCancel: () => void; onSubmit: (values: PaymentFormValues) => Promise<void> }) {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: defaultValues ?? paymentInitialValues,
  })

  useEffect(() => {
    form.reset(defaultValues ?? paymentInitialValues)
  }, [defaultValues, form])

  const errors = form.formState.errors

  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title="Info pembayaran" description="Referensi, sumber, dan metode pembayaran.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nomor referensi
          <Input aria-invalid={Boolean(errors.ref)} {...form.register('ref')} placeholder="PAY-20260608-001" />
          {errors.ref ? <span className="text-xs text-destructive">{errors.ref.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Sumber
          <Input aria-invalid={Boolean(errors.source)} {...form.register('source')} placeholder="Nama pelanggan / invoice" />
          {errors.source ? <span className="text-xs text-destructive">{errors.source.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Metode bayar
          <FormSelect control={form.control} name="method" options={paymentMethodOptions.map(o => ({ label: o, value: o }))} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tanggal
          <Input type="date" aria-invalid={Boolean(errors.date)} {...form.register('date')} />
          {errors.date ? <span className="text-xs text-destructive">{errors.date.message}</span> : null}
        </label>
      </FormSection>
      <FormSection title="Nominal & status" description="Jumlah pembayaran dan status transaksi.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nominal
          <CurrencyInput prefix="Rp" aria-invalid={Boolean(errors.amount)} {...form.register('amount')} placeholder="0" />
          {errors.amount ? <span className="text-xs text-destructive">{errors.amount.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Status
          <FormSelect control={form.control} name="status" options={paymentStatusOptions.map(o => ({ label: o, value: o }))} />
        </label>
      </FormSection>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
