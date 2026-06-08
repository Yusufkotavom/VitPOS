import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { settingFormSchema, settingStatusOptions, type SettingFormValues } from '@/features/settings/schemas/setting-form-schema'
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
          <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" {...form.register('status')}>
            {settingStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
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
