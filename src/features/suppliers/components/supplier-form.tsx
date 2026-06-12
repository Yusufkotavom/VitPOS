import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supplierFormSchema, supplierInitialValues, supplierStatusOptions, type SupplierFormValues } from '@/features/suppliers/schemas/supplier-form-schema'
import { FormSelect } from '@/shared/components/form/form-select'
import { FormSection } from '@/shared/components/forms/form-section'

export function SupplierForm({ defaultValues, submitLabel, onCancel, onSubmit }: { defaultValues?: SupplierFormValues; submitLabel: string; onCancel: () => void; onSubmit: (values: SupplierFormValues) => Promise<void> }) {
  const { t } = useTranslation()
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
      <FormSection title={t('suppliers.info')} description={t('suppliers.info_description')}>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('suppliers.name_label')}
          <Input aria-invalid={Boolean(errors.name)} {...form.register('name')} placeholder={t('suppliers.name_placeholder')} />
          {errors.name ? <span className="text-xs text-destructive">{errors.name.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('common.phone')}
          <Input aria-invalid={Boolean(errors.phone)} {...form.register('phone')} placeholder="08123456789" />
          {errors.phone ? <span className="text-xs text-destructive">{errors.phone.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('common.city')}
          <Input aria-invalid={Boolean(errors.city)} {...form.register('city')} placeholder={t('common.city_placeholder') || 'Jakarta'} />
          {errors.city ? <span className="text-xs text-destructive">{errors.city.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('common.status')}
          <FormSelect control={form.control} name="status" options={supplierStatusOptions.map(o => ({ label: o, value: o }))} />
        </label>
      </FormSection>
      <FormSection title={t('suppliers.transaction_summary')} description={t('suppliers.transaction_summary_description')}>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('suppliers.payable')}
          <Input inputMode="numeric" aria-invalid={Boolean(errors.payable)} {...form.register('payable')} placeholder="0" />
          {errors.payable ? <span className="text-xs text-destructive">{errors.payable.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t('suppliers.total_order')}
          <Input inputMode="numeric" aria-invalid={Boolean(errors.orders)} {...form.register('orders')} placeholder="0" />
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
