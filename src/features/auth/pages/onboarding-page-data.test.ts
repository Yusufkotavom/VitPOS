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
import { TEMPLATE_PRESETS } from '@/features/auth/data/template-data'

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
          createElement(Route, { path: '/billing', element: createElement('div', null, 'Billing Route') }),
        ),
      ),
    )

    // Step 1: Info
    expect(screen.getAllByText(/Informasi Perusahaan/)[1]).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Nama Bisnis/), { target: { value: 'Toko Baru' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))

    // Step 2: Template - default is retail
    expect(screen.getAllByText(/Pilih Template Bisnis/)[1]).toBeInTheDocument()
    expect(screen.getByText('Toko Retail')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))

    // Step 3: Customize data - shows CRUD template data
    expect(screen.getAllByText(/Sesuaikan Data Template/)[1]).toBeInTheDocument()
    const preset = TEMPLATE_PRESETS.retail
    expect(screen.getByText(preset.customer.name)).toBeInTheDocument()
    expect(screen.getByText(preset.supplier.name)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))

    // Step 4: Payment methods - pre-selected from template
    expect(screen.getAllByText(/Metode Pembayaran/)[1]).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Lanjut ke Tagihan/ }))

    expect(await screen.findByText('Billing Route')).toBeInTheDocument()
    expect(apiPostMock).toHaveBeenCalledWith('/auth/register', expect.objectContaining({ tenantName: 'Toko Baru' }))

    const state = useAuthStore.getState()
    expect(state.activeTenant?.name).toBe('Toko Baru')
    expect(state.activeTenant?.type).toBe('retail')

    // Verify seeded entities
    expect(await localDb.tenants.count()).toBe(1)
    expect(await localDb.tenantMembers.count()).toBe(1)

    const categories = await localDb.productCategories.toArray()
    expect(categories.length).toBe(preset.categories.length)
    expect(categories[0].tenantId).toBe(state.activeTenant?.id)

    const products = await localDb.products.toArray()
    expect(products.length).toBe(preset.products.length)
    expect(products[0].tenantId).toBe(state.activeTenant?.id)

    const paymentMethods = await localDb.paymentMethods.toArray()
    expect(paymentMethods.length).toBe(preset.paymentMethods.length)

    const cashCategories = await localDb.cashCategories.toArray()
    expect(cashCategories.length).toBe(preset.cashCategories.length)

    const customers = await localDb.customers.toArray()
    expect(customers.length).toBe(1)
    expect(customers[0].name).toBe(preset.customer.name)

    const suppliers = await localDb.suppliers.toArray()
    expect(suppliers.length).toBe(1)
    expect(suppliers[0].name).toBe(preset.supplier.name)
  })
})
