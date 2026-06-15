import 'fake-indexeddb/auto'

import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { apiPostMock } = vi.hoisted(() => ({
  apiPostMock: vi.fn(async () => ({
    ok: true,
    user: { id: '11111111-1111-4111-8111-111111111111', email: 'budi@toko.id', name: 'Budi' },
    defaultBranchId: '33333333-3333-4333-8333-333333333333',
    defaultWarehouseId: '44444444-4444-4444-8444-444444444444',
    memberships: [{ tenantId: '22222222-2222-4222-8222-222222222222', role: 'owner', tenantName: 'Toko Regis', tenantPlan: 'trial' }],
  })),
}))

vi.mock('@/services/api/client', () => ({ apiPost: apiPostMock }))

import { OnboardingPage } from '@/features/auth/pages/onboarding-page'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

function renderOnboarding() {
  return render(createElement(MemoryRouter, { initialEntries: ['/onboarding'] }, createElement(Routes, null, createElement(Route, { path: '/onboarding', element: createElement(OnboardingPage) }), createElement(Route, { path: '/dashboard', element: createElement('div', null, 'Dashboard Route') }))))
}

afterEach(() => {
  cleanup()
})

describe('onboarding registration flow', () => {
  it('shows vertical, mode, and review steps for atk printing onboarding', () => {
    renderOnboarding()
    expect(screen.getAllByText('Pilih jenis usaha')[0]).toBeInTheDocument()
    expect(screen.getAllByText('ATK & Printing')[0]).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Lanjut' }).at(-1)!)
    expect(screen.getAllByText('Pilih model usaha')[0]).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Gabungan ATK \+ Printing/ }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Lanjut' }).at(-1)!)
    expect(screen.getAllByText('Data inti usaha')[0]).toBeInTheDocument()
  })

  it('creates owner user + tenant when no authenticated user exists', async () => {
    apiPostMock.mockReset()
    apiPostMock.mockResolvedValueOnce({ ok: true, user: { id: '11111111-1111-4111-8111-111111111111', email: 'budi@toko.id', name: 'Budi' }, defaultBranchId: '33333333-3333-4333-8333-333333333333', defaultWarehouseId: '44444444-4444-4444-8444-444444444444', memberships: [{ tenantId: '22222222-2222-4222-8222-222222222222', role: 'owner', tenantName: 'Toko Regis', tenantPlan: 'trial' }] })

    useAuthStore.getState().logout()
    await localDb.users.clear(); await localDb.tenants.clear(); await localDb.tenantMembers.clear()
    renderOnboarding()

    fireEvent.click(screen.getAllByRole('button', { name: 'Lanjut' }).at(-1)!)
    fireEvent.click(screen.getByRole('button', { name: /Gabungan ATK \+ Printing/ }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Lanjut' }).at(-1)!)
    fireEvent.change(screen.getByLabelText(/Nama owner/), { target: { value: 'Budi' } })
    fireEvent.change(screen.getByLabelText(/Email owner/), { target: { value: 'budi@toko.id' } })
    fireEvent.change(screen.getByLabelText(/Kata sandi owner/), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/Nama usaha/), { target: { value: 'Toko Regis' } })
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp/), { target: { value: '081234567890' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Lanjut' }).at(-1)!)
    fireEvent.click(screen.getAllByRole('button', { name: 'Lanjut' }).at(-1)!)
    fireEvent.click(screen.getByRole('button', { name: /Masuk dan mulai transaksi/i }))

    expect(await screen.findByText('Dashboard Route')).toBeInTheDocument()
    expect(useAuthStore.getState().currentUser?.email).toBe('budi@toko.id')
    expect(apiPostMock).toHaveBeenCalledWith('/auth/register', expect.objectContaining({ tenantName: 'Toko Regis' }))
  })

  it('falls back to /auth/login when /auth/register returns 409 email already registered', async () => {
    apiPostMock.mockReset()
    apiPostMock.mockImplementationOnce(async () => { throw new Error('Email already registered') })
    apiPostMock.mockImplementationOnce(async () => ({ ok: true, user: { id: '99999999-9999-4999-8999-999999999999', email: 'sudah@ada.id', name: 'Sudah Ada' }, defaultBranchId: '77777777-7777-4777-8777-777777777777', defaultWarehouseId: '66666666-6666-4666-8666-666666666666', memberships: [{ tenantId: '88888888-8888-4888-8888-888888888888', role: 'owner', tenantName: 'Toko Lama', tenantPlan: 'trial' }] }))

    useAuthStore.getState().logout()
    await localDb.users.clear(); await localDb.tenants.clear(); await localDb.tenantMembers.clear()
    renderOnboarding()

    fireEvent.click(screen.getAllByRole('button', { name: 'Lanjut' }).at(-1)!)
    fireEvent.click(screen.getByRole('button', { name: /Gabungan ATK \+ Printing/ }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Lanjut' }).at(-1)!)
    fireEvent.change(screen.getByLabelText(/Nama owner/), { target: { value: 'Sudah Ada' } })
    fireEvent.change(screen.getByLabelText(/Email owner/), { target: { value: 'sudah@ada.id' } })
    fireEvent.change(screen.getByLabelText(/Kata sandi owner/), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/Nama usaha/), { target: { value: 'Toko Lama' } })
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp/), { target: { value: '081234567890' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Lanjut' }).at(-1)!)
    fireEvent.click(screen.getAllByRole('button', { name: 'Lanjut' }).at(-1)!)
    fireEvent.click(screen.getByRole('button', { name: /Masuk dan mulai transaksi/i }))

    expect(await screen.findByText('Dashboard Route')).toBeInTheDocument()
    await vi.waitFor(() => expect(apiPostMock).toHaveBeenCalledWith('/auth/login', expect.objectContaining({ email: 'sudah@ada.id', password: 'password123' })))
  })
})
