import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { serviceOrderFormSchema, serviceOrderInitialValues, serviceOrderStatusOptions, type ServiceOrderFormValues } from '@/features/service-orders/schemas/service-order-form-schema'
import { FormSelect } from '@/shared/components/form/form-select'
import { FormSection } from '@/shared/components/forms/form-section'

export function ServiceOrderForm({ defaultValues, submitLabel, onCancel, onSubmit }: { defaultValues?: ServiceOrderFormValues; submitLabel: string; onCancel: () => void; onSubmit: (values: ServiceOrderFormValues) => Promise<void> }) {
  const form = useForm<ServiceOrderFormValues>({
    resolver: zodResolver(serviceOrderFormSchema),
    defaultValues: defaultValues ?? serviceOrderInitialValues,
  })

  useEffect(() => {
    form.reset(defaultValues ?? serviceOrderInitialValues)
  }, [defaultValues, form])

  const errors = form.formState.errors

  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nomor service
          <Input aria-invalid={Boolean(errors.code)} {...form.register('code')} placeholder="SVC-20260608-001" />
          {errors.code ? <span className="text-xs text-destructive">{errors.code.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Pelanggan
          <Input aria-invalid={Boolean(errors.customerName)} {...form.register('customerName')} placeholder="Nama pelanggan" />
          {errors.customerName ? <span className="text-xs text-destructive">{errors.customerName.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tanggal masuk
          <Input type="date" aria-invalid={Boolean(errors.date)} {...form.register('date')} />
          {errors.date ? <span className="text-xs text-destructive">{errors.date.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Status
          <FormSelect control={form.control} name="status" options={serviceOrderStatusOptions.map(o => ({ label: o, value: o }))} />
        </label>
      </div>
      <FormSection title="Pekerjaan & biaya" description="Deskripsi pekerjaan dan estimasi biaya.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Deskripsi pekerjaan
          <textarea className="min-h-[80px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" aria-invalid={Boolean(errors.description)} {...form.register('description')} placeholder="Ganti LCD, servis board, dll" />
          {errors.description ? <span className="text-xs text-destructive">{errors.description.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Biaya
          <Input inputMode="numeric" aria-invalid={Boolean(errors.cost)} {...form.register('cost')} placeholder="0" />
          {errors.cost ? <span className="text-xs text-destructive">{errors.cost.message}</span> : null}
        </label>
      </FormSection>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
