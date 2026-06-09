import { z } from 'zod'

import { resolveTenantId } from '@/features/auth/stores/auth-store'
import type { LocalSetting } from '@/services/local-db/schema'

export const settingStatusOptions = ['Lengkap', 'Belum Lengkap', 'Draft'] as const

export const settingFormSchema = z.object({
  area: z.string().trim().min(1, 'Area wajib diisi'),
  setting: z.string().trim().min(1, 'Pengaturan wajib diisi'),
  value: z.string().trim().min(1, 'Nilai wajib diisi'),
  status: z.enum(settingStatusOptions),
})

export type SettingFormValues = z.infer<typeof settingFormSchema>

export function mapSettingFormToRecord(values: SettingFormValues, id: string): LocalSetting {
  return {
    id,
    tenantId: resolveTenantId(),
    area: values.area.trim(),
    setting: values.setting.trim(),
    value: values.value.trim(),
    status: values.status,
    updatedAt: new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date()),
  }
}

export function mapSettingRecordToFormValues(setting: LocalSetting): SettingFormValues {
  return {
    area: setting.area,
    setting: setting.setting,
    value: setting.value,
    status: setting.status === 'Lengkap' || setting.status === 'Belum Lengkap' || setting.status === 'Draft'
      ? setting.status
      : 'Lengkap',
  }
}
