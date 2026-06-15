import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { LocalAccount, LocalJournalEntry, LocalJournalLine } from '@/services/local-db/schema'

const accounts = new Map<string, LocalAccount>()
const journalEntries = new Map<string, LocalJournalEntry>()
const journalLines = new Map<string, LocalJournalLine>()

function addAccount(code: string, name: string, type: string, tenantId = 'tenant-1') {
  accounts.set(code, { id: `acc-${code}`, code, name, type, tenantId, isSystem: true, isActive: true, syncStatus: 'synced', version: 1, updatedAt: '2026-01-01' } as LocalAccount)
}

function addEntry(id: string, date: string, tenantId = 'tenant-1') {
  journalEntries.set(id, { id, tenantId, code: `JNL-${date.replace(/-/g, '')}-001`, description: 'test', referenceType: 'test', referenceId: id, date, syncStatus: 'synced', version: 1, updatedAt: '2026-01-01' } as LocalJournalEntry)
}

function addLine(id: string, entryId: string, accountCode: string, debit: number, credit: number, tenantId = 'tenant-1') {
  journalLines.set(id, { id, tenantId, journalEntryId: entryId, accountId: accountCode, accountCode, debit, credit, syncStatus: 'synced', updatedAt: '2026-01-01' } as LocalJournalLine)
}

const mockDb = {
  accounts: {
    where: vi.fn((key: string) => ({
      equals: vi.fn((value: string) => ({
        toArray: vi.fn(async () =>
          Array.from(accounts.values()).filter((a) => (a as unknown as Record<string, string>)[key] === value),
        ),
      })),
    })),
  },
  journalEntries: {
    where: vi.fn((key: string) => ({
      equals: vi.fn((value: string) => ({
        toArray: vi.fn(async () =>
          Array.from(journalEntries.values()).filter((e) => (e as unknown as Record<string, string>)[key] === value),
        ),
      })),
    })),
  },
  journalLines: {
    where: vi.fn((key: string) => ({
      equals: vi.fn((value: string) => ({
        toArray: vi.fn(async () =>
          Array.from(journalLines.values()).filter((l) => (l as unknown as Record<string, string>)[key] === value),
        ),
      })),
    })),
  },
}

vi.mock('@/services/local-db/dexie-instance', () => ({
  dexieDb: mockDb,
}))

describe('getTrialBalance', () => {
  beforeEach(() => {
    accounts.clear()
    journalEntries.clear()
    journalLines.clear()
    vi.clearAllMocks()
  })

  it('returns empty array when no journal lines exist', async () => {
    addAccount('1-1100', 'Kas Tunai', 'asset')
    const { getTrialBalance } = await import('./trial-balance')
    const result = await getTrialBalance('tenant-1')
    expect(result).toHaveLength(0)
  })

  it('calculates normal debit balance for asset accounts', async () => {
    addAccount('1-1100', 'Kas Tunai', 'asset')
    addEntry('e1', '2026-06-01')
    addLine('l1', 'e1', '1-1100', 50000, 0)

    const { getTrialBalance } = await import('./trial-balance')
    const result = await getTrialBalance('tenant-1')

    expect(result).toHaveLength(1)
    expect(result[0].accountCode).toBe('1-1100')
    expect(result[0].totalDebit).toBe(50000)
    expect(result[0].totalCredit).toBe(0)
    expect(result[0].balance).toBe(50000) // asset = debit - credit
  })

  it('calculates normal credit balance for revenue accounts', async () => {
    addAccount('4-1000', 'Pendapatan', 'revenue')
    addEntry('e1', '2026-06-01')
    addLine('l1', 'e1', '4-1000', 0, 75000)

    const { getTrialBalance } = await import('./trial-balance')
    const result = await getTrialBalance('tenant-1')

    expect(result).toHaveLength(1)
    expect(result[0].balance).toBe(75000) // revenue = credit - debit
  })

  it('groups multiple lines by account and computes net balance', async () => {
    addAccount('1-1100', 'Kas Tunai', 'asset')
    addAccount('4-1000', 'Pendapatan', 'revenue')
    addAccount('5-1000', 'HPP', 'cogs')

    addEntry('e1', '2026-06-01')
    addEntry('e2', '2026-06-02')

    // Sale 1: Dr Cash 50k, Cr Revenue 50k
    addLine('l1', 'e1', '1-1100', 50000, 0)
    addLine('l2', 'e1', '4-1000', 0, 50000)

    // Sale 2: Dr Cash 30k, Cr Revenue 30k, Dr HPP 20k, Cr Inventory (no account)
    addLine('l3', 'e2', '1-1100', 30000, 0)
    addLine('l4', 'e2', '4-1000', 0, 30000)
    addLine('l5', 'e2', '5-1000', 20000, 0)

    const { getTrialBalance } = await import('./trial-balance')
    const result = await getTrialBalance('tenant-1')

    expect(result).toHaveLength(3)

    const cash = result.find((r) => r.accountCode === '1-1100')!
    expect(cash.balance).toBe(80000) // 50000 + 30000

    const revenue = result.find((r) => r.accountCode === '4-1000')!
    expect(revenue.balance).toBe(80000) // 50000 + 30000

    const hpp = result.find((r) => r.accountCode === '5-1000')!
    expect(hpp.balance).toBe(20000) // debit - credit
  })

  it('sorts results by account code', async () => {
    addAccount('4-1000', 'Pendapatan', 'revenue')
    addAccount('1-1100', 'Kas', 'asset')
    addEntry('e1', '2026-06-01')
    addLine('l1', 'e1', '4-1000', 0, 100)
    addLine('l2', 'e1', '1-1100', 100, 0)

    const { getTrialBalance } = await import('./trial-balance')
    const result = await getTrialBalance('tenant-1')

    expect(result[0].accountCode).toBe('1-1100')
    expect(result[1].accountCode).toBe('4-1000')
  })

  it('filters by date range when startDate and endDate provided', async () => {
    addAccount('1-1100', 'Kas', 'asset')
    addAccount('4-1000', 'Pendapatan', 'revenue')

    addEntry('e1', '2026-06-01')
    addEntry('e2', '2026-06-15')
    addEntry('e3', '2026-06-30')

    addLine('l1', 'e1', '1-1100', 10000, 0)
    addLine('l2', 'e1', '4-1000', 0, 10000)

    addLine('l3', 'e2', '1-1100', 20000, 0)
    addLine('l4', 'e2', '4-1000', 0, 20000)

    addLine('l5', 'e3', '1-1100', 30000, 0)
    addLine('l6', 'e3', '4-1000', 0, 30000)

    const { getTrialBalance } = await import('./trial-balance')
    const result = await getTrialBalance('tenant-1', '2026-06-10', '2026-06-20')

    const cash = result.find((r) => r.accountCode === '1-1100')!
    expect(cash.balance).toBe(20000) // only e2 is in range
  })
})
