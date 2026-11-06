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

const SETTING_KEY = 'accounting-opening-balance'

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
