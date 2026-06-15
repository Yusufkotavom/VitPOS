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

describe('getProfitLoss', () => {
  beforeEach(() => {
    accounts.clear()
    journalEntries.clear()
    journalLines.clear()
    vi.clearAllMocks()
  })

  it('returns zero values when no journal lines exist', async () => {
    addAccount('4-1000', 'Pendapatan', 'revenue')
    addAccount('5-1000', 'HPP', 'cogs')
    addAccount('6-2000', 'Beban', 'expense')

    const { getProfitLoss } = await import('./profit-loss')
    const result = await getProfitLoss('tenant-1')

    expect(result.totalRevenue).toBe(0)
    expect(result.totalCogs).toBe(0)
    expect(result.totalExpense).toBe(0)
    expect(result.grossProfit).toBe(0)
    expect(result.netProfit).toBe(0)
  })

  it('calculates gross profit = revenue - cogs', async () => {
    addAccount('4-1000', 'Pendapatan Penjualan', 'revenue')
    addAccount('5-1000', 'HPP', 'cogs')

    addEntry('e1', '2026-06-01')
    addLine('l1', 'e1', '4-1000', 0, 100000) // revenue
    addLine('l2', 'e1', '5-1000', 60000, 0)   // cogs
    addLine('l3', 'e1', '1-1100', 100000, 0)   // cash (debit)
    addLine('l4', 'e1', '1-2000', 0, 60000)    // inventory (credit) — but 1-2000 not registered as account so won't show in PL

    // We need the 1-2000 account to exist for it to be a "line" but it's an asset so won't affect PL
    addAccount('1-1100', 'Kas', 'asset')
    addAccount('1-2000', 'Persediaan', 'asset')

    const { getProfitLoss } = await import('./profit-loss')
    const result = await getProfitLoss('tenant-1')

    expect(result.totalRevenue).toBe(100000)
    expect(result.totalCogs).toBe(60000)
    expect(result.grossProfit).toBe(40000)
    expect(result.netProfit).toBe(40000) // no expenses
  })

  it('calculates net profit = gross profit - expenses', async () => {
    addAccount('4-1000', 'Pendapatan Penjualan', 'revenue')
    addAccount('5-1000', 'HPP', 'cogs')
    addAccount('6-2000', 'Penyesuaian Persediaan', 'expense')

    addEntry('e1', '2026-06-01')
    addLine('l1', 'e1', '4-1000', 0, 200000)
    addLine('l2', 'e1', '5-1000', 80000, 0)
    addLine('l3', 'e1', '6-2000', 10000, 0)
    addLine('l4', 'e1', '1-1100', 200000, 0)
    addLine('l5', 'e1', '1-2000', 0, 80000)
    addLine('l6', 'e1', '1-2000', 0, 10000)

    addAccount('1-1100', 'Kas', 'asset')
    addAccount('1-2000', 'Persediaan', 'asset')

    const { getProfitLoss } = await import('./profit-loss')
    const result = await getProfitLoss('tenant-1')

    expect(result.totalRevenue).toBe(200000)
    expect(result.totalCogs).toBe(80000)
    expect(result.grossProfit).toBe(120000)
    expect(result.totalExpense).toBe(10000)
    expect(result.netProfit).toBe(110000)
  })
})
