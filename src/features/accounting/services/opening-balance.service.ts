import { dexieDb } from '@/services/local-db/dexie-instance'
import { createJournalEntry } from '@/services/accounting/journal.service'
import {
  ensureSystemAccounts,
  ensurePaymentMethodAccount,
  getAccountByCode,
} from '@/services/accounting/chart-of-accounts'
import type { LocalCash } from '@/services/local-db/schema'

export interface OpeningBalanceInput {
  date: string
  cashOnHand: number
  bankAccounts: Array<{ name: string; balance: number; provider: string }>
  accountsReceivable: number
  inventoryValue: number
  fixedAssets: number
  accountsPayable: number
  otherLiabilities: number
  notes?: string
}

export interface OpeningBalanceSummary {
  date: string
  totalAssets: number
  totalLiabilities: number
  ownerEquity: number
  isBalanced: boolean
  lastUpdated?: string
}

export interface CurrentSystemBalances {
  cashOnHand: number
  bankAccounts: Array<{ name: string; balance: number; provider: string }>
  totalBank: number
  accountsReceivable: number
  inventoryValue: number
  productCount: number
  fixedAssets: number
  accountsPayable: number
  otherLiabilities: number
  hasExistingOpeningBalance: boolean
  lastSavedDate?: string
}

const SETTING_KEY = 'accounting-opening-balance'

export async function getCurrentSystemBalances(tenantId: string): Promise<CurrentSystemBalances> {
  const existingSetting = await getOpeningBalance(tenantId)
  const hasExistingOpeningBalance = !!existingSetting

  // 1. Read cash rows
  const cashRows = await dexieDb.cash.where('tenantId').equals(tenantId).toArray()
  const accountTotals = new Map<string, number>()
  for (const c of cashRows) {
    const acc = (c.account || 'Kas Toko').trim()
    const net = (Number(c.income) || 0) - (Number(c.expense) || 0)
    accountTotals.set(acc, (accountTotals.get(acc) || 0) + net)
  }

  // Active payment methods
  const paymentMethods = await dexieDb.paymentMethods
    .where('tenantId')
    .equals(tenantId)
    .filter((pm) => pm.status === 'Aktif')
    .toArray()

  let cashOnHand = 0
  const bankAccountsMap = new Map<string, { balance: number; provider: string }>()

  for (const [accName, total] of accountTotals.entries()) {
    const lower = accName.toLowerCase()
    const isCash = lower.includes('kas') || lower.includes('tunai') || lower === 'cash'
    if (isCash) {
      cashOnHand += total
    } else {
      bankAccountsMap.set(accName, {
        balance: total,
        provider: accName.replace(/^bank\s+/i, '').trim() || 'Bank',
      })
    }
  }

  // Ensure any active bank/transfer/qris payment methods exist
  for (const pm of paymentMethods) {
    const lower = pm.name.toLowerCase()
    const isCash = lower.includes('kas') || lower.includes('tunai') || pm.type === 'cash'
    if (!isCash && !bankAccountsMap.has(pm.name)) {
      bankAccountsMap.set(pm.name, {
        balance: accountTotals.get(pm.name) || 0,
        provider: pm.provider || pm.name,
      })
    }
  }

  // Also include banks from existing setting if any
  if (existingSetting?.bankAccounts) {
    for (const b of existingSetting.bankAccounts) {
      if (!bankAccountsMap.has(b.name)) {
        bankAccountsMap.set(b.name, {
          balance: Number(b.balance) || 0,
          provider: b.provider || b.name,
        })
      }
    }
  }

  const bankAccounts: Array<{ name: string; balance: number; provider: string }> = []
  for (const [name, info] of bankAccountsMap.entries()) {
    bankAccounts.push({
      name,
      balance: Math.max(0, info.balance),
      provider: info.provider,
    })
  }

  if (bankAccounts.length === 0) {
    bankAccounts.push({ name: 'Bank BCA', balance: 0, provider: 'BCA' })
  }

  const totalBank = bankAccounts.reduce((sum, b) => sum + (Number(b.balance) || 0), 0)

  // 2. Inventory Valuation
  const products = await dexieDb.products.where('tenantId').equals(tenantId).toArray()
  let inventoryValue = 0
  let productCount = 0
  for (const p of products) {
    if (p.type !== 'Jasa' && p.status !== 'Arsip') {
      const stock = Math.max(0, Number(p.stock) || 0)
      const cost = Number(p.costPrice) || Number(p.price) || 0
      if (stock > 0) {
        inventoryValue += stock * cost
        productCount++
      }
    }
  }

  // 3. Accounts Receivable
  const customers = await dexieDb.customers.where('tenantId').equals(tenantId).toArray()
  const customerReceivable = customers.reduce((sum, c) => sum + Math.max(0, Number(c.receivable) || 0), 0)

  const orders = await dexieDb.salesOrders.where('tenantId').equals(tenantId).toArray()
  let orderReceivable = 0
  for (const o of orders) {
    if (o.status !== 'Draft' && o.status !== 'Batal' && o.status !== 'Lunas') {
      const unpaid = (Number(o.grandTotal) || 0) - (Number(o.paidTotal) || 0)
      if (unpaid > 0) orderReceivable += unpaid
    }
  }
  const accountsReceivable = Math.max(customerReceivable, orderReceivable)

  // 4. Accounts Payable
  const suppliers = await dexieDb.suppliers.where('tenantId').equals(tenantId).toArray()
  const supplierPayable = suppliers.reduce((sum, s) => sum + Math.max(0, Number(s.payable) || 0), 0)

  const purchases = await dexieDb.purchases.where('tenantId').equals(tenantId).toArray()
  let purchasePayable = 0
  for (const p of purchases) {
    if (p.status !== 'Draft' && p.status !== 'Batal') {
      const unpaid = (Number(p.grandTotal) || 0) - (Number(p.paidTotal) || 0)
      if (unpaid > 0) purchasePayable += unpaid
    }
  }
  const accountsPayable = Math.max(supplierPayable, purchasePayable)

  // 5. Fixed Assets & Other Liabilities
  const fixedAssets = existingSetting ? Number(existingSetting.fixedAssets) || 0 : 0
  const otherLiabilities = existingSetting ? Number(existingSetting.otherLiabilities) || 0 : 0

  return {
    cashOnHand: Math.max(0, cashOnHand),
    bankAccounts,
    totalBank,
    accountsReceivable,
    inventoryValue,
    productCount,
    fixedAssets,
    accountsPayable,
    otherLiabilities,
    hasExistingOpeningBalance,
    lastSavedDate: existingSetting?.date,
  }
}

