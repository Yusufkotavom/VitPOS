import { z } from 'zod'

import { resolveTenantId } from '@/features/auth/stores/auth-store'
import type { LocalPaymentMethod } from '@/services/local-db/schema'

export const paymentMethodStatusOptions = ['Aktif', 'Tidak Aktif'] as const

export const paymentMethodFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  provider: z.string().trim().min(1, 'Provider wajib diisi'),
  type: z.string().trim().min(1, 'Tipe wajib diisi'),
  accountNumber: z.string().trim().optional(),
  accountName: z.string().trim().optional(),
  status: z.enum(paymentMethodStatusOptions),
})

export type PaymentMethodFormValues = z.infer<typeof paymentMethodFormSchema>

export const paymentMethodInitialValues: PaymentMethodFormValues = {
  name: '',
  provider: '',
  type: '',
  accountNumber: '',
  accountName: '',
  status: 'Aktif',
}

export function mapPaymentMethodFormToRecord(values: PaymentMethodFormValues, id: string): LocalPaymentMethod {
  return {
    id,
    tenantId: resolveTenantId(),
    name: values.name.trim(),
    provider: values.provider.trim(),
    type: values.type.trim(),
    accountNumber: values.accountNumber?.trim(),
    accountName: values.accountName?.trim(),
    status: values.status,
    updatedAt: new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date()),
  }
}

export function mapPaymentMethodRecordToFormValues(paymentMethod: LocalPaymentMethod): PaymentMethodFormValues {
  return {
    name: paymentMethod.name,
    provider: paymentMethod.provider,
    type: paymentMethod.type,
    accountNumber: paymentMethod.accountNumber || '',
    accountName: paymentMethod.accountName || '',
    status: paymentMethod.status === 'Aktif' || paymentMethod.status === 'Tidak Aktif'
      ? paymentMethod.status
      : 'Aktif',
  }
}
