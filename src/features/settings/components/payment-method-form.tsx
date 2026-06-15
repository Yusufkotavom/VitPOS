import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { paymentMethodFormSchema, paymentMethodInitialValues, paymentMethodStatusOptions, type PaymentMethodFormValues } from '@/features/settings/schemas/payment-method-schema'
import { FormSection } from '@/shared/components/forms/form-section'
import { FormSelect } from '@/shared/components/form/form-select'

export function PaymentMethodForm({ defaultValues, submitLabel, onCancel, onSubmit, isEdit }: { defaultValues?: PaymentMethodFormValues; submitLabel: string; onCancel: () => void; onSubmit: (values: PaymentMethodFormValues) => Promise<void>; isEdit?: boolean }) {
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
          <Input disabled={isEdit} aria-invalid={Boolean(errors.provider)} {...form.register('provider')} placeholder="BCA" />
          {errors.provider ? <span className="text-xs text-destructive">{errors.provider.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tipe (cth: Transfer Bank, QRIS, e-Wallet)
          <Input disabled={isEdit} aria-invalid={Boolean(errors.type)} {...form.register('type')} placeholder="Transfer Bank" />
          {errors.type ? <span className="text-xs text-destructive">{errors.type.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nomor Rekening / Akun (Opsional)
          <Input disabled={isEdit} aria-invalid={Boolean(errors.accountNumber)} {...form.register('accountNumber')} placeholder="123456789" />
          {errors.accountNumber ? <span className="text-xs text-destructive">{errors.accountNumber.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nama Rekening / Akun (Opsional)
          <Input disabled={isEdit} aria-invalid={Boolean(errors.accountName)} {...form.register('accountName')} placeholder="A/N Toko Rejeki" />
          {errors.accountName ? <span className="text-xs text-destructive">{errors.accountName.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          URL Gambar QRIS (Opsional)
          <Input disabled={isEdit} aria-invalid={Boolean(errors.qrImageUrl)} {...form.register('qrImageUrl')} placeholder="https://example.com/qris.jpg" />
          {errors.qrImageUrl ? <span className="text-xs text-destructive">{errors.qrImageUrl.message}</span> : null}
        </label>
      </FormSection>
      
      <FormSection title="Instruksi & Status" description="Cara pembayaran dan status aktif.">
        <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
          Instruksi Pembayaran (Opsional)
          <Textarea disabled={isEdit} aria-invalid={Boolean(errors.instructions)} {...form.register('instructions')} placeholder="1. Buka aplikasi bank/e-wallet&#10;2. Scan QRIS di atas&#10;3. Masukkan nominal..." className="min-h-24" />
          {errors.instructions ? <span className="text-xs text-destructive">{errors.instructions.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Status
          <FormSelect control={form.control} name="status" options={paymentMethodStatusOptions.map(o => ({ label: o, value: o }))} disabled={isEdit} />
        </label>
      </FormSection>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
