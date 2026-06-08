import { z } from 'zod'

import { parseDigits } from '@/features/catalog/lib/formatters'
import type { LocalServiceOrder } from '@/services/local-db/schema'

export const serviceOrderStatusOptions = ['Diterima', 'Dikerjakan', 'Selesai', 'Diambil', 'Batal'] as const

export const serviceOrderFormSchema = z.object({
  code: z.string().trim().min(1, 'Nomor service wajib diisi'),
  customerName: z.string().trim().min(1, 'Nama pelanggan wajib diisi'),
  description: z.string().trim().min(1, 'Deskripsi pekerjaan wajib diisi'),
  date: z.string().trim().min(1, 'Tanggal wajib diisi'),
  cost: z.string().trim().min(1, 'Biaya wajib diisi'),
  status: z.enum(serviceOrderStatusOptions),
})

export type ServiceOrderFormValues = z.infer<typeof serviceOrderFormSchema>

export const serviceOrderInitialValues: ServiceOrderFormValues = {
  code: '',
  customerName: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  cost: '0',
  status: 'Diterima',
}

export function mapServiceOrderFormToRecord(values: ServiceOrderFormValues, id: string, base?: LocalServiceOrder): LocalServiceOrder {
  return {
    id,
    code: values.code.trim(),
    customerName: values.customerName.trim(),
    description: values.description.trim(),
    date: values.date,
    cost: parseDigits(values.cost),
    status: values.status,
    syncStatus: 'pending',
    version: (base?.version ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  }
}

export function mapServiceOrderRecordToFormValues(order: LocalServiceOrder): ServiceOrderFormValues {
  return {
    code: order.code,
    customerName: order.customerName,
    description: order.description,
    date: order.date,
    cost: String(order.cost),
    status: order.status,
  }
}
