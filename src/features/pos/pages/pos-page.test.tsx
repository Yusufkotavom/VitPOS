import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PosPage } from './pos-page'
import { usePosStore } from '@/features/pos/stores/pos-store'
import type { PosProduct } from '@/features/pos/types/pos.types'

const mockUseCustomers = vi.fn(() => [
  {
    id: 'cust-seeded-1',
    tenantId: 'tenant-1',
    name: 'Pelanggan Umum',
    phone: '081234567890',
    status: 'Aktif',
    receivable: 0,
    orders: 0,
  },
])

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: unknown) =>
      typeof options === 'string' ? options : key,
  }),
}))

vi.mock('@/features/customers/hooks/use-customers', () => ({
  useCustomers: () => mockUseCustomers(),
}))

vi.mock('@/features/sync/stores/sync-store', () => ({
  useSyncStore: () => ({ pendingCount: 0 }),
}))

vi.mock('@/features/pos/components/category-tabs', () => ({
  CategoryTabs: () => <div data-testid="category-tabs" />,
}))

vi.mock('@/features/pos/components/product-search', () => ({
  ProductSearch: () => <div data-testid="product-search" />,
}))

vi.mock('@/features/pos/components/product-grid', () => ({
  ProductGrid: () => <div data-testid="product-grid" />,
}))

vi.mock('@/features/pos/components/cart-panel', () => ({
  CartPanel: () => <div data-testid="cart-panel" />,
}))

vi.mock('@/features/pos/components/pos-customer-select', () => ({
  PosCustomerSelect: () => <div data-testid="pos-customer-select" />,
}))

vi.mock('@/features/pos/components/payment-summary', () => ({
  PaymentSummary: () => <div data-testid="payment-summary" />,
}))

vi.mock('@/hooks/use-media-query', () => ({
  useMediaQuery: () => true, // Desktop
}))

const sampleProduct: PosProduct = {
  id: 'p-1',
  sku: 'SKU-001',
  name: 'Kopi Susu',
  category: 'Minuman',
  price: 15000,
  stock: 10,
  unit: 'pcs',
  isFavorite: false,
}

describe('PosPage default customer behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePosStore.setState({
      cartItems: [],
      discount: 0,
      paidAmount: 0,
      customerId: null,
      customerName: null,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('falls back to default seed customer automatically when clicking pay with empty customer', () => {
    // Add item to cart first so Pay button is enabled on render
    usePosStore.getState().addItem(sampleProduct)

    // Explicitly set customer to empty
    usePosStore.getState().setCustomer(null, '')
    expect(usePosStore.getState().customerName).toBe('')

    render(
      <MemoryRouter>
        <PosPage />
      </MemoryRouter>,
    )

    // Find and click the desktop Pay button
    const payButtons = screen.getAllByRole('button', { name: /Bayar|pos\.submit_payment/i })
    fireEvent.click(payButtons[0])

    // Customer should have automatically defaulted to Pelanggan Umum
    expect(usePosStore.getState().customerName).toBe('Pelanggan Umum')
    expect(usePosStore.getState().customerId).toBe('cust-seeded-1')

    // Payment dialog should be open
    expect(screen.getByTestId('payment-summary')).toBeInTheDocument()
  })
})
