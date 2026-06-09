import { z } from 'zod'

import { resolveTenantId } from '@/features/auth/stores/auth-store'
import type { LocalProductCategory } from '@/services/local-db/schema'

export const categoryStatusOptions = ['Aktif', 'Arsip'] as const

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi'),
  description: z.string().trim().optional(),
  status: z.enum(categoryStatusOptions),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export const categoryInitialValues: CategoryFormValues = {
  name: '',
  description: '',
  status: 'Aktif',
}

export function mapCategoryFormToRecord(values: CategoryFormValues, id: string, base?: LocalProductCategory): LocalProductCategory {
  const now = new Date().toISOString()

  return {
    id,
    tenantId: resolveTenantId(base?.tenantId),
    name: values.name.trim(),
    description: values.description ? values.description.trim() : undefined,
    status: values.status,
    syncStatus: 'pending',
    version: (base?.version ?? 0) + 1,
    updatedAt: now,
  }
}

export function mapCategoryRecordToFormValues(category: LocalProductCategory): CategoryFormValues {
  return {
    name: category.name,
    description: category.description ?? '',
    status: category.status,
  }
}
