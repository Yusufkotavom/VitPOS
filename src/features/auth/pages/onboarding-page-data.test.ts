import 'fake-indexeddb/auto'

import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { OnboardingPage } from '@/features/auth/pages/onboarding-page'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

describe('onboarding page data logic', () => {
  it('creates new tenant and navigates to dashboard after 5-step wizard', async () => {
    await localDb.tenants.clear()
    await localDb.tenantMembers.clear()
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

    // Step 2: Template
    expect(screen.getAllByText(/Pilih Template Bisnis/)[1]).toBeInTheDocument()
    fireEvent.click(screen.getByText(/^Retail$/i))
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))

    // Step 3: Product setup
    expect(screen.getAllByText(/Setup Produk Awal/)[1]).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))

    // Step 4: Payment config
    expect(screen.getAllByText(/Metode Pembayaran/)[1]).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText(/QRIS/))
    fireEvent.click(screen.getByRole('button', { name: /Lanjut ke Tagihan/ }))

    expect(await screen.findByText('Billing Route')).toBeInTheDocument()

    const state = useAuthStore.getState()
    expect(state.activeTenant?.name).toBe('Toko Baru')
    expect(state.activeTenant?.type).toBe('retail')
    expect(await localDb.tenants.count()).toBe(1)
    expect(await localDb.tenantMembers.count()).toBe(1)
  })
})
