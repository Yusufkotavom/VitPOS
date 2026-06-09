import 'fake-indexeddb/auto'

import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { LoginPage } from '@/features/auth/pages/login-page'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

const { apiPostMock } = vi.hoisted(() => ({
  apiPostMock: vi.fn(),
}))

vi.mock('@/services/api/client', () => ({
  apiPost: apiPostMock,
}))

describe('login page data logic', () => {
  it('authenticates via API login and redirects', async () => {
    useAuthStore.getState().logout()
    await localDb.users.clear()

    apiPostMock.mockResolvedValueOnce({
      ok: true,
      accessToken: 'dev-user-1',
      user: {
        id: 'user-1',
        email: 'owner@usaha.co.id',
        name: 'Owner',
      },
      memberships: [{
        tenantId: 'tenant-1',
        role: 'owner',
        tenantName: 'Usaha Demo',
        tenantPlan: 'trial',
      }],
    })

    render(
      createElement(MemoryRouter, { initialEntries: ['/login'] },
        createElement(Routes, null,
          createElement(Route, { path: '/login', element: createElement(LoginPage) }),
          createElement(Route, { path: '/tenants', element: createElement('div', null, 'Tenant Route') }),
        ),
      ),
    )

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'owner@usaha.co.id' } })
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByText('Tenant Route')).toBeInTheDocument()
    expect(apiPostMock).toHaveBeenCalledWith('/auth/login', {
      email: 'owner@usaha.co.id',
      password: 'password123',
    })
    expect(useAuthStore.getState().currentUser?.email).toBe('owner@usaha.co.id')
  })
})
