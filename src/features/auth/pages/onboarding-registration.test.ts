import 'fake-indexeddb/auto'

import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { OnboardingPage } from '@/features/auth/pages/onboarding-page'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

describe('onboarding registration flow', () => {
  it('creates owner user + tenant when no authenticated user exists', async () => {
    useAuthStore.getState().logout()
    await localDb.users.clear()
    await localDb.tenants.clear()
    await localDb.tenantMembers.clear()

    render(
      createElement(MemoryRouter, { initialEntries: ['/onboarding'] },
        createElement(Routes, null,
          createElement(Route, { path: '/onboarding', element: createElement(OnboardingPage) }),
          createElement(Route, { path: '/', element: createElement('div', null, 'Dashboard Route') }),
        ),
      ),
    )

    expect(screen.getAllByText(/Informasi Perusahaan/)[1]).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Nama owner/), { target: { value: 'Budi' } })
    fireEvent.change(screen.getByLabelText(/Email owner/), { target: { value: 'budi@toko.id' } })
    fireEvent.change(screen.getByLabelText(/Kata sandi owner/), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/Nama Bisnis/), { target: { value: 'Toko Regis' } })
    
    // Quick skip through wizard for registration test
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' })) // temp
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' })) // prod
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' })) // pay
    fireEvent.click(screen.getByRole('button', { name: 'Selesai & Mulai Jualan' })) // sub

    expect(await screen.findByText('Dashboard Route')).toBeInTheDocument()
    expect(useAuthStore.getState().currentUser?.email).toBe('budi@toko.id')
    expect(await localDb.users.count()).toBe(1)
    expect(await localDb.tenants.count()).toBe(1)
    expect(await localDb.tenantMembers.count()).toBe(1)
  })
})
