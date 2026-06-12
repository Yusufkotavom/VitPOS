import 'fake-indexeddb/auto'

import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginPage } from '@/features/auth/pages/login-page'
import { OnboardingPage } from '@/features/auth/pages/onboarding-page'
import { PostSetupChecklist } from '@/features/auth/components/onboarding/post-setup-checklist'
import { TenantSelectorPage } from '@/features/auth/pages/tenant-selector-page'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { localDb } from '@/services/local-db/client'

const { apiPostMock } = vi.hoisted(() => ({
  apiPostMock: vi.fn(),
}))

vi.mock('@/services/api/client', () => ({
  apiPost: apiPostMock,
}))

describe('auth polish behavior', () => {
  beforeEach(async () => {
    useAuthStore.getState().logout()
    await localDb.users.clear()
    await localDb.tenants.clear()
    await localDb.tenantMembers.clear()
  })

  afterEach(() => cleanup())

  it('login exposes accessible fields and submits to tenant selector with keyboard/form flow', async () => {
    apiPostMock.mockResolvedValueOnce({
      ok: true,
      accessToken: 'dev-u1',
      user: { id: 'u1', email: 'owner@usaha.co.id', name: 'Owner' },
      memberships: [{ tenantId: 't1', role: 'owner', tenantName: 'Toko Demo', tenantPlan: 'Pro' }],
    })

    render(
      createElement(MemoryRouter, { initialEntries: ['/login'] },
        createElement(Routes, null,
          createElement(Route, { path: '/login', element: createElement(LoginPage) }),
          createElement(Route, { path: '/tenants', element: createElement('div', null, 'Tenant Route') }),
        ),
      ),
    )

    expect(screen.getByText('Masuk ke Dashboard')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Kata sandi')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'owner@usaha.co.id' } })
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByText('Tenant Route')).toBeInTheDocument()
    expect(apiPostMock).toHaveBeenCalledWith('/auth/login', {
      email: 'owner@usaha.co.id',
      password: 'password123',
    })
  })

  it('tenant selector shows compact tenant cards with badges and clear actions', async () => {
    useAuthStore.getState().setAuth({ id: 'u1', email: 'owner@usaha.co.id', name: 'Owner', passwordHash: 'mock', createdAt: '', updatedAt: '' })
    await localDb.tenants.add({ id: 't1', name: 'Toko Demo', type: 'Retail', phone: '', planCode: 'Pro', isActive: true, createdAt: '', updatedAt: '' })
    await localDb.tenantMembers.add({ id: 'm1', tenantId: 't1', userId: 'u1', role: 'owner', isActive: true, createdAt: '', updatedAt: '' })

    render(createElement(MemoryRouter, null, createElement(TenantSelectorPage)))

    expect(screen.getByRole('heading', { name: 'Pilih Usaha' })).toBeInTheDocument()
    expect(screen.getByText('Tenant Aktif')).toBeInTheDocument()
    expect(await screen.findByText('Toko Demo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Buka Usaha/i })).toBeInTheDocument()
    expect(screen.getAllByText('Data sudah aman').length).toBeGreaterThan(0)
  })

  it('onboarding exposes wizard progress, accessible business field, and login action link', () => {
    render(createElement(MemoryRouter, null, createElement(OnboardingPage)))

    expect(screen.getByText('Progress Setup')).toBeInTheDocument()
    expect(screen.getByText('Pilih vertikal usaha yang paling sesuai.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Lanjut/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ke Login/i })).toBeInTheDocument()
  })

  it('shows polished post-setup checklist copy', () => {
    render(createElement(PostSetupChecklist))

    expect(screen.getByText('Checklist setelah setup')).toBeInTheDocument()
    expect(screen.getByText('Tambah 5 produk atau jasa terlaris')).toBeInTheDocument()
    expect(screen.getByText('Atur harga jual dan modal')).toBeInTheDocument()
  })

  it('dashboard adds a clear owner-facing intro label', () => {
    render(createElement(MemoryRouter, null, createElement(DashboardPage)))

    expect(screen.getByText('Dashboard usaha')).toBeInTheDocument()
  })
})
