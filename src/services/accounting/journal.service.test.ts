import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { LocalAccount, LocalJournalEntry, LocalJournalLine } from '@/services/local-db/schema'

// ── shared in-memory store ──
const accounts = new Map<string, LocalAccount>()
const journalEntries = new Map<string, LocalJournalEntry>()
const journalLines = new Map<string, LocalJournalLine>()

function addAccount(code: string, name: string, type: string, tenantId = 'tenant-1') {
  accounts.set(code, {
    id: `acc-${code}`,
    code,
    name,
    type,
    tenantId,
    isSystem: true,
    isActive: true,
    syncStatus: 'synced' as const,
    version: 1,
    updatedAt: '2026-01-01',
  } as LocalAccount)
}

const mockDb = {
  accounts: {
    where: vi.fn((key: string) => {
      // Compound key [tenantId+code] — equals receives [tenantId, code]
      if (key === '[tenantId+code]') {
        return {
          equals: vi.fn((value: string[]) => {
            const [tid, code] = value as [string, string]
            return {
              first: vi.fn(async () =>
                Array.from(accounts.values()).find((a) => a.tenantId === tid && a.code === code) ?? null,
              ),
              toArray: vi.fn(async () =>
                Array.from(accounts.values()).filter((a) => a.tenantId === tid && a.code === code),
              ),
              between: vi.fn(() => ({
                toArray: vi.fn(async () => Array.from(accounts.values())),
              })),
            }
          }),
        }
      }
      // Simple key
      return {
        equals: vi.fn((value: string) => ({
          toArray: vi.fn(async () =>
            Array.from(accounts.values()).filter((a) => (a as unknown as Record<string, string>)[key] === value),
          ),
          first: vi.fn(async () =>
            Array.from(accounts.values()).find((a) => (a as unknown as Record<string, string>)[key] === value) ?? null,
          ),
        })),
      }
    }),
    put: vi.fn(async (a: LocalAccount) => { accounts.set(a.code, a); return a.id }),
  },
  journalEntries: {
    where: vi.fn((key: string) => ({
      equals: vi.fn((value: string) => ({
        toArray: vi.fn(async () =>
          Array.from(journalEntries.values()).filter((e) => (e as unknown as Record<string, string>)[key] === value),
        ),
      })),
      between: vi.fn(() => ({
        toArray: vi.fn(async () => Array.from(journalEntries.values())),
      })),
    })),
    put: vi.fn(async (e: LocalJournalEntry) => { journalEntries.set(e.id, e); return e.id }),
  },
  journalLines: {
    where: vi.fn(() => ({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => []),
      })),
    })),
    bulkPut: vi.fn(async (lines: LocalJournalLine[]) => {
      for (const l of lines) journalLines.set(l.id, l)
    }),
  },
  transaction: vi.fn(async (_mode: string, _t1: unknown, _t2: unknown, callback: () => Promise<void>) => {
    await callback()
  }),
}

vi.mock('@/services/local-db/dexie-instance', () => ({
  dexieDb: mockDb,
}))

describe('createJournalEntry', () => {
  beforeEach(() => {
    accounts.clear()
    journalEntries.clear()
    journalLines.clear()
    vi.clearAllMocks()

    // Add system accounts needed for validation
    addAccount('1-1100', 'Kas Tunai', 'asset')
    addAccount('4-1000', 'Pendapatan Penjualan', 'revenue')
    addAccount('5-1000', 'HPP', 'cogs')
    addAccount('1-2000', 'Persediaan', 'asset')
  })

  it('creates a balanced journal entry with debit = credit', async () => {
    const { createJournalEntry } = await import('./journal.service')

    const result = await createJournalEntry('tenant-1', {
      referenceType: 'pos_sale',
      referenceId: 'sale-1',
      description: 'Penjualan Tunai',
      date: '2026-06-15',
      lines: [
        { accountCode: '1-1100', debit: 50000, credit: 0 },
        { accountCode: '4-1000', debit: 0, credit: 50000 },
      ],
    })

    expect(result.entry.code).toMatch(/^JNL-20260615-/)
    expect(result.entry.referenceType).toBe('pos_sale')
    expect(result.entry.referenceId).toBe('sale-1')
    expect(result.lines).toHaveLength(2)
    expect(mockDb.journalEntries.put).toHaveBeenCalled()
    expect(mockDb.journalLines.bulkPut).toHaveBeenCalled()
  })

  it('throws error for unbalanced entry', async () => {
    const { createJournalEntry } = await import('./journal.service')

    await expect(createJournalEntry('tenant-1', {
      referenceType: 'test',
      referenceId: 'test-1',
      description: 'Unbalanced',
      date: '2026-06-15',
      lines: [
        { accountCode: '1-1100', debit: 50000, credit: 0 },
        { accountCode: '4-1000', debit: 0, credit: 30000 },
      ],
    })).rejects.toThrow('not balanced')
  })

  it('throws error for empty lines', async () => {
    const { createJournalEntry } = await import('./journal.service')

    await expect(createJournalEntry('tenant-1', {
      referenceType: 'test',
      referenceId: 'test-1',
      description: 'No lines',
      date: '2026-06-15',
      lines: [],
    })).rejects.toThrow('at least one line')
  })

  it('creates complex multi-line entry (HPP + revenue)', async () => {
    const { createJournalEntry } = await import('./journal.service')

    const result = await createJournalEntry('tenant-1', {
      referenceType: 'pos_sale',
      referenceId: 'sale-2',
      description: 'Penjualan dengan HPP',
      date: '2026-06-15',
      lines: [
        { accountCode: '1-1100', debit: 25000, credit: 0 },
        { accountCode: '4-1000', debit: 0, credit: 25000 },
        { accountCode: '5-1000', debit: 15000, credit: 0 },
        { accountCode: '1-2000', debit: 0, credit: 15000 },
      ],
    })

    expect(result.lines).toHaveLength(4)
  })
})
