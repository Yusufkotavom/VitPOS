import { z } from 'zod'

import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { parseDigits } from '@/features/catalog/lib/formatters'
import { toDateInput } from '@/lib/date'
import type { LocalPayment } from '@/services/local-db/schema'

export const paymentMethodOptions = ['tunai', 'qris', 'kartu', 'transfer', 'e-wallet', 'piutang'] as const
export const paymentStatusOptions = ['Berhasil', 'Pending', 'Gagal', 'Refund'] as const

export const paymentFormSchema = z.object({
  ref: z.string().trim().min(1, 'Nomor referensi wajib diisi'),
  salesOrderId: z.string().trim().optional(),
  serviceOrderId: z.string().trim().optional(),
  purchaseId: z.string().trim().optional(),
  source: z.string().trim().min(1, 'Sumber pembayaran wajib diisi'),
  method: z.enum(paymentMethodOptions),
  amount: z.string().trim().min(1, 'Nominal wajib diisi'),
  date: z.string().trim().min(1, 'Tanggal wajib diisi'),
  status: z.enum(paymentStatusOptions),
})

export type PaymentFormValues = z.infer<typeof paymentFormSchema>

export const paymentInitialValues: PaymentFormValues = {
  ref: '',
  salesOrderId: '',
  serviceOrderId: '',
  purchaseId: '',
  source: '',
  method: 'tunai',
  amount: '0',
  date: new Date().toISOString().slice(0, 10),
  status: 'Berhasil',
}

export function mapPaymentFormToRecord(values: PaymentFormValues, id: string, base?: LocalPayment): LocalPayment {
  return {
    id,
    tenantId: resolveTenantId(base?.tenantId),
    ref: values.ref.trim(),
    salesOrderId: values.salesOrderId?.trim() || undefined,
    serviceOrderId: values.serviceOrderId?.trim() || undefined,
    purchaseId: values.purchaseId?.trim() || undefined,
    source: values.source.trim(),
    method: values.method,
    amount: parseDigits(values.amount),
    date: values.date,
    status: values.status,
    syncStatus: 'pending',
    version: (base?.version ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  }
}

export function mapPaymentRecordToFormValues(payment: LocalPayment): PaymentFormValues {
  return {
    ref: payment.ref,
    salesOrderId: payment.salesOrderId ?? '',
    serviceOrderId: payment.serviceOrderId ?? '',
    purchaseId: payment.purchaseId ?? '',
    source: payment.source,
    method: payment.method as PaymentFormValues['method'],
    amount: String(payment.amount),
    date: toDateInput(payment.date),
    status: payment.status,
  }
}
