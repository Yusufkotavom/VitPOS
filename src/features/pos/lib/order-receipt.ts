import { formatCurrency } from '@/lib/format-currency'
import { formatDateTime } from '@/lib/date'
import { localDb } from '@/services/local-db/client'
import { messageTemplateService } from '@/services/message-template.service'
import { DEFAULT_CUSTOMER_NAME } from '@/features/pos/lib/default-customer'
import type { PdfData } from '@/shared/components/pdf/types'
import type { PosOrderSummary } from '@/features/pos/types/pos-order.types'

export async function buildInvoicePdfData(order: PosOrderSummary, notes: string): Promise<PdfData> {
  const customer = order.customerId ? await localDb.customers.get(order.customerId) : undefined

  return {
    type: 'invoice',
    code: order.code,
    date: formatDateTime(order.date),
    customer: {
      name: order.customerName ?? DEFAULT_CUSTOMER_NAME,
      phone: customer?.phone,
      address: customer?.address,
    },
    items: order.items.map((item) => ({
      name: item.name,
      qty: item.qty,
      price: item.price,
      subtotal: item.subtotal,
    })),
    summary: {
      subtotal: order.subtotal,
      discount: order.discount,
      grandTotal: order.total,
      paidTotal: order.amountPaid,
      change: order.change,
      status: order.amountPaid >= order.total ? 'Lunas' : 'Sebagian',
    },
    notes: notes.trim(),
  }
}

export async function buildOrderWhatsAppLink(order: PosOrderSummary): Promise<string | null> {
  if (!order.customerId) return null

  const customer = await localDb.customers.get(order.customerId)
  const phone = customer?.phone ?? ''
  if (!phone) return null

  const text = await messageTemplateService.render('invoice', {
    code: order.code,
    date: order.date.toLocaleDateString('id-ID'),
    customer_name: order.customerName ?? DEFAULT_CUSTOMER_NAME,
    items: order.items
      .map((item) => `${item.name} x${item.qty} = ${formatCurrency(item.subtotal)}`)
      .join('\n'),
    total: formatCurrency(order.total),
    paid: formatCurrency(order.amountPaid),
    change: formatCurrency(order.change),
    payment_method: order.paymentMethod,
    store_name: '',
  })

  const { buildWhatsAppLink } = await import('@/lib/whatsapp')
  return buildWhatsAppLink(phone, text)
}
