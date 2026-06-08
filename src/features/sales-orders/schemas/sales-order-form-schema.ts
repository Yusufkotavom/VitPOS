import { z } from 'zod'

import { parseDigits } from '@/features/catalog/lib/formatters'
import type { LocalSalesOrder, LocalSalesOrderItem } from '@/services/local-db/schema'

export const salesOrderStatusOptions = ['Draft', 'Lunas', 'Sebagian', 'Belum Bayar', 'Batal'] as const

export const salesOrderItemSchema = z.object({
  name: z.string().trim().min(1, 'Nama produk wajib diisi'),
  qty: z.string().trim().min(1, 'Qty wajib diisi'),
  unitPrice: z.string().trim().min(1, 'Harga wajib diisi'),
})

export const salesOrderFormSchema = z.object({
  code: z.string().trim().min(1, 'Nomor invoice wajib diisi'),
  customerName: z.string().trim().min(1, 'Nama pelanggan wajib diisi'),
  date: z.string().trim().min(1, 'Tanggal wajib diisi'),
  discountTotal: z.string().trim(),
  taxTotal: z.string().trim(),
  status: z.enum(salesOrderStatusOptions),
  items: z.array(salesOrderItemSchema).min(1, 'Minimal 1 item'),
})

export type SalesOrderFormValues = z.infer<typeof salesOrderFormSchema>

export const salesOrderInitialValues: SalesOrderFormValues = {
  code: '',
  customerName: '',
  date: new Date().toISOString().slice(0, 10),
  discountTotal: '0',
  taxTotal: '0',
  status: 'Draft',
  items: [{ name: '', qty: '1', unitPrice: '0' }],
}

export function mapSalesOrderFormToRecord(values: SalesOrderFormValues, id: string, base?: LocalSalesOrder): LocalSalesOrder {
  const items: LocalSalesOrderItem[] = values.items.map((item, idx) => {
    const qty = parseDigits(item.qty)
    const unitPrice = parseDigits(item.unitPrice)
    return {
      id: base?.items[idx]?.id ?? crypto.randomUUID(),
      salesOrderId: id,
      productId: base?.items[idx]?.productId ?? '',
      name: item.name.trim(),
      qty,
      unitPrice,
      subtotal: qty * unitPrice,
    }
  })

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const discountTotal = parseDigits(values.discountTotal)
  const taxTotal = parseDigits(values.taxTotal)
  const grandTotal = subtotal - discountTotal + taxTotal
  const paidTotal = base?.paidTotal ?? 0

  let status = values.status as LocalSalesOrder['status']
  if (status !== 'Batal' && status !== 'Draft') {
    if (paidTotal >= grandTotal) status = 'Lunas'
    else if (paidTotal > 0) status = 'Sebagian'
    else status = 'Belum Bayar'
  }

  return {
    id,
    code: values.code.trim(),
    customerName: values.customerName.trim(),
    date: values.date,
    subtotal,
    discountTotal,
    taxTotal,
    grandTotal,
    paidTotal,
    status,
    items,
    syncStatus: 'pending',
    version: (base?.version ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  }
}

export function mapSalesOrderRecordToFormValues(order: LocalSalesOrder): SalesOrderFormValues {
  return {
    code: order.code,
    customerName: order.customerName,
    date: order.date,
    discountTotal: String(order.discountTotal),
    taxTotal: String(order.taxTotal),
    status: order.status,
    items: (order.items?.length ?? 0) > 0
      ? order.items.map((item) => ({ name: item.name, qty: String(item.qty), unitPrice: String(item.unitPrice) }))
      : [{ name: '', qty: '1', unitPrice: '0' }],
  }
}
