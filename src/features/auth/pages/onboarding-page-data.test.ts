import 'fake-indexeddb/auto'

import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { OnboardingPage } from '@/features/auth/pages/onboarding-page'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

describe('onboarding page data logic', () => {
  it('creates new tenant and navigates to dashboard', async () => {
    await localDb.tenants.clear()
    await localDb.tenantMembers.clear()
    useAuthStore.getState().logout()
    useAuthStore.getState().setAuth({ id: 'u1', email: 'owner', name: 'Owner', passwordHash: '', createdAt: '', updatedAt: '' })

    render(
      createElement(MemoryRouter, { initialEntries: ['/onboarding'] },
        createElement(Routes, null,
          createElement(Route, { path: '/onboarding', element: createElement(OnboardingPage) }),
          createElement(Route, { path: '/', element: createElement('div', null, 'Dashboard Route') }),
        ),
      ),
    )

    fireEvent.change(screen.getByLabelText('Nama usaha'), { target: { value: 'Toko Baru' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan dan lanjut' }))

    expect(await screen.findByText('Dashboard Route')).toBeInTheDocument()

    const state = useAuthStore.getState()
    expect(state.activeTenant?.name).toBe('Toko Baru')
    expect(state.activeTenant?.role).toBe('owner')
    expect(await localDb.tenants.count()).toBe(1)
    expect(await localDb.tenantMembers.count()).toBe(1)
  })
})
