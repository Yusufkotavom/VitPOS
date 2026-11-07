import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { LocalCash, LocalSetting } from '@/services/local-db/schema'

const { cashRows, settings, mockDb } = vi.hoisted(() => {
  const cashRows = new Map<string, LocalCash>()
  const settings = new Map<string, LocalSetting>()

  const mockDb = {
    cash: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(async () => Array.from(cashRows.values())),
        })),
      })),
      put: vi.fn(async (item: LocalCash) => {
        cashRows.set(item.id, item)
        return item.id
      }),
    },
    settings: {
      where: vi.fn(() => ({
        equals: vi.fn(([tenantId, settingKey]: [string, string]) => ({
          first: vi.fn(async () => {
            return Array.from(settings.values()).find(
              (s) => s.tenantId === tenantId && s.setting === settingKey,
            )
          }),
        })),
      })),
      put: vi.fn(async (item: LocalSetting) => {
        settings.set(item.id, item)
        return item.id
      }),
    },
  }

  return { cashRows, settings, mockDb }
})

vi.mock('@/services/local-db/dexie-instance', () => ({
  dexieDb: mockDb,
}))

vi.mock('@/services/accounting/accounting-integration', () => ({
  recordCashJournal: vi.fn(async () => {}),
}))

import {
  getRecurringTemplates,
  saveRecurringTemplates,
  executeRecurringTransaction,
  executeAllPendingRecurring,
  isExecutedThisMonth,
  type RecurringCashTemplate,
} from './recurring-cash.service'

describe('recurring-cash.service', () => {
  beforeEach(() => {
    cashRows.clear()
    settings.clear()
    vi.clearAllMocks()
  })

  it('initializes default recurring templates when setting is empty', async () => {
    const list = await getRecurringTemplates('tenant-1')
    expect(list.length).toBeGreaterThanOrEqual(4)
    expect(list.some((t) => t.name.includes('Listrik'))).toBe(true)
    expect(list.some((t) => t.name.includes('Internet'))).toBe(true)
    expect(list.some((t) => t.name.includes('Gaji'))).toBe(true)
  })

  it('executes a recurring transaction, creating cash record and updating execution metadata', async () => {
    const customTemplate: RecurringCashTemplate = {
      id: 'rec-test-1',
      tenantId: 'tenant-1',
      name: 'Iuran Kebersihan Pasar',
      type: 'Pengeluaran',
      category: 'Biaya Kebersihan',
      account: 'Kas Toko',
      amount: 50000,
      dueDay: 5,
      isActive: true,
    }
    await saveRecurringTemplates('tenant-1', [customTemplate])

    const res = await executeRecurringTransaction('tenant-1', 'rec-test-1', {
      executionDate: '2026-11-05',
      amount: 50000,
    })

    expect(res.success).toBe(true)
    expect(res.ref).toContain('RUT-202611-')

    // Verify cash record was written
    const cashList = Array.from(cashRows.values())
    expect(cashList.length).toBe(1)
    expect(cashList[0].expense).toBe(50000)
    expect(cashList[0].category).toBe('Biaya Kebersihan')

    // Verify template execution tracking
    const updated = await getRecurringTemplates('tenant-1')
    expect(updated[0].lastExecutedMonth).toBe('2026-11')
    expect(isExecutedThisMonth(updated[0], '2026-11')).toBe(true)
  })

  it('executes all pending recurring transactions for current month', async () => {
    const templates: RecurringCashTemplate[] = [
      {
        id: 'rec-1',
        tenantId: 'tenant-1',
        name: 'Listrik',
        type: 'Pengeluaran',
        category: 'Utilitas',
        account: 'Kas Toko',
        amount: 300000,
        dueDay: 10,
        isActive: true,
      },
      {
        id: 'rec-2',
        tenantId: 'tenant-1',
        name: 'WiFi',
        type: 'Pengeluaran',
        category: 'Utilitas',
        account: 'Bank BCA',
        amount: 250000,
        dueDay: 15,
        isActive: true,
      },
      {
        id: 'rec-3',
        tenantId: 'tenant-1',
        name: 'Sewa Rak',
        type: 'Pemasukan',
        category: 'Sewa',
        account: 'Kas Toko',
        amount: 200000,
        dueDay: 1,
        isActive: true,
        lastExecutedMonth: '2026-11', // already done
      },
    ]
    await saveRecurringTemplates('tenant-1', templates)

    const result = await executeAllPendingRecurring('tenant-1', '2026-11-07')
    expect(result.executedCount).toBe(2) // rec-1 and rec-2 only

    const allCash = Array.from(cashRows.values())
    expect(allCash.length).toBe(2)
  })
})
