import { z } from 'zod'

import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { parseDigits } from '@/features/catalog/lib/formatters'
import type { LocalReturn, LocalReturnItem } from '@/services/local-db/schema'

export const returnTypeOptions = ['Penjualan', 'Pembelian'] as const
export const returnStatusOptions = ['Draft', 'Diproses', 'Selesai', 'Batal'] as const

export const returnItemSchema = z.object({
  name: z.string().trim().min(1, 'Nama produk wajib diisi'),
  qty: z.string().trim().min(1, 'Qty wajib diisi'),
  unitPrice: z.string().trim().min(1, 'Harga wajib diisi'),
})

export const returnFormSchema = z.object({
  code: z.string().trim(),
  type: z.enum(returnTypeOptions),
  referenceCode: z.string().trim().min(1, 'Kode referensi wajib diisi'),
  date: z.string().trim().min(1, 'Tanggal wajib diisi'),
  status: z.enum(returnStatusOptions),
  items: z.array(returnItemSchema).min(1, 'Minimal 1 item'),
})

export type ReturnFormValues = z.infer<typeof returnFormSchema>

export const returnInitialValues: ReturnFormValues = {
  code: '',
  type: 'Penjualan',
  referenceCode: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'Draft',
  items: [{ name: '', qty: '1', unitPrice: '0' }],
}

export function mapReturnFormToRecord(values: ReturnFormValues, id: string, base?: LocalReturn): LocalReturn {
  const tenantId = resolveTenantId(base?.tenantId)
  const items: LocalReturnItem[] = values.items.map((item, idx) => {
    const qty = parseDigits(item.qty)
    const unitPrice = parseDigits(item.unitPrice)
    return {
      id: base?.items[idx]?.id ?? crypto.randomUUID(),
      tenantId: base?.items[idx]?.tenantId ?? tenantId,
      returnId: id,
      productId: base?.items[idx]?.productId ?? '',
      name: item.name.trim(),
      qty,
      unitPrice,
      subtotal: qty * unitPrice,
    }
  })

  const total = items.reduce((sum, item) => sum + item.subtotal, 0)

  return {
    id,
    tenantId,
    code: values.code.trim(),
    type: values.type,
    referenceCode: values.referenceCode.trim(),
    date: values.date,
    total,
    status: values.status,
    items,
    syncStatus: 'pending',
    version: (base?.version ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  }
}

export function mapReturnRecordToFormValues(ret: LocalReturn): ReturnFormValues {
  return {
    code: ret.code,
    type: ret.type,
    referenceCode: ret.referenceCode,
    date: ret.date,
    status: ret.status,
    items: ret.items.length > 0
      ? ret.items.map((item) => ({ name: item.name, qty: String(item.qty), unitPrice: String(item.unitPrice) }))
      : [{ name: '', qty: '1', unitPrice: '0' }],
  }
}
