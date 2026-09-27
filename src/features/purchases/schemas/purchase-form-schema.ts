import { z } from 'zod'

import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { parseDigits } from '@/features/catalog/lib/formatters'
import { toDateInput } from '@/lib/date'
import type { LocalPurchase, LocalPurchaseItem } from '@/services/local-db/schema'

import { localDb } from '@/services/local-db/client'

export const purchaseStatusOptions = ['Draft', 'Dikirim', 'Diterima', 'Batal'] as const

export async function generatePurchaseCode(): Promise<string> {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const prefix = `PO-${y}${m}${d}`

  try {
    const purchases = await localDb.purchases.toArray()
    const regex = new RegExp(`^${prefix}-(\\d+)`)
    let maxNum = 0
    for (const p of purchases) {
      const match = p.code?.match(regex)
      if (match) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num) && num > maxNum) {
          maxNum = num
        }
      }
    }
    return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`
  } catch {
    return `${prefix}-001`
  }
}

export const purchaseItemSchema = z.object({
  productId: z.string().trim(),
  name: z.string().trim().min(1, 'Nama produk wajib diisi'),
  qty: z.string().trim().min(1, 'Qty wajib diisi'),
  unitPrice: z.string().trim().min(1, 'Harga wajib diisi'),
})

export const purchaseFormSchema = z.object({
  code: z.string(),
  supplierName: z.string().trim().min(1, 'Nama supplier wajib diisi'),
  date: z.string().trim().min(1, 'Tanggal wajib diisi'),
  status: z.enum(purchaseStatusOptions),
  isPaid: z.boolean().optional(),
  payMethod: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'Minimal 1 item'),
})

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>

export const purchaseInitialValues: PurchaseFormValues = {
  code: '',
  supplierName: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'Draft',
  isPaid: false,
  payMethod: 'tunai',
  items: [{ productId: '', name: '', qty: '1', unitPrice: '0' }],
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
      productId: item.productId?.trim() || base?.items[idx]?.productId || '',
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
    code: (values.code || '').trim() || (base?.code || '').trim(),
    supplierName: values.supplierName.trim(),
    date: values.date,
    subtotal,
    grandTotal: subtotal,
    paidTotal: base?.paidTotal ?? 0,
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
    date: toDateInput(purchase.date),
    status: purchase.status,
    isPaid: (purchase.paidTotal ?? 0) >= purchase.grandTotal && purchase.grandTotal > 0,
    payMethod: 'tunai',
    items: purchase.items.length > 0
      ? purchase.items.map((item) => ({ productId: item.productId ?? '', name: item.name, qty: String(item.qty), unitPrice: String(item.unitPrice) }))
      : [{ productId: '', name: '', qty: '1', unitPrice: '0' }],
  }
}
