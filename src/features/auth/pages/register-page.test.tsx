import 'fake-indexeddb/auto'

import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { apiGetMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(async () => ({ ok: true, exists: false })),
}))

vi.mock('@/services/api/client', () => ({
  apiGet: apiGetMock,
}))

import { RegisterPage } from '@/features/auth/pages/register-page'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

function renderRegister() {
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: ['/register'] },
      createElement(
        Routes,
        null,
        createElement(Route, { path: '/register', element: createElement(RegisterPage) }),
        createElement(Route, { path: '/onboarding', element: createElement('div', null, 'Onboarding Page Route') }),
      ),
    ),
  )
}

afterEach(() => {
  cleanup()
})

describe('RegisterPage', () => {
  it('clears previous token/session and navigates to onboarding on successful sign up', async () => {
    await localDb.users.clear()

    // Simulate an existing session from a previous user/demo account
    useAuthStore.setState({
      currentUser: {
        id: 'old-user-id',
        name: 'Old User',
        email: 'old@kotacom.id',
        passwordHash: 'hash',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token: 'old-jwt-token-from-previous-session',
      activeTenant: {
        id: 'old-tenant-id',
        name: 'Old Tenant',
        type: 'Retail',
        phone: '',
        planCode: 'starter',
        role: 'owner',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })

    renderRegister()

    fireEvent.change(screen.getByLabelText(/Nama Lengkap/i), { target: { value: 'User Baru' } })
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'userbaru@usaha.id' } })
    fireEvent.change(screen.getByLabelText(/Kata sandi/i), { target: { value: 'password123' } })

    fireEvent.click(screen.getByRole('button', { name: /Daftar/i }))

    expect(await screen.findByText('Onboarding Page Route')).toBeInTheDocument()

    const authState = useAuthStore.getState()
    // Ensure currentUser is updated to new user
    expect(authState.currentUser?.email).toBe('userbaru@usaha.id')
    // Ensure previous session token was NOT leaked
    expect(authState.token).toBeNull()
    // Ensure previous session activeTenant was NOT leaked
    expect(authState.activeTenant).toBeNull()
  })

  it('rejects sign up if email already exists in cloud API', async () => {
    apiGetMock.mockResolvedValueOnce({ ok: true, exists: true })

    renderRegister()

    fireEvent.change(screen.getByLabelText(/Nama Lengkap/i), { target: { value: 'User Lama' } })
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'sudahada@kotacom.id' } })
    fireEvent.change(screen.getByLabelText(/Kata sandi/i), { target: { value: 'password123' } })

    fireEvent.click(screen.getByRole('button', { name: /Daftar/i }))

    expect(await screen.findByText(/Email sudah terdaftar di sistem cloud/i)).toBeInTheDocument()
    expect(screen.queryByText('Onboarding Page Route')).not.toBeInTheDocument()
  })
})
