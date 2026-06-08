import { z } from 'zod'

import { parseDigits } from '@/features/catalog/lib/formatters'
import type { LocalSupplier } from '@/services/local-db/schema'

export const supplierStatusOptions = ['Aktif', 'Hutang', 'Nonaktif'] as const

export const supplierFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama supplier wajib diisi'),
  phone: z.string().trim().min(6, 'Nomor telepon wajib diisi'),
  city: z.string().trim().min(1, 'Kota wajib diisi'),
  payable: z.string().trim().min(1, 'Nominal hutang wajib diisi'),
  orders: z.string().trim().min(1, 'Total order wajib diisi'),
  status: z.enum(supplierStatusOptions),
})

export type SupplierFormValues = z.infer<typeof supplierFormSchema>

export const supplierInitialValues: SupplierFormValues = {
  name: '',
  phone: '',
  city: '',
  payable: '0',
  orders: '0',
  status: 'Aktif',
}

export function mapSupplierFormToRecord(values: SupplierFormValues, id: string, base?: LocalSupplier): LocalSupplier {
  return {
    id,
    name: values.name.trim(),
    phone: values.phone.trim(),
    city: values.city.trim(),
    payable: parseDigits(values.payable),
    orders: parseDigits(values.orders),
    status: values.status,
    syncStatus: 'pending',
    version: (base?.version ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  }
}

export function mapSupplierRecordToFormValues(supplier: LocalSupplier): SupplierFormValues {
  return {
    name: supplier.name,
    phone: supplier.phone,
    city: supplier.city,
    payable: String(supplier.payable),
    orders: String(supplier.orders),
    status: supplier.status === 'Aktif' || supplier.status === 'Hutang' || supplier.status === 'Nonaktif' ? supplier.status : 'Aktif',
  }
}
