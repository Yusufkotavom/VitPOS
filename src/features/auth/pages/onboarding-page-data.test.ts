import 'fake-indexeddb/auto'

import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const { apiPostMock } = vi.hoisted(() => ({
  apiPostMock: vi.fn(async () => ({
  ok: true,
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'owner',
    name: 'Owner',
  },
  defaultBranchId: '33333333-3333-4333-8333-333333333333',
  defaultWarehouseId: '44444444-4444-4444-8444-444444444444',
  memberships: [{
    tenantId: '22222222-2222-4222-8222-222222222222',
    role: 'owner',
    tenantName: 'Toko Baru',
    tenantPlan: 'trial',
  }],
  })),
}))

vi.mock('@/services/api/client', () => ({
  apiPost: apiPostMock,
}))

import { OnboardingPage } from '@/features/auth/pages/onboarding-page'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'
import { buildAtkPrintingSeed } from '@/services/local-db/seed-playbooks'

describe('onboarding page data logic', () => {
  it('creates tenant + seeded entities from template on finish', async () => {
    await localDb.tenants.clear()
    await localDb.tenantMembers.clear()
    await localDb.productCategories.clear()
    await localDb.products.clear()
    await localDb.paymentMethods.clear()
    await localDb.cashCategories.clear()
    await localDb.customers.clear()
    await localDb.suppliers.clear()
    useAuthStore.getState().logout()
    useAuthStore.getState().setAuth({ id: 'u1', email: 'owner', name: 'Owner', passwordHash: '', createdAt: '', updatedAt: '' })

    render(
      createElement(MemoryRouter, { initialEntries: ['/onboarding'] },
        createElement(Routes, null,
          createElement(Route, { path: '/onboarding', element: createElement(OnboardingPage) }),
          createElement(Route, { path: '/dashboard', element: createElement('div', null, 'Dashboard Route') }),
        ),
      ),
    )

    // Step 1: pilih vertikal usaha
    expect(screen.getAllByText('Pilih jenis usaha')[0]).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))

    // Step 2: pilih model usaha ATK & printing
    expect(screen.getAllByText('Pilih model usaha')[0]).toBeInTheDocument()
    expect(screen.getByText('Gabungan ATK + Printing')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Gabungan ATK \+ Printing/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))

    // Step 3: data inti usaha
    expect(screen.getAllByText('Data inti usaha')[0]).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Nama usaha/), { target: { value: 'Toko Baru' } })
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp/), { target: { value: '081234567890' } })
    const seed = buildAtkPrintingSeed({
      tenantId: 'tenant-preview',
      businessMode: 'atk_printing_combo',
      tenantName: 'Preview',
      ownerName: 'Preview Owner',
      city: 'Surabaya',
      initialCash: 500000,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))

    // Step 4-5: review and finish
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
    expect(screen.getAllByText('Review setup')[0]).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Masuk dan mulai transaksi/i }))

    expect(await screen.findByText('Dashboard Route')).toBeInTheDocument()
    expect(apiPostMock).toHaveBeenCalledWith('/auth/register', expect.objectContaining({ tenantName: 'Toko Baru' }))

    const state = useAuthStore.getState()
    expect(state.activeTenant?.name).toBe('Toko Baru')
    expect(state.activeTenant?.type).toBe('atk_printing_combo')

    // Verify seeded entities
    expect(await localDb.tenants.count()).toBe(1)
    expect(await localDb.tenantMembers.count()).toBe(1)

    const categories = await localDb.productCategories.toArray()
    expect(categories.length).toBe(seed.categories.length)
    expect(categories[0].tenantId).toBe(state.activeTenant?.id)

    const products = await localDb.products.toArray()
    expect(products.length).toBe(seed.products.length)
    expect(products[0].tenantId).toBe(state.activeTenant?.id)

    const paymentMethods = await localDb.paymentMethods.toArray()
    expect(paymentMethods.length).toBe(seed.paymentMethods.length)

    const cashCategories = await localDb.cashCategories.toArray()
    expect(cashCategories.length).toBe(seed.cashCategories.length)

    const customers = await localDb.customers.toArray()
    expect(customers.length).toBe(1)
    expect(customers[0].name).toBe(seed.customers[0].name)

    const suppliers = await localDb.suppliers.toArray()
    expect(suppliers.length).toBe(1)
    expect(suppliers[0].name).toBe(seed.suppliers[0].name)
  })
})
