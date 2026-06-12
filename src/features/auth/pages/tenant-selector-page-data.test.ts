import 'fake-indexeddb/auto'

import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { TenantSelectorPage } from '@/features/auth/pages/tenant-selector-page'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

describe('tenant selector page data logic', () => {
  it('renders db tenants and navigates to dashboard on select', async () => {
    await localDb.tenants.clear()
    await localDb.tenantMembers.clear()
    useAuthStore.getState().logout()
    
    // Seed user and tenant
    const userId = 'u1'
    const tenantId = 't1'
    useAuthStore.getState().setAuth({ id: userId, email: 'test', name: 'Test', passwordHash: '', createdAt: '', updatedAt: '' })

    await localDb.tenants.add({
      id: tenantId,
      name: 'Toko Db',
      type: 'Retail',
      phone: '',
      planCode: 'Pro',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    })

    await localDb.tenantMembers.add({
      id: 'm1',
      tenantId,
      userId,
      role: 'owner',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    })

    await localDb.settings.put({
      id: `${tenantId}:default-branch-id`,
      tenantId,
      area: 'System',
      setting: 'default_branch_id',
      value: 'b1',
      status: 'Aktif',
      updatedAt: new Date().toISOString(),
    })

    // Render
    render(
      createElement(MemoryRouter, { initialEntries: ['/tenants'] },
        createElement(Routes, null,
          createElement(Route, { path: '/tenants', element: createElement(TenantSelectorPage) }),
          createElement(Route, { path: '/', element: createElement('div', null, 'Dashboard Route') }),
        ),
      ),
    )

    // Expect tenant from db to render
    expect(await screen.findByText('Toko Db')).toBeInTheDocument()

    // Select
    fireEvent.click(screen.getByRole('button', { name: /Buka Usaha/i }))

    // Expect redirect and store update
    expect(await screen.findByText('Dashboard Route')).toBeInTheDocument()
    const state = useAuthStore.getState()
    expect(state.activeTenant?.name).toBe('Toko Db')
    expect(state.activeTenant?.role).toBe('owner')
  })
})
