import { z } from 'zod'

import { formatRupiahFromNumber, formatUnits, parseDigits } from '@/features/catalog/lib/formatters'
import type { LocalProduct } from '@/services/local-db/schema'

export const productStatusOptions = ['Aktif', 'Draft', 'Arsip'] as const
export const productTypeOptions = ['Produk Fisik', 'Jasa'] as const

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama produk wajib diisi'),
  category: z.string().trim().min(1, 'Kategori wajib diisi'),
  type: z.enum(productTypeOptions),
  price: z.string().trim().min(1, 'Harga wajib diisi'),
  stock: z.string().trim().min(1, 'Stok wajib diisi'),
  status: z.enum(productStatusOptions),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export const productInitialValues: ProductFormValues = {
  name: '',
  category: 'Umum',
  type: 'Produk Fisik',
  price: '0',
  stock: '0',
  status: 'Aktif',
}

export function mapProductFormToRecord(values: ProductFormValues, id: string): LocalProduct {
  return {
    id,
    name: values.name.trim(),
    category: values.category.trim(),
    type: values.type,
    price: formatRupiahFromNumber(parseDigits(values.price)),
    stock: values.type === 'Jasa' ? '-' : formatUnits(parseDigits(values.stock), 'pcs'),
    status: values.status,
  }
}

export function mapProductRecordToFormValues(product: LocalProduct): ProductFormValues {
  return {
    name: product.name,
    category: product.category,
    type: product.type,
    price: String(parseDigits(product.price)),
    stock: String(parseDigits(product.stock)),
    status: product.status === 'Aktif' || product.status === 'Draft' || product.status === 'Arsip' ? product.status : 'Aktif',
  }
}
