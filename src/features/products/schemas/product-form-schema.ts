import { z } from 'zod'

import { parseDigits } from '@/features/catalog/lib/formatters'
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

export function mapProductFormToRecord(values: ProductFormValues, id: string, base?: LocalProduct): LocalProduct {
  const isService = values.type === 'Jasa'
  const parsedPrice = parseDigits(values.price)
  const parsedStock = isService ? 0 : parseDigits(values.stock)
  const now = new Date().toISOString()

  return {
    id,
    name: values.name.trim(),
    category: values.category.trim(),
    type: values.type,
    price: parsedPrice,
    stock: parsedStock,
    status: values.status,
    syncStatus: 'pending',
    version: (base?.version ?? 0) + 1,
    updatedAt: now,
  }
}

export function mapProductRecordToFormValues(product: LocalProduct): ProductFormValues {
  return {
    name: product.name,
    category: product.category,
    type: product.type,
    price: String(product.price),
    stock: String(product.stock),
    status: product.status === 'Aktif' || product.status === 'Draft' || product.status === 'Arsip' ? product.status : 'Aktif',
  }
}
