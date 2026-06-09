import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { PlatformAdminGuard } from '@/features/auth/components/platform-admin-guard'
import { useAuthStore } from '@/features/auth/stores/auth-store'

describe('PlatformAdminGuard', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('redirects to /login when no user', () => {
    render(
      createElement(MemoryRouter, { initialEntries: ['/platform-admin'] },
        createElement(Routes, null,
          createElement(Route, { path: '/login', element: createElement('div', null, 'Login Page') }),
          createElement(Route, {
            path: '/platform-admin',
            element: createElement(PlatformAdminGuard, null, createElement('div', null, 'Platform Admin Content')),
          }),
        ),
      ),
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Platform Admin Content')).not.toBeInTheDocument()
  })

  it('redirects to / when user is not platform_admin', () => {
    useAuthStore.getState().setAuth({
      id: 'u1',
      email: 'user@toko.id',
      name: 'Regular User',
      role: 'user',
      passwordHash: '',
      createdAt: '',
      updatedAt: '',
    })

    render(
      createElement(MemoryRouter, { initialEntries: ['/platform-admin'] },
        createElement(Routes, null,
          createElement(Route, { path: '/', element: createElement('div', null, 'Home Page') }),
          createElement(Route, {
            path: '/platform-admin',
            element: createElement(PlatformAdminGuard, null, createElement('div', null, 'Platform Admin Content')),
          }),
        ),
      ),
    )

    expect(screen.getByText('Home Page')).toBeInTheDocument()
    expect(screen.queryByText('Platform Admin Content')).not.toBeInTheDocument()
  })

  it('renders children when user is platform_admin', () => {
    useAuthStore.getState().setAuth({
      id: 'a1',
      email: 'admin@kotacom.id',
      name: 'Admin',
      role: 'platform_admin',
      passwordHash: '',
      createdAt: '',
      updatedAt: '',
    })

    render(
      createElement(MemoryRouter, { initialEntries: ['/platform-admin'] },
        createElement(Routes, null,
          createElement(Route, { path: '/', element: createElement('div', null, 'Home Page') }),
          createElement(Route, {
            path: '/platform-admin',
            element: createElement(PlatformAdminGuard, null, createElement('div', null, 'Platform Admin Content')),
          }),
        ),
      ),
    )

    expect(screen.getByText('Platform Admin Content')).toBeInTheDocument()
  })
})