export async function getOpeningBalance(tenantId: string): Promise<OpeningBalanceInput | null> {
  const setting = await dexieDb.settings
    .where('[tenantId+setting]')
    .equals([tenantId, SETTING_KEY])
    .first()

  if (!setting) return null
  try {
    return JSON.parse(setting.value) as OpeningBalanceInput
  } catch {
    return null
  }
}

export async function saveOpeningBalance(
  tenantId: string,
  input: OpeningBalanceInput,
): Promise<{ success: boolean; ownerEquity: number }> {
  // 1. Ensure system accounts exist
  await ensureSystemAccounts(tenantId)

  // 2. Ensure fixed asset account (1-4000) exists if needed
  if (input.fixedAssets > 0) {
    const fixedAssetAcc = await getAccountByCode(tenantId, '1-4000')
    if (!fixedAssetAcc) {
      await dexieDb.accounts.put({
        id: `acc-1-4000-${tenantId}`,
        tenantId,
        code: '1-4000',
        name: 'Peralatan & Aset Tetap',
        type: 'asset',
        isSystem: true,
        isActive: true,
        syncStatus: 'pending',
        version: 1,
        updatedAt: new Date().toISOString(),
      })
    }
  }

  // 3. Ensure other liabilities account (2-2000) exists if needed
  if (input.otherLiabilities > 0) {
    const otherLiabAcc = await getAccountByCode(tenantId, '2-2000')
    if (!otherLiabAcc) {
      await dexieDb.accounts.put({
        id: `acc-2-2000-${tenantId}`,
        tenantId,
        code: '2-2000',
        name: 'Kewajiban Jangka Panjang & Lainnya',
        type: 'liability',
        isSystem: true,
        isActive: true,
        syncStatus: 'pending',
        version: 1,
        updatedAt: new Date().toISOString(),
      })
    }
  }

  // 4. Calculate total assets and liabilities
  const totalBank = input.bankAccounts.reduce((sum, b) => sum + (Number(b.balance) || 0), 0)
  const totalAssets =
    input.cashOnHand +
    totalBank +
    input.accountsReceivable +
    input.inventoryValue +
    input.fixedAssets

  const totalLiabilities = input.accountsPayable + input.otherLiabilities
  const ownerEquity = totalAssets - totalLiabilities

  // 5. Build journal lines
  const lines: Array<{ accountCode: string; debit: number; credit: number }> = []

  if (input.cashOnHand > 0) {
    lines.push({ accountCode: '1-1100', debit: input.cashOnHand, credit: 0 })
  }

  for (const bank of input.bankAccounts) {
    if (bank.balance > 0) {
      const bankAcc = await ensurePaymentMethodAccount(tenantId, {
        name: bank.name,
        provider: bank.provider || bank.name,
        type: 'transfer',
      })
      lines.push({ accountCode: bankAcc.code, debit: bank.balance, credit: 0 })
    }
  }

  if (input.inventoryValue > 0) {
    lines.push({ accountCode: '1-2000', debit: input.inventoryValue, credit: 0 })
  }

  if (input.accountsReceivable > 0) {
    lines.push({ accountCode: '1-3000', debit: input.accountsReceivable, credit: 0 })
  }

  if (input.fixedAssets > 0) {
    lines.push({ accountCode: '1-4000', debit: input.fixedAssets, credit: 0 })
  }

  if (input.accountsPayable > 0) {
    lines.push({ accountCode: '2-1000', debit: 0, credit: input.accountsPayable })
  }

  if (input.otherLiabilities > 0) {
    lines.push({ accountCode: '2-2000', debit: 0, credit: input.otherLiabilities })
  }

  if (ownerEquity !== 0) {
    if (ownerEquity > 0) {
      lines.push({ accountCode: '3-1000', debit: 0, credit: ownerEquity })
    } else {
      lines.push({ accountCode: '3-1000', debit: Math.abs(ownerEquity), credit: 0 })
    }
  }

  // 6. Remove any prior opening balance journal entry
  const oldEntries = await dexieDb.journalEntries
    .where('[tenantId+referenceType+referenceId]')
    .equals([tenantId, 'opening_balance', 'setup'])
    .toArray()

  for (const old of oldEntries) {
    await dexieDb.journalLines.where('journalEntryId').equals(old.id).delete()
    await dexieDb.journalEntries.delete(old.id)
  }

  // 7. Create balanced journal entry if there are any lines
  if (lines.length > 0) {
    await createJournalEntry(tenantId, {
      referenceType: 'opening_balance',
      referenceId: 'setup',
      description: input.notes || 'Saldo Awal Akuntansi',
      date: input.date,
      lines,
    })
  }

  // 8. Update or create starting cash records in localDb.cash
  // Remove existing opening balance cash records
  const oldCash = await dexieDb.cash
    .where('tenantId')
    .equals(tenantId)
    .filter((c) => c.category === 'Saldo Awal')
    .toArray()

  for (const c of oldCash) {
    await dexieDb.cash.delete(c.id)
  }

  // Add Kas Tunai opening record
  if (input.cashOnHand > 0) {
    const cashRecord: LocalCash = {
      id: `cash-opening-tunai-${tenantId}`,
      tenantId,
      ref: 'SALDO-AWAL-KAS',
      date: input.date,
      account: 'Kas Toko',
      category: 'Saldo Awal',
      income: input.cashOnHand,
      expense: 0,
      status: 'Tercatat',
    }
    await dexieDb.cash.put(cashRecord)
  }

  // Add Bank opening records
  for (const bank of input.bankAccounts) {
    if (bank.balance > 0) {
      const bankRecord: LocalCash = {
        id: `cash-opening-${bank.name.replace(/\s+/g, '-').toLowerCase()}-${tenantId}`,
        tenantId,
        ref: `SALDO-AWAL-${bank.name.toUpperCase().replace(/\s+/g, '-')}`,
        date: input.date,
        account: bank.name,
        category: 'Saldo Awal',
        income: bank.balance,
        expense: 0,
        status: 'Tercatat',
      }
      await dexieDb.cash.put(bankRecord)
    }
  }

  // 9. Persist setting in localDb.settings
  const now = new Date().toISOString()
  await dexieDb.settings.put({
    id: `setting-${tenantId}-${SETTING_KEY}`,
    tenantId,
    area: 'accounting',
    setting: SETTING_KEY,
    value: JSON.stringify(input),
    updatedAt: now,
    status: 'active',
  })

  // Trigger mutate event for live queries
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vitpos:db-mutate'))
  }

  return { success: true, ownerEquity }
}
