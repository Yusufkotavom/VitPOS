import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { AuthGuard } from '@/features/auth/components/auth-guard'
import { useAuthStore } from '@/features/auth/stores/auth-store'

describe('AuthGuard', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('redirects to /login if not authenticated', () => {
    render(
      createElement(MemoryRouter, { initialEntries: ['/protected'] },
        createElement(Routes, null,
          createElement(Route, { path: '/login', element: createElement('div', null, 'Login Page') }),
          createElement(Route, { path: '/protected', element: createElement(AuthGuard, null, createElement('div', null, 'Protected Content')) }),
        ),
      ),
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to /tenants if authenticated but no active tenant and route is not /tenants or /onboarding', () => {
    useAuthStore.getState().setAuth({ id: 'u1', email: 'test', name: 'Test', passwordHash: '', createdAt: '', updatedAt: '' })

    render(
      createElement(MemoryRouter, { initialEntries: ['/protected'] },
        createElement(Routes, null,
          createElement(Route, { path: '/tenants', element: createElement('div', null, 'Tenants Page') }),
          createElement(Route, { path: '/protected', element: createElement(AuthGuard, null, createElement('div', null, 'Protected Content')) }),
        ),
      ),
    )

    expect(screen.getByText('Tenants Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('allows access to protected content when authenticated with active tenant', () => {
    useAuthStore.getState().setAuth({ id: 'u1', email: 'test', name: 'Test', passwordHash: '', createdAt: '', updatedAt: '' })
    useAuthStore.getState().setActiveTenant({ id: 't1', name: 'Tenant', type: '', phone: '', planCode: '', isActive: true, createdAt: '', updatedAt: '' }, 'owner')

    render(
      createElement(MemoryRouter, { initialEntries: ['/protected'] },
        createElement(Routes, null,
          createElement(Route, { path: '/protected', element: createElement(AuthGuard, null, createElement('div', null, 'Protected Content')) }),
        ),
      ),
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
