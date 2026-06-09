import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'
import { enqueueOutboxItem } from '@/services/sync/outbox-service'
import type { LocalPayment, LocalServiceOrder, OutboxItem } from '@/services/local-db/schema'

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function todayLabel() {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())
}

export async function recordServiceOrderPayment(
  orderId: string,
  amount: number,
  method: string,
  source: string = 'Service Order',
  tenantId: string = requireActiveTenantId(),
) {
  const order = await localDb.serviceOrders.get(orderId)
  if (!order || order.tenantId !== tenantId) {
    throw new Error('Service order tidak ditemukan pada tenant aktif')
  }

  const paidAmount = Math.max(amount, 0)
  if (paidAmount <= 0) {
    throw new Error('Nominal pembayaran harus lebih dari 0')
  }

  const nowIso = new Date().toISOString()
  const payment: LocalPayment = {
    id: createId('pay'),
    tenantId,
    ref: `PAY-SRV-${Date.now().toString().slice(-6)}`,
    serviceOrderId: order.id,
    source,
    method,
    amount: paidAmount,
    date: todayLabel(),
    status: 'Berhasil',
    syncStatus: 'pending',
    version: 1,
    updatedAt: nowIso,
  }

  const updatedOrder: LocalServiceOrder = {
    ...order,
    paidTotal: order.paidTotal + paidAmount,
    version: order.version + 1,
    updatedAt: nowIso,
  }

  const outboxItems: OutboxItem[] = [
    {
      id: createId('outbox'),
      entityType: 'payment',
      entityId: payment.id,
      mutationType: 'create',
      payload: payment,
      status: 'queued',
      attempts: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: createId('outbox'),
      entityType: 'service_order',
      entityId: updatedOrder.id,
      mutationType: 'update',
      payload: updatedOrder,
      status: 'queued',
      attempts: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ]

  await localDb.transaction('rw', [localDb.serviceOrders, localDb.payments, localDb.outbox], async () => {
    await localDb.serviceOrders.put(updatedOrder)
    await localDb.payments.put(payment)
    for (const item of outboxItems) {
      await localDb.outbox.put(item)
    }
  })

  return { order: updatedOrder, payment }
}

export async function syncServiceOrderPaymentSummary(orderId: string, tenantId: string = requireActiveTenantId()) {
  const order = await localDb.serviceOrders.get(orderId)
  if (!order || order.tenantId !== tenantId) return null

  const allPayments = await localDb.payments.where('tenantId').equals(tenantId).toArray()
  const linkedPayments = allPayments.filter((payment) => payment.serviceOrderId === orderId && payment.status === 'Berhasil')
  const paidTotal = linkedPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const nextOrder: LocalServiceOrder = {
    ...order,
    paidTotal,
    version: order.version + 1,
    updatedAt: new Date().toISOString(),
  }

  const outboxItem: OutboxItem = {
    id: createId('outbox'),
    entityType: 'service_order',
    entityId: nextOrder.id,
    mutationType: 'update',
    payload: nextOrder,
    status: 'queued',
    attempts: 0,
    createdAt: nextOrder.updatedAt,
    updatedAt: nextOrder.updatedAt,
  }

  await localDb.transaction('rw', [localDb.serviceOrders, localDb.outbox], async () => {
    await localDb.serviceOrders.put(nextOrder)
    await localDb.outbox.put(outboxItem)
  })

  return nextOrder
}

export async function deleteServiceOrderPayment(paymentId: string, tenantId: string = requireActiveTenantId()) {
  const payment = await localDb.payments.get(paymentId)
  if (!payment || payment.tenantId !== tenantId) return

  await enqueueOutboxItem({ entityType: 'payment', entityId: payment.id, mutationType: 'delete', payload: payment })
  await localDb.payments.delete(paymentId)
  if (payment.serviceOrderId) {
    await syncServiceOrderPaymentSummary(payment.serviceOrderId, tenantId)
  }
}
