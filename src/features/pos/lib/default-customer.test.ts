import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  DEFAULT_CUSTOMER_ID,
  DEFAULT_CUSTOMER_NAME,
  getDefaultCustomer,
  ensureDefaultCustomer,
} from './default-customer'
import { localDb } from '@/services/local-db/client'

vi.mock('@/services/local-db/client', () => ({
  localDb: {
    customers: {
      where: vi.fn(),
      put: vi.fn(),
    },
  },
}))

vi.mock('@/features/auth/stores/auth-store', () => ({
  resolveTenantId: vi.fn(() => 'test-tenant'),
}))

describe('default-customer lib', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getDefaultCustomer', () => {
    it('returns exact match for Pelanggan Umum if present in active customers', () => {
      const customers = [
        { id: 'c-1', name: 'Budi Santoso', status: 'Aktif' },
        { id: 'c-2', name: 'Pelanggan Umum', status: 'Aktif' },
      ]

      const result = getDefaultCustomer(customers)
      expect(result).toEqual({ id: 'c-2', name: 'Pelanggan Umum' })
    })

    it('matches Pelanggan Umum case-insensitively and with whitespace', () => {
      const customers = [
        { id: 'c-10', name: '  pelanggan umum  ', status: 'Aktif' },
      ]

      const result = getDefaultCustomer(customers)
      expect(result).toEqual({ id: 'c-10', name: '  pelanggan umum  ' })
    })

    it('returns partial match if a customer has umum in name', () => {
      const customers = [
        { id: 'c-1', name: 'Customer Umum Toko', status: 'Aktif' },
      ]

      const result = getDefaultCustomer(customers)
      expect(result).toEqual({ id: 'c-1', name: 'Customer Umum Toko' })
    })

    it('ignores non-active customers when searching for match', () => {
      const customers = [
        { id: 'c-1', name: 'Pelanggan Umum', status: 'Nonaktif' },
      ]

      const result = getDefaultCustomer(customers)
      expect(result).toEqual({ id: DEFAULT_CUSTOMER_ID, name: DEFAULT_CUSTOMER_NAME })
    })

    it('falls back to default Pelanggan Umum if active customers list is empty or none match', () => {
      expect(getDefaultCustomer([])).toEqual({
        id: DEFAULT_CUSTOMER_ID,
        name: DEFAULT_CUSTOMER_NAME,
      })

      const customers = [
        { id: 'c-1', name: 'Budi Santoso', status: 'Aktif' },
      ]
      expect(getDefaultCustomer(customers)).toEqual({
        id: DEFAULT_CUSTOMER_ID,
        name: DEFAULT_CUSTOMER_NAME,
      })
    })
  })

  describe('ensureDefaultCustomer', () => {
    it('returns existing Pelanggan Umum from DB if found', async () => {
      const existing = [
        {
          id: 'existing-umum-id',
          tenantId: 'test-tenant',
          name: 'Pelanggan Umum',
          status: 'Aktif',
        },
      ]
      vi.mocked(localDb.customers.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(existing),
        }),
      } as unknown as ReturnType<typeof localDb.customers.where>)

      const customer = await ensureDefaultCustomer('test-tenant')
      expect(customer.id).toBe('existing-umum-id')
      expect(localDb.customers.put).not.toHaveBeenCalled()
    })

    it('creates Pelanggan Umum in DB if not found', async () => {
      vi.mocked(localDb.customers.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof localDb.customers.where>)

      const customer = await ensureDefaultCustomer('test-tenant')
      expect(customer.name).toBe(DEFAULT_CUSTOMER_NAME)
      expect(customer.tenantId).toBe('test-tenant')
      expect(localDb.customers.put).toHaveBeenCalledWith(expect.objectContaining({
        name: DEFAULT_CUSTOMER_NAME,
        tenantId: 'test-tenant',
      }))
    })
  })
})
