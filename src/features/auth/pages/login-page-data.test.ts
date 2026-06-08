import 'fake-indexeddb/auto'

import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { LoginPage } from '@/features/auth/pages/login-page'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

describe('login page data logic', () => {
  it('authenticates mock owner email and redirects', async () => {
    // Clear state
    useAuthStore.getState().logout()
    await localDb.users.clear()

    // Render
    render(
      createElement(MemoryRouter, { initialEntries: ['/login'] },
        createElement(Routes, null,
          createElement(Route, { path: '/login', element: createElement(LoginPage) }),
          createElement(Route, { path: '/tenants', element: createElement('div', null, 'Tenant Route') }),
        ),
      ),
    )

    // Fill form
    const emailInput = screen.getByLabelText('Email')
    const passInput = screen.getByLabelText('Kata sandi')
    
    fireEvent.change(emailInput, { target: { value: 'owner@usaha.co.id' } })
    fireEvent.change(passInput, { target: { value: 'password123' } })

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    // Expect store update and redirect
    expect(await screen.findByText('Tenant Route')).toBeInTheDocument()
    expect(useAuthStore.getState().currentUser?.email).toBe('owner@usaha.co.id')
  })
})
