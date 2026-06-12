import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/shared/components/forms/currency-input'
import { customerFormSchema, customerInitialValues, customerStatusOptions, type CustomerFormValues } from '@/features/customers/schemas/customer-form-schema'
import { FormSelect } from '@/shared/components/form/form-select'
import { FormSection } from '@/shared/components/forms/form-section'

export function CustomerForm({ defaultValues, submitLabel, onCancel, onSubmit }: { defaultValues?: CustomerFormValues; submitLabel: string; onCancel: () => void; onSubmit: (values: CustomerFormValues) => Promise<void> }) {
  const { t } = useTranslation()
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: defaultValues ?? customerInitialValues,
  })

  useEffect(() => {
    form.reset(defaultValues ?? customerInitialValues)
  }, [defaultValues, form])

  const errors = form.formState.errors

  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title={t('customers.info')} description={t('customers.info_description')}>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('customers.name_label')}
          <Input aria-invalid={Boolean(errors.name)} {...form.register('name')} placeholder={t('customers.name_placeholder')} />
          {errors.name ? <span className="text-xs text-destructive">{errors.name.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('customers.phone_label')}
          <Input aria-invalid={Boolean(errors.phone)} {...form.register('phone')} placeholder="08123456789" />
          {errors.phone ? <span className="text-xs text-destructive">{errors.phone.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('common.city')}
          <Input aria-invalid={Boolean(errors.city)} {...form.register('city')} placeholder="Bandung" />
          {errors.city ? <span className="text-xs text-destructive">{errors.city.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('common.status')}
          <FormSelect control={form.control} name="status" options={customerStatusOptions.map(o => ({ label: o, value: o }))} />
        </label>
      </FormSection>
      <FormSection title={t('customers.transaction_summary')} description={t('customers.transaction_summary_description')}>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('customers.receivable')}
          <Controller
            control={form.control}
            name="receivable"
            render={({ field }) => (
              <CurrencyInput prefix="Rp" aria-invalid={Boolean(errors.receivable)} value={field.value} onChange={field.onChange} placeholder="0" />
            )}
          />
          {errors.receivable ? <span className="text-xs text-destructive">{errors.receivable.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('customers.total_order')}
          <Input aria-invalid={Boolean(errors.orders)} inputMode="numeric" {...form.register('orders')} placeholder="0" />
          {errors.orders ? <span className="text-xs text-destructive">{errors.orders.message}</span> : null}
        </label>
      </FormSection>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
