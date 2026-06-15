import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { LocalAccount } from '@/services/local-db/schema'

// Build a shared in-memory store so mocks work across imports
function createMockDb() {
  const accounts = new Map<string, LocalAccount>()
  return {
    accounts: {
      where: vi.fn((key: string) => ({
        equals: vi.fn((value: string) => ({
          toArray: vi.fn(async () =>
            Array.from(accounts.values()).filter((a) => (a as unknown as Record<string, string>)[key] === value),
          ),
          first: vi.fn(async () =>
            Array.from(accounts.values()).find((a) => (a as unknown as Record<string, string>)[key] === value),
          ),
          filter: vi.fn((fn: (a: LocalAccount) => boolean) => ({
            first: vi.fn(async () => Array.from(accounts.values()).find(fn)),
          })),
        })),
        between: vi.fn((_lower: unknown[], _upper: unknown[]) => ({
          toArray: vi.fn(async () => Array.from(accounts.values())),
          filter: vi.fn((fn: (a: LocalAccount) => boolean) => ({
            first: vi.fn(async () => Array.from(accounts.values()).find(fn)),
          })),
        })),
      })),
      put: vi.fn(async (account: LocalAccount) => {
        accounts.set(account.code, account)
        return account.id
      }),
      get: vi.fn(async (id: string) => accounts.get(id)),
    },
    _accounts: accounts,
  }
}

const mockDb = createMockDb()

vi.mock('@/services/local-db/dexie-instance', () => ({
  dexieDb: mockDb,
}))

describe('ensureSystemAccounts', () => {
  beforeEach(() => {
    mockDb._accounts.clear()
    vi.clearAllMocks()
  })

  it('creates all system accounts when none exist', async () => {
    const { ensureSystemAccounts } = await import('./chart-of-accounts')
    const created = await ensureSystemAccounts('tenant-1')
    expect(created.length).toBeGreaterThanOrEqual(11)
    const codes = created.map((a) => a.code)
    expect(codes).toContain('1-1100') // Kas Tunai
    expect(codes).toContain('4-1000') // Pendapatan Penjualan
    expect(codes).toContain('5-1000') // HPP
    expect(codes).toContain('6-2000') // Penyesuaian Persediaan
  })

  it('is idempotent — does not create duplicates on second call', async () => {
    const { ensureSystemAccounts } = await import('./chart-of-accounts')
    await ensureSystemAccounts('tenant-1')
    const second = await ensureSystemAccounts('tenant-1')
    expect(second).toHaveLength(0)
  })
})

describe('ensurePaymentMethodAccount', () => {
  beforeEach(() => {
    mockDb._accounts.clear()
    vi.clearAllMocks()
  })

  it('creates account for a QRIS payment method with provider', async () => {
    const { ensurePaymentMethodAccount, ensureSystemAccounts } = await import('./chart-of-accounts')
    await ensureSystemAccounts('tenant-1')

    const account = await ensurePaymentMethodAccount('tenant-1', {
      name: 'QRIS BCA',
      provider: 'BCA',
      type: 'qris',
    })

    expect(account.name).toBe('QRIS BCA')
    expect(account.type).toBe('asset')
    expect(account.code.startsWith('1-12')).toBe(true)
  })

  it('creates account for an e-wallet payment method', async () => {
    const { ensurePaymentMethodAccount, ensureSystemAccounts } = await import('./chart-of-accounts')
    await ensureSystemAccounts('tenant-1')

    const account = await ensurePaymentMethodAccount('tenant-1', {
      name: 'GoPay',
      provider: 'GoPay',
      type: 'ewallet',
    })

    expect(account.name).toBe('E-Wallet GoPay')
    expect(account.code.startsWith('1-14')).toBe(true)
  })

  it('reuses existing account for same provider', async () => {
    const { ensurePaymentMethodAccount, ensureSystemAccounts } = await import('./chart-of-accounts')
    await ensureSystemAccounts('tenant-1')

    const first = await ensurePaymentMethodAccount('tenant-1', {
      name: 'QRIS BCA',
      provider: 'BCA',
      type: 'qris',
    })
    const second = await ensurePaymentMethodAccount('tenant-1', {
      name: 'QRIS BCA',
      provider: 'BCA',
      type: 'qris',
    })

    expect(second.code).toBe(first.code)
  })

  it('maps tunai to fixed account 1-1100', async () => {
    const { ensurePaymentMethodAccount, ensureSystemAccounts } = await import('./chart-of-accounts')
    await ensureSystemAccounts('tenant-1')

    const account = await ensurePaymentMethodAccount('tenant-1', {
      name: 'Tunai',
      provider: '',
      type: 'tunai',
    })

    expect(account.code).toBe('1-1100')
    expect(account.name).toBe('Kas Tunai')
  })

  it('maps piutang to fixed account 1-3000', async () => {
    const { ensurePaymentMethodAccount, ensureSystemAccounts } = await import('./chart-of-accounts')
    await ensureSystemAccounts('tenant-1')

    const account = await ensurePaymentMethodAccount('tenant-1', {
      name: 'Piutang',
      provider: '',
      type: 'piutang',
    })

    expect(account.code).toBe('1-3000')
    expect(account.name).toBe('Piutang Usaha')
  })
})

describe('ensureCashCategoryAccount', () => {
  beforeEach(() => {
    mockDb._accounts.clear()
    vi.clearAllMocks()
  })

  it('creates revenue account for income category (Pemasukan)', async () => {
    const { ensureCashCategoryAccount, ensureSystemAccounts } = await import('./chart-of-accounts')
    await ensureSystemAccounts('tenant-1')

    const account = await ensureCashCategoryAccount('tenant-1', {
      name: 'Modal Awal',
      type: 'Pemasukan',
    })

    expect(account.name).toBe('Pendapatan Modal Awal')
    expect(account.type).toBe('revenue')
    expect(account.code.startsWith('4-90')).toBe(true)
  })

  it('creates expense account for expense category (Pengeluaran)', async () => {
    const { ensureCashCategoryAccount, ensureSystemAccounts } = await import('./chart-of-accounts')
    await ensureSystemAccounts('tenant-1')

    const account = await ensureCashCategoryAccount('tenant-1', {
      name: 'Biaya Listrik',
      type: 'Pengeluaran',
    })

    expect(account.name).toBe('Biaya Biaya Listrik')
    expect(account.type).toBe('expense')
    expect(account.code.startsWith('6-90')).toBe(true)
  })
})
