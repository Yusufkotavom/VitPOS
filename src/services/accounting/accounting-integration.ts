// ─────────────────────────────────────────────────────
// Accounting Transaction Integration
//
// One journal helper per business transaction type.
// Each function is called AFTER the main transaction
// succeeds and is wrapped in try/catch so a journal
// failure never blocks the user's workflow.
// ─────────────────────────────────────────────────────

import { dexieDb } from '@/services/local-db/dexie-instance'
import { createJournalEntry } from '@/services/accounting/journal.service'
import {
  ensurePaymentMethodAccount,
  ensureCashCategoryAccount,
} from '@/services/accounting/chart-of-accounts'
import type { LocalProduct } from '@/services/local-db/schema'

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/**
 * Resolve the asset account code for a payment-method type.
 * Looks up an active payment method from Dexie so we can
 * auto-create (or reuse) the correct Kas / Piutang / QRIS … account.
 */
async function resolvePaymentMethodAccountCode(
  tenantId: string,
  methodType: string,
): Promise<string> {
  const all = await dexieDb.paymentMethods
    .where('tenantId')
    .equals(tenantId)
    .filter((pm) => pm.type === methodType && pm.status === 'Aktif')
    .toArray()

  const pm = all[0]
  if (pm) {
    const account = await ensurePaymentMethodAccount(tenantId, {
      name: pm.name,
      provider: pm.provider,
      type: pm.type,
    })
    return account.code
  }

  // Fallback – the system accounts are always created
  const fallback: Record<string, string> = {
    tunai: '1-1100',
    piutang: '1-3000',
  }
  return fallback[methodType] ?? '1-1100'
}

/**
 * Resolve the revenue / expense account code for a cash category.
 */
async function resolveCashCategoryAccountCode(
  tenantId: string,
  categoryId: string,
): Promise<string> {
  const category = await dexieDb.cashCategories.get(categoryId)
  if (!category) throw new Error(`Cash category ${categoryId} not found`)
  const account = await ensureCashCategoryAccount(tenantId, {
    name: category.name,
    type: category.type as 'Pemasukan' | 'Pengeluaran',
  })
  return account.code
}

// ──────────────────────────────────────────────
// Journal entry helpers (one per transaction type)
// ──────────────────────────────────────────────

/**
 * 1. POS Sale
 *
 *  Dr. Kas / QRIS / Piutang …     Rp grandTotal
 *  Dr. HPP                         Rp totalCost
 *      Cr. Pendapatan Penjualan       Rp grandTotal
 *      Cr. Persediaan                 Rp totalCost
 */
export async function recordPosSaleJournal(
  tenantId: string,
  salesOrderId: string,
  grandTotal: number,
  totalHpp: number,
  paymentMethodType: string,
  date: string,
): Promise<void> {
  try {
    const debitAccount = await resolvePaymentMethodAccountCode(
      tenantId,
      paymentMethodType,
    )

    await createJournalEntry(tenantId, {
      referenceType: 'pos_sale',
      referenceId: salesOrderId,
      description: `Penjualan POS #${salesOrderId.slice(-8)}`,
      date: date.slice(0, 10),
      lines: [
        { accountCode: debitAccount, debit: grandTotal, credit: 0 },
        { accountCode: '5-1000', debit: totalHpp, credit: 0 },
        { accountCode: '4-1000', debit: 0, credit: grandTotal },
        { accountCode: '1-2000', debit: 0, credit: totalHpp },
      ],
    })
  } catch (err) {
    console.warn(
      '[Accounting] recordPosSaleJournal non-critical:',
      err,
    )
  }
}

/**
 * 2. Service Order
 *
 *  Dr. Kas / QRIS / Piutang …     Rp total
 *      Cr. Pendapatan Jasa           Rp total
 */
export async function recordServiceOrderJournal(
  tenantId: string,
  serviceOrderId: string,
  total: number,
  paymentMethodType: string,
  date: string,
): Promise<void> {
  try {
    const debitAccount = await resolvePaymentMethodAccountCode(
      tenantId,
      paymentMethodType,
    )

    await createJournalEntry(tenantId, {
      referenceType: 'service_order',
      referenceId: serviceOrderId,
      description: `Service order #${serviceOrderId.slice(-8)}`,
      date: date.slice(0, 10),
      lines: [
        { accountCode: debitAccount, debit: total, credit: 0 },
        { accountCode: '4-2000', debit: 0, credit: total },
      ],
    })
  } catch (err) {
    console.warn(
      '[Accounting] recordServiceOrderJournal non-critical:',
      err,
    )
  }
}

