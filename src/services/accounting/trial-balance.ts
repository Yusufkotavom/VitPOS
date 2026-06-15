import { dexieDb } from '@/services/local-db/dexie-instance'

export interface TrialBalanceRow {
  accountCode: string
  accountName: string
  type: string
  totalDebit: number
  totalCredit: number
  balance: number
}

/**
 * Get trial balance for a tenant.
 * Groups journal lines by account and calculates totals + balance.
 * Normal balance: asset/cogs/expense = debit - credit; liability/equity/revenue = credit - debit.
 * Optionally filter by date range (filters journal entries by date).
 */
export async function getTrialBalance(
  tenantId: string,
  startDate?: string,
  endDate?: string,
): Promise<TrialBalanceRow[]> {
  const accounts = await dexieDb.accounts.where('tenantId').equals(tenantId).toArray()
  const accountMap = new Map(accounts.map((a) => [a.code, a]))

  // Get all journal lines
  let allLines = await dexieDb.journalLines.where('tenantId').equals(tenantId).toArray()

  // Filter by date range if requested
  if (startDate || endDate) {
    const allEntries = await dexieDb.journalEntries.where('tenantId').equals(tenantId).toArray()
    const entryDateMap = new Map(allEntries.map((e) => [e.id, e.date]))

    allLines = allLines.filter((l) => {
      const date = entryDateMap.get(l.journalEntryId)
      if (!date) return false
      if (startDate && date < startDate) return false
      if (endDate && date > endDate) return false
      return true
    })
  }

  // Group by accountCode
  const grouped = new Map<string, { totalDebit: number; totalCredit: number }>()
  for (const line of allLines) {
    const key = line.accountCode
    const current = grouped.get(key) ?? { totalDebit: 0, totalCredit: 0 }
    current.totalDebit += line.debit
    current.totalCredit += line.credit
    grouped.set(key, current)
  }

  const normalDebitTypes = new Set(['asset', 'cogs', 'expense'])
  const rows: TrialBalanceRow[] = []

  for (const [accountCode, totals] of grouped) {
    const account = accountMap.get(accountCode)
    const balance = normalDebitTypes.has(account?.type ?? '')
      ? totals.totalDebit - totals.totalCredit
      : totals.totalCredit - totals.totalDebit

    rows.push({
      accountCode,
      accountName: account?.name ?? accountCode,
      type: account?.type ?? 'unknown',
      totalDebit: totals.totalDebit,
      totalCredit: totals.totalCredit,
      balance,
    })
  }

  // Sort by account code
  rows.sort((a, b) => a.accountCode.localeCompare(b.accountCode))

  return rows
}
