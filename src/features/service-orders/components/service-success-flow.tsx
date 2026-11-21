import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { PosSuccessDialog } from '@/features/pos/components/pos-success-dialog'
import { ReceiptPrintLayout } from '@/features/pos/components/receipt-print-layout'
import { ServiceOrderLabelDialog } from '@/features/service-orders/components/service-order-label-dialog'
import { printPage } from '@/lib/print'
import { formatDateTime } from '@/lib/date'
import { formatCurrency } from '@/lib/format-currency'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { localDb } from '@/services/local-db/client'
import { messageTemplateService } from '@/services/message-template.service'
import { usePdf } from '@/shared/components/pdf/use-pdf'
import type { PosOrderSummary } from '@/features/pos/types/pos-order.types'
import type { LocalServiceOrder } from '@/services/local-db/schema'

export type ServiceSuccessMeta = {
  device: string
  complaint: string
  estimatedCompletion?: string
}

export function ServiceSuccessFlow({
  order,
  meta,
  onClose,
}: {
  order: PosOrderSummary | null
  meta: ServiceSuccessMeta | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { downloadPdf } = usePdf()
  const [labelDialogOpen, setLabelDialogOpen] = useState(false)
  const [serviceOrderRecord, setServiceOrderRecord] = useState<LocalServiceOrder | null>(null)

  async function handleOpenLabel() {
    if (!order) return
    const dbOrder = await localDb.serviceOrders.get(order.id)
    if (dbOrder) {
      setServiceOrderRecord(dbOrder)
    } else {
      setServiceOrderRecord({
        id: order.id,
        tenantId: '',
        code: order.code,
        customerName: order.customerName || 'Umum',
        customerId: order.customerId ?? undefined,
        date: order.date.toISOString(),
        status: 'Diterima',
        deviceBrand: meta?.device,
        complaint: meta?.complaint,
        description: meta?.complaint || meta?.device || '',
        cost: order.total,
        paidTotal: order.amountPaid,
        version: 1,
        syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
      })
    }
    setLabelDialogOpen(true)
  }

  async function handleWhatsApp() {
    if (!order) return

    let phone = ''
    if (order.customerId) {
      const customer = await localDb.customers.get(order.customerId)
      phone = customer?.phone ?? ''
    }
    if (!phone) {
      toast.error(t('service_orders.whatsapp_not_found'))
      return
    }

    const text = await messageTemplateService.render('service_order_masuk', {
      code: order.code,
      date: order.date.toLocaleDateString('id-ID'),
      customer_name: order.customerName ?? 'Umum',
      device: meta?.device || '-',
      problem: meta?.complaint ?? '',
      status: 'Diterima',
      cost: formatCurrency(order.total),
      estimated_completion: meta?.estimatedCompletion
        ? new Date(meta.estimatedCompletion).toLocaleDateString('id-ID', { dateStyle: 'long' })
        : '-',
      items: order.items.map((item) => `${item.name} x${item.qty} = ${formatCurrency(item.subtotal)}`).join('\n'),
      total: formatCurrency(order.total),
      paid: formatCurrency(order.amountPaid),
      remaining: formatCurrency(Math.max(order.total - order.amountPaid, 0)),
      change: formatCurrency(order.change),
      payment_method: order.paymentMethod,
      store_name: '',
    })

    window.open(buildWhatsAppLink(phone, text), '_blank')
  }

  async function handleDownloadPdf() {
    if (!order) return
    await downloadPdf({
      type: 'service',
      code: order.code,
      date: formatDateTime(order.date),
      customer: { name: order.customerName ?? 'Umum' },
      device: meta?.device || '-',
      problem: meta?.complaint ?? '',
      cost: order.total,
      summary: {
        subtotal: order.subtotal,
        discount: order.discount,
        grandTotal: order.total,
        paidTotal: order.amountPaid,
        status: order.amountPaid >= order.total ? 'Lunas' : 'Sebagian',
      },
      items: order.items.map((item) => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
        subtotal: item.subtotal,
      })),
    }, `service-${order.code}`)
  }

  return (
    <>
      <PosSuccessDialog
        open={order !== null}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
        order={order}
        detailRoute="/service-orders"
        onPrint={() => printPage()}
        onPrintSalesOrder={handleDownloadPdf}
        onPrintLabel={handleOpenLabel}
        onWhatsApp={handleWhatsApp}
        onNewSale={onClose}
      />
      {order && <ReceiptPrintLayout order={order} />}
      {serviceOrderRecord && (
        <ServiceOrderLabelDialog
          open={labelDialogOpen}
          onOpenChange={setLabelDialogOpen}
          order={serviceOrderRecord}
        />
      )}
    </>
  )
}
