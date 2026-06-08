import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { paymentMethodFormSchema, paymentMethodInitialValues, paymentMethodStatusOptions, type PaymentMethodFormValues } from '@/features/settings/schemas/payment-method-schema'
import { FormSection } from '@/shared/components/forms/form-section'

export function PaymentMethodForm({ defaultValues, submitLabel, onCancel, onSubmit }: { defaultValues?: PaymentMethodFormValues; submitLabel: string; onCancel: () => void; onSubmit: (values: PaymentMethodFormValues) => Promise<void> }) {
  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodFormSchema),
    defaultValues: defaultValues ?? paymentMethodInitialValues,
  })

  useEffect(() => {
    form.reset(defaultValues ?? paymentMethodInitialValues)
  }, [defaultValues, form])

  const errors = form.formState.errors

  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title="Metode Pembayaran" description="Detail metode pembayaran untuk transaksi.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nama (cth: BCA Transfer, QRIS Gopay)
          <Input aria-invalid={Boolean(errors.name)} {...form.register('name')} placeholder="BCA Transfer" />
          {errors.name ? <span className="text-xs text-destructive">{errors.name.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Provider (cth: BCA, Midtrans, OVO)
          <Input aria-invalid={Boolean(errors.provider)} {...form.register('provider')} placeholder="BCA" />
          {errors.provider ? <span className="text-xs text-destructive">{errors.provider.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tipe
          <Input aria-invalid={Boolean(errors.type)} {...form.register('type')} placeholder="Transfer Bank" />
          {errors.type ? <span className="text-xs text-destructive">{errors.type.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nomor Rekening / Akun (Opsional)
          <Input aria-invalid={Boolean(errors.accountNumber)} {...form.register('accountNumber')} placeholder="123456789" />
          {errors.accountNumber ? <span className="text-xs text-destructive">{errors.accountNumber.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nama Rekening / Akun (Opsional)
          <Input aria-invalid={Boolean(errors.accountName)} {...form.register('accountName')} placeholder="A/N Toko Rejeki" />
          {errors.accountName ? <span className="text-xs text-destructive">{errors.accountName.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Status
          <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" {...form.register('status')}>
            {paymentMethodStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
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
