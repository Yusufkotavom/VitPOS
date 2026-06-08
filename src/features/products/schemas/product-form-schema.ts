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
  wholesalePrice: z.string().trim().optional(),
  stock: z.string().trim().optional(),
  manageStock: z.boolean(),
  status: z.enum(productStatusOptions),
  imageUrl: z.string().trim().optional(),
  icon: z.string().trim().optional(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export const productInitialValues: ProductFormValues = {
  name: '',
  category: 'Umum',
  type: 'Produk Fisik',
  price: '0',
  wholesalePrice: '',
  stock: '0',
  manageStock: true,
  status: 'Aktif',
  imageUrl: '',
  icon: 'Package',
}

export function mapProductFormToRecord(values: ProductFormValues, id: string, base?: LocalProduct): LocalProduct {
  const isService = values.type === 'Jasa'
  const parsedPrice = parseDigits(values.price)
  const parsedWholesalePrice = values.wholesalePrice ? parseDigits(values.wholesalePrice) : undefined
  const manageStock = isService ? false : values.manageStock
  const parsedStock = manageStock && values.stock ? parseDigits(values.stock) : 0
  const now = new Date().toISOString()

  return {
    id,
    name: values.name.trim(),
    category: values.category.trim(),
    type: values.type,
    price: parsedPrice,
    wholesalePrice: parsedWholesalePrice,
    stock: parsedStock,
    manageStock,
    status: values.status,
    imageUrl: values.imageUrl,
    icon: values.icon,
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
    wholesalePrice: product.wholesalePrice ? String(product.wholesalePrice) : '',
    stock: String(product.stock),
    manageStock: product.manageStock ?? true,
    status: product.status === 'Aktif' || product.status === 'Draft' || product.status === 'Arsip' ? product.status : 'Aktif',
    imageUrl: product.imageUrl ?? '',
    icon: product.icon ?? 'Package',
  }
}
