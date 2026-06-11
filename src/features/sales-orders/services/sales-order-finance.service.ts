import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'
import { customerRepository } from '@/services/local-db/repository'
import { enqueueOutboxItem } from '@/services/sync/outbox-service'
import { todayISO } from '@/lib/date'
import type { LocalPayment, LocalSalesOrder, OutboxItem, PosPaymentMethodCode } from '@/services/local-db/schema'

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function nextSalesOrderStatus(order: LocalSalesOrder, paidTotal: number): LocalSalesOrder['status'] {
  if (order.status === 'Batal') return 'Batal'
  if (paidTotal >= order.grandTotal && order.grandTotal > 0) return 'Lunas'
  if (paidTotal > 0) return 'Sebagian'
  return 'Belum Bayar'
}

export async function syncCustomerSalesMetrics(customerId?: string, tenantId: string = requireActiveTenantId()) {
  if (!customerId) return

  const customer = await localDb.customers.get(customerId)
  if (!customer || customer.tenantId !== tenantId) return

  const allOrders = await localDb.salesOrders.where('tenantId').equals(tenantId).toArray()
  const customerOrders = allOrders.filter((order) => order.customerId === customerId && order.status !== 'Batal')
  const salesReceivable = customerOrders.reduce((sum, order) => sum + Math.max(0, order.grandTotal - order.paidTotal), 0)

  const allService = await localDb.serviceOrders.where('tenantId').equals(tenantId).toArray()
  const customerService = allService.filter((order) => order.customerId === customerId && order.status !== 'Batal')
  const serviceReceivable = customerService.reduce((sum, order) => sum + Math.max(0, order.cost - order.paidTotal), 0)

  const receivable = salesReceivable + serviceReceivable
  const totalOrders = customerOrders.length + customerService.length

  await customerRepository.upsert({
    ...customer,
    orders: totalOrders,
    receivable,
    status: receivable > 0 ? 'Piutang' : customer.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
    updatedAt: new Date().toISOString(),
    version: customer.version + 1,
    syncStatus: 'pending',
  })
}

export async function deleteSalesOrder(orderId: string, tenantId: string = requireActiveTenantId()) {
  const order = await localDb.salesOrders.get(orderId)
  if (!order || order.tenantId !== tenantId) return

  const linkedPayments = await localDb.payments.where('tenantId').equals(tenantId).toArray()
  const paymentsToDelete = linkedPayments.filter((payment) => payment.salesOrderId === orderId)

  await enqueueOutboxItem({ entityType: 'sale', entityId: order.id, mutationType: 'delete', payload: order })
  await localDb.salesOrders.delete(orderId)
  for (const payment of paymentsToDelete) {
    await enqueueOutboxItem({ entityType: 'payment', entityId: payment.id, mutationType: 'delete', payload: payment })
    await localDb.payments.delete(payment.id)
  }

  await syncCustomerSalesMetrics(order.customerId, tenantId)
}

export async function recordSalesOrderPayment(
  orderId: string,
  amount: number,
  method: PosPaymentMethodCode,
  source: string = 'Invoice',
  tenantId: string = requireActiveTenantId(),
) {
  const order = await localDb.salesOrders.get(orderId)
  if (!order || order.tenantId !== tenantId) {
    throw new Error('Invoice tidak ditemukan pada tenant aktif')
  }

  const paidAmount = Math.max(amount, 0)
  if (paidAmount <= 0) {
    throw new Error('Nominal pembayaran harus lebih dari 0')
  }

  const nowIso = new Date().toISOString()
  const payment: LocalPayment = {
    id: createId('pay'),
    tenantId,
    ref: `PAY-${Date.now().toString().slice(-6)}`,
    salesOrderId: order.id,
    source,
    method,
    amount: paidAmount,
    date: todayISO(),
    status: 'Berhasil',
    syncStatus: 'pending',
    version: 1,
    updatedAt: nowIso,
  }

  const updatedOrder: LocalSalesOrder = {
    ...order,
    paidTotal: order.paidTotal + paidAmount,
    status: nextSalesOrderStatus(order, order.paidTotal + paidAmount),
    version: order.version + 1,
    updatedAt: nowIso,
  }

  const outboxItems: OutboxItem[] = [
    {
      id: createId('outbox'),
      tenantId,
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
      tenantId,
      entityType: 'sale',
      entityId: updatedOrder.id,
      mutationType: 'update',
      payload: updatedOrder,
      status: 'queued',
      attempts: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ]

  await localDb.transaction('rw', [localDb.salesOrders, localDb.payments, localDb.outbox], async () => {
    await localDb.salesOrders.put(updatedOrder)
    await localDb.payments.put(payment)
    for (const item of outboxItems) {
      await localDb.outbox.put(item)
    }
  })

  await syncCustomerSalesMetrics(updatedOrder.customerId, tenantId)

  return { order: updatedOrder, payment }
}

export async function syncSalesOrderPaymentSummary(orderId: string, tenantId: string = requireActiveTenantId()) {
  const order = await localDb.salesOrders.get(orderId)
  if (!order || order.tenantId !== tenantId) return null

  const allPayments = await localDb.payments.where('tenantId').equals(tenantId).toArray()
  const linkedPayments = allPayments.filter((payment) => payment.salesOrderId === orderId && payment.status === 'Berhasil')
  const paidTotal = linkedPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const nextOrder: LocalSalesOrder = {
    ...order,
    paidTotal,
    status: nextSalesOrderStatus(order, paidTotal),
    version: order.version + 1,
    updatedAt: new Date().toISOString(),
  }

  const outboxItem: OutboxItem = {
    id: createId('outbox'),
    tenantId,
    entityType: 'sale',
    entityId: nextOrder.id,
    mutationType: 'update',
    payload: nextOrder,
    status: 'queued',
    attempts: 0,
    createdAt: nextOrder.updatedAt,
    updatedAt: nextOrder.updatedAt,
  }

  await localDb.transaction('rw', [localDb.salesOrders, localDb.outbox], async () => {
    await localDb.salesOrders.put(nextOrder)
    await localDb.outbox.put(outboxItem)
  })

  await syncCustomerSalesMetrics(nextOrder.customerId, tenantId)
  return nextOrder
}

export async function deleteSalesOrderPayment(paymentId: string, tenantId: string = requireActiveTenantId()) {
  const payment = await localDb.payments.get(paymentId)
  if (!payment || payment.tenantId !== tenantId) return

  await enqueueOutboxItem({ entityType: 'payment', entityId: payment.id, mutationType: 'delete', payload: payment })
  await localDb.payments.delete(paymentId)
  if (payment.salesOrderId) {
    await syncSalesOrderPaymentSummary(payment.salesOrderId, tenantId)
  }
}
