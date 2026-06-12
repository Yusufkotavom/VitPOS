import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormSelect } from '@/shared/components/form/form-select'
import { categoryFormSchema, categoryInitialValues, categoryStatusOptions, type CategoryFormValues } from '@/features/products/schemas/category-form-schema'

export function CategoryForm({ defaultValues, submitLabel, onCancel, onSubmit }: { defaultValues?: CategoryFormValues; submitLabel: string; onCancel: () => void; onSubmit: (values: CategoryFormValues) => Promise<void> }) {
  const { t } = useTranslation()
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: defaultValues ?? categoryInitialValues,
  })

  useEffect(() => {
    form.reset(defaultValues ?? categoryInitialValues)
  }, [defaultValues, form])

  const errors = form.formState.errors

  return (
    <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('categories.name_label')}</label>
        <Input aria-invalid={Boolean(errors.name)} {...form.register('name')} placeholder={t('categories.name_placeholder')} />
        {errors.name ? <span className="text-xs text-destructive">{errors.name.message}</span> : null}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('categories.description_optional')}</label>
        <Input aria-invalid={Boolean(errors.description)} {...form.register('description')} placeholder={t('categories.description_placeholder')} />
        {errors.description ? <span className="text-xs text-destructive">{errors.description.message}</span> : null}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('common.status')}</label>
        <FormSelect control={form.control} name="status" options={categoryStatusOptions.map(o => ({ label: o, value: o }))} />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
