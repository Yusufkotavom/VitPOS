import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { LocalCash, LocalProduct, LocalCustomer, LocalSupplier, LocalSetting } from '@/services/local-db/schema'

const { cashRows, products, customers, suppliers, settings, mockDb } = vi.hoisted(() => {
  const cashRows = new Map<string, LocalCash>()
  const products = new Map<string, LocalProduct>()
  const customers = new Map<string, LocalCustomer>()
  const suppliers = new Map<string, LocalSupplier>()
  const settings = new Map<string, LocalSetting>()

  const mockDb = {
    cash: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(async () => Array.from(cashRows.values())),
          filter: vi.fn((predicate: (c: LocalCash) => boolean) => ({
            toArray: vi.fn(async () => Array.from(cashRows.values()).filter(predicate)),
          })),
        })),
      })),
      put: vi.fn(async (item: LocalCash) => {
        cashRows.set(item.id, item)
        return item.id
      }),
      delete: vi.fn(async (id: string) => {
        cashRows.delete(id)
      }),
    },
    products: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(async () => Array.from(products.values())),
        })),
      })),
    },
    customers: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(async () => Array.from(customers.values())),
        })),
      })),
    },
    suppliers: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(async () => Array.from(suppliers.values())),
        })),
      })),
    },
    salesOrders: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(async () => []),
        })),
      })),
    },
    purchases: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(async () => []),
        })),
      })),
    },
    paymentMethods: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          filter: vi.fn(() => ({
            toArray: vi.fn(async () => [
              { id: 'pm-bca', tenantId: 'tenant-1', name: 'Bank BCA', type: 'transfer', provider: 'BCA', status: 'Aktif' },
            ]),
          })),
        })),
      })),
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
    accounts: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          first: vi.fn(async () => null),
        })),
      })),
      put: vi.fn(async () => 'acc-id'),
    },
    journalEntries: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(async () => []),
        })),
      })),
      delete: vi.fn(async () => {}),
    },
    journalLines: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          delete: vi.fn(async () => {}),
        })),
      })),
    },
  }

  return { cashRows, products, customers, suppliers, settings, mockDb }
})

vi.mock('@/services/local-db/dexie-instance', () => ({
  dexieDb: mockDb,
}))

vi.mock('@/services/accounting/chart-of-accounts', () => ({
  ensureSystemAccounts: vi.fn(async () => {}),
  ensurePaymentMethodAccount: vi.fn(async (_t, info) => ({
    id: `acc-${info.name}`,
    code: '1-1301',
    name: info.name,
    type: 'asset',
  })),
  getAccountByCode: vi.fn(async () => null),
}))

vi.mock('@/services/accounting/journal.service', () => ({
  createJournalEntry: vi.fn(async () => ({ id: 'jnl-1' })),
}))

import {
  getCurrentSystemBalances,
  saveOpeningBalance,
  getOpeningBalance,
} from './opening-balance.service'

describe('opening-balance.service', () => {
  beforeEach(() => {
    cashRows.clear()
    products.clear()
    customers.clear()
    suppliers.clear()
    settings.clear()
    vi.clearAllMocks()
  })

  it('reads current system balances across cash, products, receivables, and payables', async () => {
    // 1. Seed cash
    cashRows.set('c1', {
      id: 'c1',
      tenantId: 'tenant-1',
      ref: 'TX-1',
      date: '2026-11-01',
      account: 'Kas Toko',
      category: 'Penjualan',
      income: 500000,
      expense: 0,
      status: 'Tercatat',
    })
    cashRows.set('c2', {
      id: 'c2',
      tenantId: 'tenant-1',
      ref: 'TX-2',
      date: '2026-11-01',
      account: 'Bank BCA',
      category: 'Penjualan',
      income: 1200000,
      expense: 0,
      status: 'Tercatat',
    })

    // 2. Seed physical product stock
    products.set('p1', {
      id: 'p1',
      tenantId: 'tenant-1',
      name: 'Kertas HVS A4',
      category: 'ATK',
      type: 'Produk Fisik',
      price: 55000,
      costPrice: 45000,
      stock: 10,
      status: 'Aktif',
      syncStatus: 'synced',
      version: 1,
      updatedAt: '2026-11-01',
    })

    // 3. Seed customer receivable
    customers.set('cust1', {
      id: 'cust1',
      tenantId: 'tenant-1',
      name: 'PT Maju',
      phone: '0812',
      city: 'Jakarta',
      receivable: 350000,
      orders: 2,
      status: 'Aktif',
      syncStatus: 'synced',
      version: 1,
      updatedAt: '2026-11-01',
    })

    // 4. Seed supplier payable
    suppliers.set('sup1', {
      id: 'sup1',
      tenantId: 'tenant-1',
      name: 'Supplier Sinar Jaya',
      phone: '0813',
      city: 'Bandung',
      payable: 600000,
      orders: 1,
      status: 'Aktif',
      syncStatus: 'synced',
      version: 1,
      updatedAt: '2026-11-01',
    })

    const sys = await getCurrentSystemBalances('tenant-1')

    expect(sys.cashOnHand).toBe(500000)
    expect(sys.bankAccounts.some((b) => b.name === 'Bank BCA' && b.balance === 1200000)).toBe(true)
    expect(sys.inventoryValue).toBe(450000) // 10 * 45000
    expect(sys.productCount).toBe(1)
    expect(sys.accountsReceivable).toBe(350000)
    expect(sys.accountsPayable).toBe(600000)
    expect(sys.hasExistingOpeningBalance).toBe(false)
  })

  it('saves opening balance and allows editing it cleanly', async () => {
    const input = {
      date: '2026-01-01',
      cashOnHand: 1000000,
      bankAccounts: [{ name: 'Bank BCA', balance: 5000000, provider: 'BCA' }],
      accountsReceivable: 500000,
      inventoryValue: 2000000,
      fixedAssets: 10000000,
      accountsPayable: 1500000,
      otherLiabilities: 0,
      notes: 'Saldo Awal Awal Tahun',
    }

    const res = await saveOpeningBalance('tenant-1', input)
    expect(res.success).toBe(true)
    // Assets: 1m + 5m + 0.5m + 2m + 10m = 18.5m
    // Liabilities: 1.5m
    // Equity: 17m
    expect(res.ownerEquity).toBe(17000000)

    const saved = await getOpeningBalance('tenant-1')
    expect(saved).not.toBeNull()
    expect(saved?.cashOnHand).toBe(1000000)
    expect(saved?.notes).toBe('Saldo Awal Awal Tahun')

    // Edit opening balance
    const updated = {
      ...input,
      cashOnHand: 1500000,
      notes: 'Saldo Awal Direvisi',
    }
    const res2 = await saveOpeningBalance('tenant-1', updated)
    expect(res2.success).toBe(true)
    expect(res2.ownerEquity).toBe(17500000)

    const saved2 = await getOpeningBalance('tenant-1')
    expect(saved2?.cashOnHand).toBe(1500000)
    expect(saved2?.notes).toBe('Saldo Awal Direvisi')
  })
})
