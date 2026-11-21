import { z } from 'zod'

import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { parseDigits } from '@/features/catalog/lib/formatters'
import type { LocalProduct, WholesaleTier } from '@/services/local-db/schema'

export const productStatusOptions = ['Aktif', 'Draft', 'Arsip'] as const
export const productTypeOptions = ['Produk Fisik', 'Jasa'] as const

export const wholesaleTierSchema = z.object({
  minQty: z.string().trim().min(1, 'Min qty wajib diisi'),
  price: z.string().trim().min(1, 'Harga wajib diisi'),
})

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama produk wajib diisi'),
  category: z.string().trim().min(1, 'Kategori wajib diisi'),
  type: z.enum(productTypeOptions),
  sku: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  costPrice: z.string().trim().optional(),
  price: z.string().trim().min(1, 'Harga wajib diisi'),
  wholesalePrice: z.string().trim().optional(),
  wholesaleTiers: z.array(wholesaleTierSchema).optional(),
  stock: z.string().trim().optional(),
  manageStock: z.boolean(),
  unit: z.string().trim().optional(),
  status: z.enum(productStatusOptions),
  imageUrl: z.string().trim().optional(),
  icon: z.string().trim().optional(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export const productInitialValues: ProductFormValues = {
  name: '',
  category: 'Umum',
  type: 'Produk Fisik',
  sku: '',
  barcode: '',
  costPrice: '0',
  price: '0',
  wholesalePrice: '',
  wholesaleTiers: [],
  stock: '0',
  manageStock: true,
  unit: 'pcs',
  status: 'Aktif',
  imageUrl: '',
  icon: 'Package',
}

export function mapProductFormToRecord(values: ProductFormValues, id: string, base?: LocalProduct): LocalProduct {
  const isService = values.type === 'Jasa'
  const parsedCostPrice = values.costPrice ? parseDigits(values.costPrice) : undefined
  const parsedPrice = parseDigits(values.price)
  const parsedWholesalePrice = values.wholesalePrice ? parseDigits(values.wholesalePrice) : undefined
  const manageStock = isService ? false : values.manageStock
  const parsedStock = manageStock && values.stock ? parseDigits(values.stock) : 0
  const now = new Date().toISOString()

  const wholesaleTiers: WholesaleTier[] | undefined = values.wholesaleTiers
    ?.filter(t => t.minQty && t.price)
    .map(t => ({
      minQty: parseDigits(t.minQty) ?? 0,
      price: parseDigits(t.price) ?? 0,
    }))
    .filter(t => t.minQty > 0 && t.price > 0)

  return {
    id,
    tenantId: resolveTenantId(base?.tenantId),
    name: values.name.trim(),
    category: values.category.trim(),
    type: values.type,
    costPrice: parsedCostPrice,
    price: parsedPrice,
    wholesalePrice: parsedWholesalePrice,
    wholesaleTiers: wholesaleTiers && wholesaleTiers.length > 0 ? wholesaleTiers : undefined,
    stock: parsedStock,
    manageStock,
    unit: values.unit?.trim() || (isService ? 'unit' : 'pcs'),
    status: values.status,
    imageUrl: values.imageUrl,
    icon: values.icon,
    sku: values.sku?.trim() || undefined,
    barcode: values.barcode?.trim() || undefined,
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
    sku: product.sku ?? '',
    barcode: product.barcode ?? '',
    costPrice: String(product.costPrice ?? 0),
    price: String(product.price),
    wholesalePrice: product.wholesalePrice ? String(product.wholesalePrice) : '',
    wholesaleTiers: product.wholesaleTiers?.map(t => ({
      minQty: String(t.minQty),
      price: String(t.price),
    })) ?? [],
    stock: String(product.stock),
    manageStock: product.manageStock ?? true,
    unit: product.unit ?? (product.type === 'Jasa' ? 'unit' : 'pcs'),
    status: product.status === 'Aktif' || product.status === 'Draft' || product.status === 'Arsip' ? product.status : 'Aktif',
    imageUrl: product.imageUrl ?? '',
    icon: product.icon ?? 'Package',
  }
}
