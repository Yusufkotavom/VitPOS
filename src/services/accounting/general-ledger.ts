import { dexieDb } from '@/services/local-db/dexie-instance'
import type { LocalAccount } from '@/services/local-db/schema'

export interface GeneralLedgerRow {
  date: string
  journalCode: string
  description: string
  referenceType: string
  referenceId: string
  debit: number
  credit: number
  balance: number
}

export interface GeneralLedgerReport {
  account: LocalAccount
  rows: GeneralLedgerRow[]
  endingBalance: number
}

/**
 * Get general ledger for a specific account in a date range.
 */
export async function getGeneralLedger(
  tenantId: string,
  accountCode: string,
  startDate?: string,
  endDate?: string,
): Promise<GeneralLedgerReport> {
  const account = await dexieDb.accounts
    .where('[tenantId+code]')
    .equals([tenantId, accountCode])
    .first()

  if (!account) {
    throw new Error(`Account ${accountCode} not found`)
  }

  // Get all lines for this account
  let lines = await dexieDb.journalLines
    .where('accountCode')
    .equals(accountCode)
    .toArray()

  // Filter by tenant
  lines = lines.filter((l) => l.tenantId === tenantId)

  // Get related journal entries for metadata
  const entryIds = [...new Set(lines.map((l) => l.journalEntryId))]
  const entries = await dexieDb.journalEntries
    .where('id')
    .anyOf(entryIds)
    .toArray()
  const entryMap = new Map(entries.map((e) => [e.id, e]))

  // Filter by date range
  let filteredLines = lines
  if (startDate) {
    filteredLines = filteredLines.filter((l) => {
      const entry = entryMap.get(l.journalEntryId)
      return entry && entry.date >= startDate
    })
  }
  if (endDate) {
    filteredLines = filteredLines.filter((l) => {
      const entry = entryMap.get(l.journalEntryId)
      return entry && entry.date <= endDate
    })
  }

  // Sort by date
  filteredLines.sort((a, b) => {
    const dateA = entryMap.get(a.journalEntryId)?.date ?? ''
    const dateB = entryMap.get(b.journalEntryId)?.date ?? ''
    return dateA.localeCompare(dateB)
  })

  // Calculate running balance
  const normalDebitTypes = new Set(['asset', 'cogs', 'expense'])
  const isNormalDebit = normalDebitTypes.has(account.type)

  // Get opening balance (before startDate)
  let openingBalance = 0
  if (startDate) {
    const beforeLines = lines.filter((l) => {
      const entry = entryMap.get(l.journalEntryId)
      return entry && entry.date < startDate
    })
    const debitBefore = beforeLines.reduce((s, l) => s + l.debit, 0)
    const creditBefore = beforeLines.reduce((s, l) => s + l.credit, 0)
    openingBalance = isNormalDebit ? debitBefore - creditBefore : creditBefore - debitBefore
  }

  let runningBalance = openingBalance
  const rows: GeneralLedgerRow[] = filteredLines.map((line) => {
    const entry = entryMap.get(line.journalEntryId)
    const balanceChange = isNormalDebit ? line.debit - line.credit : line.credit - line.debit
    runningBalance += balanceChange

    return {
      date: entry?.date ?? '',
      journalCode: entry?.code ?? '',
      description: entry?.description ?? '',
      referenceType: entry?.referenceType ?? '',
      referenceId: entry?.referenceId ?? '',
      debit: line.debit,
      credit: line.credit,
      balance: runningBalance,
    }
  })

  return {
    account,
    rows,
    endingBalance: runningBalance,
  }
}
