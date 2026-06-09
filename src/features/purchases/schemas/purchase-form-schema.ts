import { z } from 'zod'

import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { parseDigits } from '@/features/catalog/lib/formatters'
import type { LocalPurchase, LocalPurchaseItem } from '@/services/local-db/schema'

export const purchaseStatusOptions = ['Draft', 'Dikirim', 'Diterima', 'Batal'] as const

export const purchaseItemSchema = z.object({
  name: z.string().trim().min(1, 'Nama produk wajib diisi'),
  qty: z.string().trim().min(1, 'Qty wajib diisi'),
  unitPrice: z.string().trim().min(1, 'Harga wajib diisi'),
})

export const purchaseFormSchema = z.object({
  code: z.string().trim().min(1, 'Nomor PO wajib diisi'),
  supplierName: z.string().trim().min(1, 'Nama supplier wajib diisi'),
  date: z.string().trim().min(1, 'Tanggal wajib diisi'),
  status: z.enum(purchaseStatusOptions),
  items: z.array(purchaseItemSchema).min(1, 'Minimal 1 item'),
})

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>

export const purchaseInitialValues: PurchaseFormValues = {
  code: '',
  supplierName: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'Draft',
  items: [{ name: '', qty: '1', unitPrice: '0' }],
}

export function mapPurchaseFormToRecord(values: PurchaseFormValues, id: string, base?: LocalPurchase): LocalPurchase {
  const tenantId = resolveTenantId(base?.tenantId)
  const items: LocalPurchaseItem[] = values.items.map((item, idx) => {
    const qty = parseDigits(item.qty)
    const unitPrice = parseDigits(item.unitPrice)
    return {
      id: base?.items[idx]?.id ?? crypto.randomUUID(),
      tenantId: base?.items[idx]?.tenantId ?? tenantId,
      purchaseId: id,
      productId: base?.items[idx]?.productId ?? '',
      name: item.name.trim(),
      qty,
      unitPrice,
      subtotal: qty * unitPrice,
    }
  })

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)

  return {
    id,
    tenantId,
    code: values.code.trim(),
    supplierName: values.supplierName.trim(),
    date: values.date,
    subtotal,
    grandTotal: subtotal,
    status: values.status,
    items,
    syncStatus: 'pending',
    version: (base?.version ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  }
}

export function mapPurchaseRecordToFormValues(purchase: LocalPurchase): PurchaseFormValues {
  return {
    code: purchase.code,
    supplierName: purchase.supplierName,
    date: purchase.date,
    status: purchase.status,
    items: purchase.items.length > 0
      ? purchase.items.map((item) => ({ name: item.name, qty: String(item.qty), unitPrice: String(item.unitPrice) }))
      : [{ name: '', qty: '1', unitPrice: '0' }],
  }
}
