import { z } from 'zod'

import { formatRupiahFromNumber, formatUnits, parseDigits } from '@/features/catalog/lib/formatters'
import type { LocalCustomer } from '@/services/local-db/schema'

export const customerStatusOptions = ['Aktif', 'Piutang', 'Nonaktif'] as const

export const customerFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama pelanggan wajib diisi'),
  phone: z.string().trim().min(6, 'Nomor WhatsApp wajib diisi'),
  city: z.string().trim().min(1, 'Kota wajib diisi'),
  receivable: z.string().trim().min(1, 'Nominal piutang wajib diisi'),
  orders: z.string().trim().min(1, 'Total order wajib diisi'),
  status: z.enum(customerStatusOptions),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>

export const customerInitialValues: CustomerFormValues = {
  name: '',
  phone: '',
  city: '',
  receivable: '0',
  orders: '0',
  status: 'Aktif',
}

export function mapCustomerFormToRecord(values: CustomerFormValues, id: string): LocalCustomer {
  return {
    id,
    name: values.name.trim(),
    phone: values.phone.trim(),
    city: values.city.trim(),
    receivable: formatRupiahFromNumber(parseDigits(values.receivable)),
    orders: formatUnits(parseDigits(values.orders), 'order'),
    status: values.status,
  }
}

export function mapCustomerRecordToFormValues(customer: LocalCustomer): CustomerFormValues {
  return {
    name: customer.name,
    phone: customer.phone,
    city: customer.city,
    receivable: String(parseDigits(customer.receivable)),
    orders: String(parseDigits(customer.orders)),
    status: customer.status === 'Aktif' || customer.status === 'Piutang' || customer.status === 'Nonaktif' ? customer.status : 'Aktif',
  }
}
