import { dexieDb } from '@/services/local-db/dexie-instance'
import type { LocalJournalEntry, LocalJournalLine, SyncStatus } from '@/services/local-db/schema'
import { ensureSystemAccounts, getAccountByCode } from '@/services/accounting/chart-of-accounts'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface JournalLineInput {
  accountCode: string
  debit: number
  credit: number
}

export interface CreateJournalEntryInput {
  referenceType: string
  referenceId: string
  description: string
  date: string
  lines: JournalLineInput[]
}

export interface JournalEntryResult {
  entry: LocalJournalEntry
  lines: LocalJournalLine[]
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Generate the next journal entry code for a tenant & date. */
async function generateJournalCode(tenantId: string, date: string): Promise<string> {
  const datePart = date.replace(/-/g, '')
  const prefix = `JNL-${datePart}-`

  // Find the highest existing code for this date prefix
  const existing = await dexieDb.journalEntries
    .where('[tenantId+code]')
    .between([tenantId, prefix], [tenantId, prefix + '\uFFFF'])
    .toArray()

  let maxSeq = 0
  for (const entry of existing) {
    const parts = entry.code.split('-')
    const seq = parseInt(parts[parts.length - 1] ?? '0', 10)
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0')
  return `${prefix}${nextSeq}`
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/**
 * Create a validated journal entry.
 *
 * - Ensures system accounts exist
 * - Resolves all account codes to verify they exist
 * - Validates total debit === total credit
 * - Generates journal code
 * - Inserts into Dexie + outbox via repository pattern
 */
export async function createJournalEntry(
  tenantId: string,
  input: CreateJournalEntryInput,
): Promise<JournalEntryResult> {
  // 1. Ensure system accounts exist
  await ensureSystemAccounts(tenantId)

  // 2. Validate lines
  if (!input.lines.length) {
    throw new Error('Journal entry must have at least one line')
  }

  // 3. Validate and resolve accounts
  const totalDebit = input.lines.reduce((sum, l) => sum + l.debit, 0)
  const totalCredit = input.lines.reduce((sum, l) => sum + l.credit, 0)

  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error(
      `Journal entry is not balanced: debit ${totalDebit} ≠ credit ${totalCredit}`,
    )
  }

  // 4. Verify all accounts exist
  for (const line of input.lines) {
    const account = await getAccountByCode(tenantId, line.accountCode)
    if (!account) {
      throw new Error(`Account ${line.accountCode} not found for tenant ${tenantId}`)
    }
  }

  // 5. Generate code
  const code = await generateJournalCode(tenantId, input.date)

  // 6. Create entry
  const now = new Date().toISOString()
  const entryId = `je-${crypto.randomUUID()}`
  const entry: LocalJournalEntry = {
    id: entryId,
    tenantId,
    code,
    description: input.description,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    date: input.date,
    syncStatus: 'pending' as SyncStatus,
    version: 1,
    updatedAt: now,
  }

  // 7. Create lines
  const lines: LocalJournalLine[] = input.lines.map((line) => ({
    id: `jl-${crypto.randomUUID()}`,
    tenantId,
    journalEntryId: entryId,
    accountId: line.accountCode, // accountCode as accountId for offline-first (resolved at sync)
    accountCode: line.accountCode,
    debit: line.debit,
    credit: line.credit,
    syncStatus: 'pending' as SyncStatus,
    updatedAt: now,
  }))

  // 8. Persist to Dexie
  await dexieDb.transaction('rw', dexieDb.journalEntries, dexieDb.journalLines, async () => {
    await dexieDb.journalEntries.put(entry)
    await dexieDb.journalLines.bulkPut(lines)
  })

  return { entry, lines }
}

/**
 * Get journal entries for a reference (e.g. all entries for a POS sale).
 */
export async function getJournalEntriesByReference(
  tenantId: string,
  referenceType: string,
  referenceId: string,
): Promise<(LocalJournalEntry & { lines: LocalJournalLine[] })[]> {
  const entries = await dexieDb.journalEntries
    .where('[tenantId+referenceType+referenceId]')
    .equals([tenantId, referenceType, referenceId])
    .toArray()

  const result = []
  for (const entry of entries) {
    const lines = await dexieDb.journalLines
      .where('journalEntryId')
      .equals(entry.id)
      .toArray()
    result.push({ ...entry, lines })
  }

  return result
}

/**
 * Get journal entries within a date range.
 */
export async function getJournalEntriesByDateRange(
  tenantId: string,
  startDate: string,
  endDate: string,
): Promise<LocalJournalEntry[]> {
  return dexieDb.journalEntries
    .where('[tenantId+date]')
    .between([tenantId, startDate], [tenantId, endDate])
    .toArray()
}
