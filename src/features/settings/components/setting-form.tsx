import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { settingFormSchema, settingStatusOptions, type SettingFormValues } from '@/features/settings/schemas/setting-form-schema'
import { FormSelect } from '@/shared/components/form/form-select'
import { FormSection } from '@/shared/components/forms/form-section'

export function SettingForm({
  defaultValues,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  defaultValues?: SettingFormValues
  submitLabel: string
  onCancel: () => void
  onSubmit: (values: SettingFormValues) => Promise<void>
}) {
  const form = useForm<SettingFormValues>({
    resolver: zodResolver(settingFormSchema),
    defaultValues: defaultValues ?? { area: '', setting: '', value: '', status: 'Lengkap' },
  })

  useEffect(() => {
    if (defaultValues) form.reset(defaultValues)
  }, [defaultValues, form])

  const errors = form.formState.errors

  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title="Identitas pengaturan" description="Area dan nama pengaturan.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Area
          <Input aria-invalid={Boolean(errors.area)} {...form.register('area')} placeholder="Profil Usaha" />
          {errors.area ? <span className="text-xs text-destructive">{errors.area.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Pengaturan
          <Input aria-invalid={Boolean(errors.setting)} {...form.register('setting')} placeholder="Nama usaha dan logo" />
          {errors.setting ? <span className="text-xs text-destructive">{errors.setting.message}</span> : null}
        </label>
      </FormSection>
      <FormSection title="Nilai" description="Isi pengaturan saat ini.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nilai
          <Input aria-invalid={Boolean(errors.value)} {...form.register('value')} placeholder="Toko Baim Jaya" />
          {errors.value ? <span className="text-xs text-destructive">{errors.value.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Status
          <FormSelect control={form.control} name="status" options={settingStatusOptions.map(o => ({ label: o, value: o }))} />
        </label>
      </FormSection>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
