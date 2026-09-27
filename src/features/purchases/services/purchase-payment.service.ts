import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'
import { enqueueOutboxItem } from '@/services/sync/outbox-service'
import { syncSupplierPurchaseMetrics } from '@/features/purchases/services/purchase-receiving.service'
import { todayISO } from '@/lib/date'
import { recordPurchasePaymentJournal } from '@/services/accounting/accounting-integration'
import { getJournalEntriesByReference } from '@/services/accounting/journal.service'
import type { LocalCash, LocalCashCategory, LocalPayment, LocalPurchase, OutboxItem } from '@/services/local-db/schema'

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export async function recordCashForPayment(
  payment: LocalPayment,
  _purchaseCode?: string,
  tenantId: string = requireActiveTenantId(),
) {
  // Resolve cash category
  const categories = await localDb.cashCategories.where('tenantId').equals(tenantId).toArray()
  const purchaseCat = categories.find(
    (c) => c.type === 'Pengeluaran' && (c.name.toLowerCase().includes('pembelian') || c.name.toLowerCase().includes('beli') || c.name.toLowerCase().includes('stok')),
  ) ?? categories.find((c) => c.type === 'Pengeluaran')

  let categoryId = purchaseCat?.id
  if (!categoryId) {
    categoryId = createId('cc')
    const newCategory: LocalCashCategory = {
      id: categoryId,
      tenantId,
      name: 'Pembelian Stok',
      type: 'Pengeluaran',
      status: 'Aktif',
      syncStatus: 'pending',
      version: 1,
      updatedAt: new Date().toISOString(),
    }
    await localDb.cashCategories.put(newCategory)
  }

  // Resolve cash account name
  const paymentMethods = await localDb.paymentMethods.where('tenantId').equals(tenantId).toArray()
  const matchingPm = paymentMethods.find(
    (pm) => pm.type === payment.method || pm.name.toLowerCase() === payment.method.toLowerCase(),
  )
  const fallbackAccount = payment.method === 'tunai' ? 'Kas Toko' : payment.method === 'transfer' ? 'Bank Transfer' : payment.method
  const accountName = matchingPm?.name || fallbackAccount

  const cashRecord: LocalCash = {
    id: createId('cash'),
    tenantId,
    ref: payment.ref,
    date: payment.date || todayISO(),
    account: accountName,
    category: categoryId,
    income: 0,
    expense: payment.amount,
    status: 'Tercatat',
  }

  const outboxItem: OutboxItem = {
    id: createId('outbox'),
    tenantId,
    entityType: 'cash',
    entityId: cashRecord.id,
    mutationType: 'create',
    payload: cashRecord,
    status: 'queued',
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await localDb.cash.put(cashRecord)
  await localDb.outbox.put(outboxItem)
  return cashRecord
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
    date: todayISO(),
    status: 'Berhasil',
    syncStatus: 'pending',
    version: 1,
    updatedAt: nowIso,
  }

  const updatedPurchase: LocalPurchase = {
    ...purchase,
    paidTotal: (purchase.paidTotal || 0) + paidAmount,
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

  // Record cash transaction for Laporan Kas
  try {
    await recordCashForPayment(payment, purchase.code, tenantId)
  } catch (err) {
    console.warn('[Purchasing] recordCashForPayment failed (non-critical):', err)
  }

  await syncSupplierPurchaseMetrics(updatedPurchase.supplierId, tenantId)

  // Accounting journal entry (non-blocking)
  try {
    await recordPurchasePaymentJournal(
      tenantId,
      payment.id,
      paidAmount,
      method,
      todayISO(),
    )
  } catch (err) {
    console.warn('[Purchasing] recordPurchasePaymentJournal failed (non-critical):', err)
  }

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

  // Remove linked cash records
  try {
    const linkedCash = await localDb.cash.where('tenantId').equals(tenantId).filter((c) => c.ref === payment.ref).toArray()
    for (const c of linkedCash) {
      await localDb.cash.delete(c.id)
      await enqueueOutboxItem({ entityType: 'cash', entityId: c.id, mutationType: 'delete', payload: c })
    }
  } catch (err) {
    console.warn('[Purchasing] delete linked cash failed (non-critical):', err)
  }

  await enqueueOutboxItem({ entityType: 'payment', entityId: payment.id, mutationType: 'delete', payload: payment })
  await localDb.payments.delete(paymentId)
  if (payment.purchaseId) {
    await syncPurchasePaymentSummary(payment.purchaseId, tenantId)
  }
}

/**
 * Self-healing sync for any purchase payments that were recorded in localDb.payments
 * but are missing from localDb.cash or dexieDb.journalEntries.
 */
export async function syncMissingPurchaseCashRecords(tenantId: string = requireActiveTenantId()) {
  try {
    const payments = await localDb.payments.where('tenantId').equals(tenantId).toArray()
    const purchasePayments = payments.filter((p) => p.purchaseId && p.status === 'Berhasil')
    if (purchasePayments.length === 0) return

    const cashEntries = await localDb.cash.where('tenantId').equals(tenantId).toArray()
    const cashRefMap = new Set(cashEntries.map((c) => c.ref))

    for (const payment of purchasePayments) {
      if (!cashRefMap.has(payment.ref)) {
        await recordCashForPayment(payment, '', tenantId)
        cashRefMap.add(payment.ref)
      }
      // Ensure accounting journal exists for this payment
      try {
        const existingJournals = await getJournalEntriesByReference(tenantId, 'purchase_payment', payment.id)
        if (existingJournals.length === 0 && payment.amount > 0) {
          await recordPurchasePaymentJournal(tenantId, payment.id, payment.amount, payment.method, payment.date || todayISO())
        }
      } catch {
        // ignore
      }
    }
  } catch (err) {
    console.warn('[Purchasing] syncMissingPurchaseCashRecords error:', err)
  }
}