/**
 * 3. Stock Adjustment (manual via adjustment page OR product-edit)
 *
 *  qty > 0  →  Dr. Persediaan  /  Cr. Penyesuaian Persediaan
 *  qty < 0  →  Dr. Penyesuaian Persediaan  /  Cr. Persediaan
 *
 *  Amount = |qty| × product.costPrice (falls back to price, then 0)
 */
export async function recordStockAdjustmentJournal(
  tenantId: string,
  product: LocalProduct,
  qty: number,
  referenceId: string,
  date?: string,
): Promise<void> {
  try {
    const unitCost = product.costPrice ?? product.price ?? 0
    const amount = Math.abs(qty) * unitCost
    if (amount <= 0) return

    const drAccount = qty > 0 ? '1-2000' : '6-2000'
    const crAccount = qty > 0 ? '6-2000' : '1-2000'
    const label = qty > 0 ? `+${qty}` : `${qty}`

    await createJournalEntry(tenantId, {
      referenceType: 'stock_adjustment',
      referenceId,
      description: `Penyesuaian stok ${product.name} (${label})`,
      date: (date ?? new Date().toISOString()).slice(0, 10),
      lines: [
        { accountCode: drAccount, debit: amount, credit: 0 },
        { accountCode: crAccount, debit: 0, credit: amount },
      ],
    })
  } catch (err) {
    console.warn(
      '[Accounting] recordStockAdjustmentJournal non-critical:',
      err,
    )
  }
}

/**
 * 4. Production Batch
 *
 *  Dr. Persediaan (produk jadi)    Rp totalCost
 *      Cr. Persediaan (bahan)       Rp totalCost
 *
 * Both sides use 1-2000 (single inventory account),
 * so the entry nets to zero — but it provides an
 * audit trail of the production event.
 */
export async function recordProductionJournal(
  tenantId: string,
  batchId: string,
  totalCost: number,
  date: string,
): Promise<void> {
  try {
    if (totalCost <= 0) return

    await createJournalEntry(tenantId, {
      referenceType: 'production_batch',
      referenceId: batchId,
      description: `Produksi batch #${batchId.slice(-8)}`,
      date: date.slice(0, 10),
      lines: [
        { accountCode: '1-2000', debit: totalCost, credit: 0 },
        { accountCode: '1-2000', debit: 0, credit: totalCost },
      ],
    })
  } catch (err) {
    console.warn(
      '[Accounting] recordProductionJournal non-critical:',
      err,
    )
  }
}

/**
 * 5. Purchase Receiving
 *
 *  Dr. Persediaan          Rp grandTotal
 *      Cr. Hutang Usaha      Rp grandTotal
 *
 * (Assumes credit purchase — the vast majority of PO receiving.)
 */
export async function recordPurchaseJournal(
  tenantId: string,
  purchaseId: string,
  grandTotal: number,
  date: string,
): Promise<void> {
  try {
    await createJournalEntry(tenantId, {
      referenceType: 'purchase',
      referenceId: purchaseId,
      description: `Penerimaan PO #${purchaseId.slice(-8)}`,
      date: date.slice(0, 10),
      lines: [
        { accountCode: '1-2000', debit: grandTotal, credit: 0 },
        { accountCode: '2-1000', debit: 0, credit: grandTotal },
      ],
    })
  } catch (err) {
    console.warn(
      '[Accounting] recordPurchaseJournal non-critical:',
      err,
    )
  }
}

/**
 * 6. Purchase Payment
 *
 *  Dr. Hutang Usaha            Rp amount
 *      Cr. Kas / QRIS / …        Rp amount
 */
