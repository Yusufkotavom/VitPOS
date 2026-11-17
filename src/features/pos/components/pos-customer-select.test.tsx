import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PosCustomerSelect } from './pos-customer-select'
import { usePosStore } from '@/features/pos/stores/pos-store'
import type { LocalCustomer } from '@/services/local-db/schema'

const mockUseCustomers = vi.fn<() => LocalCustomer[]>()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}))

vi.mock('@/features/customers/hooks/use-customers', () => ({
  useCustomers: () => mockUseCustomers(),
}))

vi.mock('@/features/pos/lib/default-customer', async () => {
  const actual = await vi.importActual<typeof import('@/features/pos/lib/default-customer')>(
    '@/features/pos/lib/default-customer',
  )
  return {
    ...actual,
    ensureDefaultCustomer: vi.fn().mockResolvedValue({
      id: 'default-customer-umum',
      name: 'Pelanggan Umum',
    }),
  }
})

describe('PosCustomerSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePosStore.setState({
      customerId: null,
      customerName: null,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('automatically sets default customer (Pelanggan Umum) on mount when store customer is empty', () => {
    mockUseCustomers.mockReturnValue([
      {
        id: 'cust-seeded-1',
        tenantId: 'tenant-1',
        name: 'Pelanggan Umum',
        phone: '081234567890',
        city: 'Surabaya',
        receivable: 0,
        orders: 0,
        status: 'Aktif',
        syncStatus: 'synced',
        version: 1,
        updatedAt: '',
      },
    ])

    render(<PosCustomerSelect />)

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('Pelanggan Umum')
    expect(usePosStore.getState().customerName).toBe('Pelanggan Umum')
    expect(usePosStore.getState().customerId).toBe('cust-seeded-1')
  })

  it('restores default seed customer on blur if user clears the input', () => {
    mockUseCustomers.mockReturnValue([
      {
        id: 'cust-seeded-1',
        tenantId: 'tenant-1',
        name: 'Pelanggan Umum',
        phone: '081234567890',
        city: 'Surabaya',
        receivable: 0,
        orders: 0,
        status: 'Aktif',
        syncStatus: 'synced',
        version: 1,
        updatedAt: '',
      },
    ])

    render(<PosCustomerSelect />)

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('Pelanggan Umum')

    // User focuses and clears the text
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '' } })
    expect(usePosStore.getState().customerName).toBe('')

    // User blurs the input -> auto fallback to default
    fireEvent.blur(input)
    expect(usePosStore.getState().customerName).toBe('Pelanggan Umum')
    expect(input.value).toBe('Pelanggan Umum')
  })

  it('allows selecting a custom or different customer from list', () => {
    mockUseCustomers.mockReturnValue([
      {
        id: 'cust-seeded-1',
        tenantId: 'tenant-1',
        name: 'Pelanggan Umum',
        phone: '081234567890',
        city: 'Surabaya',
        receivable: 0,
        orders: 0,
        status: 'Aktif',
        syncStatus: 'synced',
        version: 1,
        updatedAt: '',
      },
      {
        id: 'cust-2',
        tenantId: 'tenant-1',
        name: 'Budi Santoso',
        phone: '081234567899',
        city: 'Surabaya',
        receivable: 0,
        orders: 0,
        status: 'Aktif',
        syncStatus: 'synced',
        version: 1,
        updatedAt: '',
      },
    ])

    render(<PosCustomerSelect />)

    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Budi Santoso' } })

    expect(usePosStore.getState().customerName).toBe('Budi Santoso')
    expect(usePosStore.getState().customerId).toBe('cust-2')
  })
})
