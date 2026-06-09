import 'fake-indexeddb/auto'

import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { LoginPage } from '@/features/auth/pages/login-page'
import { OnboardingPage } from '@/features/auth/pages/onboarding-page'
import { TenantSelectorPage } from '@/features/auth/pages/tenant-selector-page'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

describe('auth polish behavior', () => {
  beforeEach(async () => {
    useAuthStore.getState().logout()
    await localDb.users.clear()
    await localDb.tenants.clear()
    await localDb.tenantMembers.clear()
  })

  afterEach(() => cleanup())

  it('login exposes accessible fields and submits to tenant selector with keyboard/form flow', async () => {
    await localDb.users.add({ id: 'u1', email: 'owner@usaha.co.id', name: 'Owner', passwordHash: 'password123', createdAt: '', updatedAt: '' })

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
    expect(screen.getByLabelText('Nama Bisnis')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Lanjut/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ke Login/i })).toBeInTheDocument()
  })
})