export async function recordPurchasePaymentJournal(
  tenantId: string,
  paymentId: string,
  amount: number,
  methodType: string,
  date: string,
): Promise<void> {
  try {
    const creditAccount = await resolvePaymentMethodAccountCode(
      tenantId,
      methodType,
    )

    await createJournalEntry(tenantId, {
      referenceType: 'purchase_payment',
      referenceId: paymentId,
      description: `Bayar PO #${paymentId.slice(-8)}`,
      date: date.slice(0, 10),
      lines: [
        { accountCode: '2-1000', debit: amount, credit: 0 },
        { accountCode: creditAccount, debit: 0, credit: amount },
      ],
    })
  } catch (err) {
    console.warn(
      '[Accounting] recordPurchasePaymentJournal non-critical:',
      err,
    )
  }
}

/**
 * 7. Cash In / Out
 *
 *  Pemasukan:
 *    Dr. Kas Tunai                     Rp amount
 *        Cr. Pendapatan Lain [kategori]  Rp amount
 *
 *  Pengeluaran:
 *    Dr. Biaya [kategori]              Rp amount
 *        Cr. Kas Tunai                   Rp amount
 */
export async function recordCashJournal(
  tenantId: string,
  cashId: string,
  amount: number,
  categoryId: string,
  type: 'Pemasukan' | 'Pengeluaran',
  date: string,
): Promise<void> {
  try {
    if (amount <= 0) return

    const catAccount = await resolveCashCategoryAccountCode(
      tenantId,
      categoryId,
    )
    const isIncome = type === 'Pemasukan'

    await createJournalEntry(tenantId, {
      referenceType: 'cash',
      referenceId: cashId,
      description: isIncome
        ? `Pemasukan kas #${cashId.slice(-8)}`
        : `Pengeluaran kas #${cashId.slice(-8)}`,
      date: date.slice(0, 10),
      lines: isIncome
        ? [
            { accountCode: '1-1100', debit: amount, credit: 0 },
            { accountCode: catAccount, debit: 0, credit: amount },
          ]
        : [
            { accountCode: catAccount, debit: amount, credit: 0 },
            { accountCode: '1-1100', debit: 0, credit: amount },
          ],
    })
  } catch (err) {
    console.warn(
      '[Accounting] recordCashJournal non-critical:',
      err,
    )
  }
}

/**
 * 8. Payment Receivable
 *
 *  Dr. Kas / QRIS / …          Rp amount
 *      Cr. Piutang Usaha         Rp amount
 */
export async function recordPaymentReceivableJournal(
  tenantId: string,
  paymentId: string,
  amount: number,
  methodType: string,
  date: string,
): Promise<void> {
  try {
    const debitAccount = await resolvePaymentMethodAccountCode(
      tenantId,
      methodType,
    )

    await createJournalEntry(tenantId, {
      referenceType: 'payment_receivable',
      referenceId: paymentId,
      description: `Terima bayar #${paymentId.slice(-8)}`,
      date: date.slice(0, 10),
      lines: [
        { accountCode: debitAccount, debit: amount, credit: 0 },
        { accountCode: '1-3000', debit: 0, credit: amount },
      ],
    })
  } catch (err) {
    console.warn(
      '[Accounting] recordPaymentReceivableJournal non-critical:',
      err,
    )
  }
}

/**
 * 9. Return (Penjualan)
 *
 *  Dr. Pendapatan Penjualan   Rp total
 *  Dr. Persediaan             Rp totalCost
 *      Cr. Kas / QRIS / …       Rp total
 *      Cr. HPP                   Rp totalCost
 */
export async function recordReturnJournal(
  tenantId: string,
  returnId: string,
  total: number,
  totalCost: number,
  paymentMethodType: string,
  date: string,
): Promise<void> {
  try {
    const creditAccount = await resolvePaymentMethodAccountCode(
      tenantId,
      paymentMethodType,
    )

    await createJournalEntry(tenantId, {
      referenceType: 'return',
      referenceId: returnId,
      description: `Retur #${returnId.slice(-8)}`,
      date: date.slice(0, 10),
      lines: [
        { accountCode: '4-1000', debit: total, credit: 0 },
        { accountCode: '1-2000', debit: totalCost, credit: 0 },
        { accountCode: creditAccount, debit: 0, credit: total },
        { accountCode: '5-1000', debit: 0, credit: totalCost },
      ],
    })
  } catch (err) {
    console.warn(
      '[Accounting] recordReturnJournal non-critical:',
      err,
    )
  }
}
