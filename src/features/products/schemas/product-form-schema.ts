import { z } from 'zod'

import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { parseDigits } from '@/features/catalog/lib/formatters'
import type { LocalProduct, LocalWholesaleTier } from '@/services/local-db/schema'

export const productStatusOptions = ['Aktif', 'Draft', 'Arsip'] as const
export const productTypeOptions = ['Produk Fisik', 'Jasa'] as const

const wholesaleTierSchema = z.object({
  minQty: z.string().trim(),
  price: z.string().trim(),
})

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama produk wajib diisi'),
  category: z.string().trim().min(1, 'Kategori wajib diisi'),
  type: z.enum(productTypeOptions),
  costPrice: z.string().trim().optional(),
  price: z.string().trim().min(1, 'Harga wajib diisi'),
  wholesalePrice: z.string().trim().optional(),
  stock: z.string().trim().optional(),
  manageStock: z.boolean(),
  hasWholesalePricing: z.boolean(),
  wholesaleTiers: z.array(wholesaleTierSchema),
  status: z.enum(productStatusOptions),
  imageUrl: z.string().trim().optional(),
  icon: z.string().trim().optional(),
}).superRefine((values, ctx) => {
  if (!values.hasWholesalePricing) {
    return
  }

  if (values.wholesaleTiers.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['wholesaleTiers'],
      message: 'Minimal satu tier grosir wajib diisi',
    })
    return
  }

  let previousQty = 0
  const seenQty = new Set<number>()

  values.wholesaleTiers.forEach((tier, index) => {
    const minQty = parseDigits(tier.minQty)
    const price = parseDigits(tier.price)

    if (minQty < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['wholesaleTiers', index, 'minQty'],
        message: 'Minimal qty harus 2 atau lebih',
      })
    }

    if (price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['wholesaleTiers', index, 'price'],
        message: 'Harga grosir wajib lebih dari 0',
      })
    }

    if (seenQty.has(minQty)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['wholesaleTiers', index, 'minQty'],
        message: 'Minimal qty tidak boleh duplikat',
      })
    }

    if (index > 0 && minQty <= previousQty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['wholesaleTiers', index, 'minQty'],
        message: 'Minimal qty harus urut naik',
      })
    }

    seenQty.add(minQty)
    previousQty = minQty
  })
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export const productInitialValues: ProductFormValues = {
  name: '',
  category: 'Umum',
  type: 'Produk Fisik',
  costPrice: '0',
  price: '0',
  wholesalePrice: '',
  stock: '0',
  manageStock: true,
  hasWholesalePricing: false,
  wholesaleTiers: [],
  status: 'Aktif',
  imageUrl: '',
  icon: 'Package',
}

function mapWholesaleTiers(values: ProductFormValues): LocalWholesaleTier[] | undefined {
  if (!values.hasWholesalePricing) {
    return undefined
  }

  return values.wholesaleTiers.map((tier) => ({
    minQty: parseDigits(tier.minQty),
    price: parseDigits(tier.price),
  }))
}

export function mapProductFormToRecord(values: ProductFormValues, id: string, base?: LocalProduct): LocalProduct {
  const isService = values.type === 'Jasa'
  const parsedCostPrice = values.costPrice ? parseDigits(values.costPrice) : undefined
  const parsedPrice = parseDigits(values.price)
  const manageStock = isService ? false : values.manageStock
  const parsedStock = manageStock && values.stock ? parseDigits(values.stock) : 0
  const wholesaleTiers = mapWholesaleTiers(values)
  const now = new Date().toISOString()

  return {
    id,
    tenantId: resolveTenantId(base?.tenantId),
    name: values.name.trim(),
    category: values.category.trim(),
    type: values.type,
    costPrice: parsedCostPrice,
    price: parsedPrice,
    wholesalePrice: values.wholesalePrice ? parseDigits(values.wholesalePrice) : undefined,
    wholesaleTiers,
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
    costPrice: String(product.costPrice ?? 0),
    price: String(product.price),
    wholesalePrice: product.wholesalePrice ? String(product.wholesalePrice) : '',
    stock: String(product.stock),
    manageStock: product.manageStock ?? true,
    hasWholesalePricing: (product.wholesaleTiers?.length ?? 0) > 0,
    wholesaleTiers: (product.wholesaleTiers ?? []).map((tier) => ({
      minQty: String(tier.minQty),
      price: String(tier.price),
    })),
    status: product.status === 'Aktif' || product.status === 'Draft' || product.status === 'Arsip' ? product.status : 'Aktif',
    imageUrl: product.imageUrl ?? '',
    icon: product.icon ?? 'Package',
  }
}
