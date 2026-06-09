import 'fake-indexeddb/auto'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BillingPage } from '@/features/auth/pages/billing-page'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

const { listPlansMock } = vi.hoisted(() => ({
  listPlansMock: vi.fn(),
}))

vi.mock('@/services/api/subscription.service', () => ({
  subscriptionService: {
    listPlans: listPlansMock,
  },
}))

describe('BillingPage', () => {
  beforeEach(async () => {
    listPlansMock.mockReset()
    await localDb.tenants.clear()
    useAuthStore.getState().logout()
    useAuthStore.getState().setAuth({ id: 'u1', email: 'owner@toko.id', name: 'Owner', passwordHash: '', createdAt: '', updatedAt: '' })
    useAuthStore.getState().setActiveTenant({
      id: 't1',
      name: 'Toko Uji',
      type: 'retail',
      phone: '',
      planCode: 'trial-monthly',
      billingPeriod: 'monthly',
      subscriptionStatus: 'trial',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    }, 'owner')

    await localDb.tenants.put({
      id: 't1',
      name: 'Toko Uji',
      type: 'retail',
      phone: '',
      planCode: 'trial-monthly',
      billingPeriod: 'monthly',
      subscriptionStatus: 'trial',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    })
  })

  function renderPage() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/billing']}>
          <Routes>
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders plans from the subscription API and updates the active tenant on selection', async () => {
    listPlansMock.mockResolvedValueOnce([
      {
        id: 'p1',
        code: 'starter-monthly',
        name: 'Starter Bulanan',
        billingPeriod: 'monthly',
        durationDays: 30,
        trialDays: 0,
        monthlyPrice: '149000',
        yearlyPrice: null,
        storageLimitMb: 2048,
        maxBranches: 2,
        maxUsers: 5,
        features: {},
        isActive: true,
      },
      {
        id: 'p2',
        code: 'enterprise-yearly',
        name: 'Enterprise Tahunan',
        billingPeriod: 'yearly',
        durationDays: 365,
        trialDays: 14,
        monthlyPrice: '999000',
        yearlyPrice: '9999000',
        storageLimitMb: 10240,
        maxBranches: 10,
        maxUsers: 40,
        features: {},
        isActive: true,
      },
    ])

    renderPage()

    expect(await screen.findByText('Starter Bulanan')).toBeInTheDocument()
    expect(screen.getByText('Enterprise Tahunan')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: /pilih paket/i })[0])

    await waitFor(() => {
      expect(useAuthStore.getState().activeTenant?.planCode).toBe('starter-monthly')
      expect(useAuthStore.getState().activeTenant?.billingPeriod).toBe('monthly')
    })

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
  })
})
