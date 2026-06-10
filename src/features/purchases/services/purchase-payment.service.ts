import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'
import { enqueueOutboxItem } from '@/services/sync/outbox-service'
import { syncSupplierPurchaseMetrics } from '@/features/purchases/services/purchase-receiving.service'
import type { LocalPayment, LocalPurchase, OutboxItem } from '@/services/local-db/schema'

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function todayLabel() {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())
}

export async function recordPurchasePayment(
  purchaseId: string,
  amount: number,
  method: string,
  source: string = 'Pembelian',
  tenantId: string = requireActiveTenantId(),
) {
  const purchase = await localDb.purchases.get(purchaseId)
  if (!purchase || purchase.tenantId !== tenantId) {
    throw new Error('Purchase order tidak ditemukan pada tenant aktif')
  }

  const paidAmount = Math.max(amount, 0)
  if (paidAmount <= 0) {
    throw new Error('Nominal pembayaran harus lebih dari 0')
  }

  const nowIso = new Date().toISOString()
  const payment: LocalPayment = {
    id: createId('pay'),
    tenantId,
    ref: `PAY-PO-${Date.now().toString().slice(-6)}`,
    purchaseId: purchase.id,
    source,
    method,
    amount: paidAmount,
    date: todayLabel(),
    status: 'Berhasil',
    syncStatus: 'pending',
    version: 1,
    updatedAt: nowIso,
  }

  const updatedPurchase: LocalPurchase = {
    ...purchase,
    paidTotal: purchase.paidTotal + paidAmount,
    version: purchase.version + 1,
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
      entityType: 'purchase',
      entityId: updatedPurchase.id,
      mutationType: 'update',
      payload: updatedPurchase,
      status: 'queued',
      attempts: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ]

  await localDb.transaction('rw', [localDb.purchases, localDb.payments, localDb.outbox], async () => {
    await localDb.purchases.put(updatedPurchase)
    await localDb.payments.put(payment)
    for (const item of outboxItems) {
      await localDb.outbox.put(item)
    }
  })

  await syncSupplierPurchaseMetrics(updatedPurchase.supplierId, tenantId)

  return { purchase: updatedPurchase, payment }
}

export async function syncPurchasePaymentSummary(purchaseId: string, tenantId: string = requireActiveTenantId()) {
  const purchase = await localDb.purchases.get(purchaseId)
  if (!purchase || purchase.tenantId !== tenantId) return null

  const allPayments = await localDb.payments.where('tenantId').equals(tenantId).toArray()
  const linkedPayments = allPayments.filter((payment) => payment.purchaseId === purchaseId && payment.status === 'Berhasil')
  const paidTotal = linkedPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const nextPurchase: LocalPurchase = {
    ...purchase,
    paidTotal,
    version: purchase.version + 1,
    updatedAt: new Date().toISOString(),
  }

  const outboxItem: OutboxItem = {
    id: createId('outbox'),
    tenantId,
    entityType: 'purchase',
    entityId: nextPurchase.id,
    mutationType: 'update',
    payload: nextPurchase,
    status: 'queued',
    attempts: 0,
    createdAt: nextPurchase.updatedAt,
    updatedAt: nextPurchase.updatedAt,
  }

  await localDb.transaction('rw', [localDb.purchases, localDb.outbox], async () => {
    await localDb.purchases.put(nextPurchase)
    await localDb.outbox.put(outboxItem)
  })

  await syncSupplierPurchaseMetrics(nextPurchase.supplierId, tenantId)
  return nextPurchase
}

export async function deletePurchasePayment(paymentId: string, tenantId: string = requireActiveTenantId()) {
  const payment = await localDb.payments.get(paymentId)
  if (!payment || payment.tenantId !== tenantId) return

  await enqueueOutboxItem({ entityType: 'payment', entityId: payment.id, mutationType: 'delete', payload: payment })
  await localDb.payments.delete(paymentId)
  if (payment.purchaseId) {
    await syncPurchasePaymentSummary(payment.purchaseId, tenantId)
  }
}
