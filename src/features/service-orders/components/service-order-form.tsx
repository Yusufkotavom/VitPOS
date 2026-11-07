import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { serviceOrderFormSchema, serviceOrderInitialValues, serviceOrderStatusOptions, type ServiceOrderFormValues } from '@/features/service-orders/schemas/service-order-form-schema'
import { FormSelect } from '@/shared/components/form/form-select'
import { FormSection } from '@/shared/components/forms/form-section'

export function ServiceOrderForm({ defaultValues, submitLabel, onCancel, onSubmit }: { defaultValues?: ServiceOrderFormValues; submitLabel: string; onCancel: () => void; onSubmit: (values: ServiceOrderFormValues) => Promise<void> }) {
  const { t } = useTranslation()
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
          {t('service_orders.service_number')}
          <Input aria-invalid={Boolean(errors.code)} {...form.register('code')} placeholder={t('service_orders.service_number_placeholder')} />
          {errors.code ? <span className="text-xs text-destructive">{errors.code.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('common.customer')}
          <Input aria-invalid={Boolean(errors.customerName)} {...form.register('customerName')} placeholder={t('service_orders.customer_name_placeholder')} />
          {errors.customerName ? <span className="text-xs text-destructive">{errors.customerName.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('service_orders.entry_date')}
          <Input type="date" aria-invalid={Boolean(errors.date)} {...form.register('date')} />
          {errors.date ? <span className="text-xs text-destructive">{errors.date.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('common.status')}
          <FormSelect control={form.control} name="status" options={serviceOrderStatusOptions.map(o => ({ label: o, value: o }))} />
        </label>
      </div>
      <FormSection title={t('service_orders.job_and_cost')} description={t('service_orders.job_and_cost_description')}>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('service_orders.job_description')}
          <textarea className="min-h-[80px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" aria-invalid={Boolean(errors.description)} {...form.register('description')} placeholder={t('service_orders.job_description_example')} />
          {errors.description ? <span className="text-xs text-destructive">{errors.description.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('service_orders.cost')}
          <Input inputMode="numeric" aria-invalid={Boolean(errors.cost)} {...form.register('cost')} placeholder={t('service_orders.cost_placeholder')} />
          {errors.cost ? <span className="text-xs text-destructive">{errors.cost.message}</span> : null}
        </label>
      </FormSection>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
