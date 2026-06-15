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
          Array.from(accounts.values()).filter((a) => (a as Record<string, string>)[key] === value),
        ),
      })),
    })),
  },
  journalEntries: {
    where: vi.fn((key: string) => ({
      equals: vi.fn((value: string) => ({
        toArray: vi.fn(async () =>
          Array.from(journalEntries.values()).filter((e) => (e as Record<string, string>)[key] === value),
        ),
      })),
    })),
  },
  journalLines: {
    where: vi.fn((key: string) => ({
      equals: vi.fn((value: string) => ({
        toArray: vi.fn(async () =>
          Array.from(journalLines.values()).filter((l) => (l as Record<string, string>)[key] === value),
        ),
      })),
    })),
  },
}

vi.mock('@/services/local-db/dexie-instance', () => ({
  dexieDb: mockDb,
}))

describe('getBalanceSheet', () => {
  beforeEach(() => {
    accounts.clear()
    journalEntries.clear()
    journalLines.clear()
    vi.clearAllMocks()
  })

  it('returns zero values when no journal lines exist', async () => {
    addAccount('1-1100', 'Kas Tunai', 'asset')
    addAccount('2-1000', 'Hutang', 'liability')
    addAccount('3-1000', 'Modal', 'equity')

    const { getBalanceSheet } = await import('./balance-sheet')
    const result = await getBalanceSheet('tenant-1')

    expect(result.totalAssets).toBe(0)
    expect(result.totalLiabilities).toBe(0)
    expect(result.totalEquity).toBe(0)
    expect(result.totalLiabilitiesEquity).toBe(0)
  })

  it('categorizes accounts correctly by type', async () => {
    addAccount('1-1100', 'Kas Tunai', 'asset')
    addAccount('1-2000', 'Persediaan', 'asset')
    addAccount('2-1000', 'Hutang Usaha', 'liability')
    addAccount('3-1000', 'Modal', 'equity')

    addEntry('e1', '2026-06-01')
    addLine('l1', 'e1', '1-1100', 100000, 0)
    addLine('l2', 'e1', '1-2000', 50000, 0)
    addLine('l3', 'e1', '2-1000', 0, 30000)
    addLine('l4', 'e1', '3-1000', 0, 120000)
    addLine('l5', 'e1', '4-1000', 0, 0) // revenue — should not appear in BS

    const { getBalanceSheet } = await import('./balance-sheet')
    const result = await getBalanceSheet('tenant-1')

    expect(result.assets).toHaveLength(2)
    expect(result.liabilities).toHaveLength(1)
    expect(result.equities).toHaveLength(1)

    expect(result.totalAssets).toBe(150000) // 100000 + 50000
    expect(result.totalLiabilities).toBe(30000)
    expect(result.totalEquity).toBe(120000)
  })

  it('ensures assets = liabilities + equity', async () => {
    addAccount('1-1100', 'Kas Tunai', 'asset')
    addAccount('1-2000', 'Persediaan', 'asset')
    addAccount('2-1000', 'Hutang Usaha', 'liability')
    addAccount('3-1000', 'Modal', 'equity')

    addEntry('e1', '2026-06-01')
    addLine('l1', 'e1', '1-1100', 200000, 0)
    addLine('l2', 'e1', '1-2000', 80000, 0)
    addLine('l3', 'e1', '2-1000', 0, 50000)
    addLine('l4', 'e1', '3-1000', 0, 230000)

    const { getBalanceSheet } = await import('./balance-sheet')
    const result = await getBalanceSheet('tenant-1')

    expect(result.totalAssets).toBe(280000)
    expect(result.totalLiabilitiesEquity).toBe(280000) // 50000 + 230000
  })

  it('includes accountCode and accountName in each entry', async () => {
    addAccount('1-1100', 'Kas Tunai', 'asset')
    addEntry('e1', '2026-06-01')
    addLine('l1', 'e1', '1-1100', 50000, 0)

    const { getBalanceSheet } = await import('./balance-sheet')
    const result = await getBalanceSheet('tenant-1')

    expect(result.assets[0]).toMatchObject({
      accountCode: '1-1100',
      accountName: 'Kas Tunai',
      balance: 50000,
    })
  })
})
