import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PlanFormDialog } from '@/features/platform-admin/components/plan-form-dialog'

const { createPlanMock } = vi.hoisted(() => ({
  createPlanMock: vi.fn(),
}))

vi.mock('@/services/api/platform-admin.service', () => ({
  platformAdminService: {
    createPlan: createPlanMock,
    updatePlan: vi.fn(),
  },
}))

describe('PlanFormDialog', () => {
  beforeEach(() => {
    createPlanMock.mockReset()
    createPlanMock.mockResolvedValue({ ok: true, item: { id: 'plan-1' } })
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  function renderDialog() {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })

    return render(
      <QueryClientProvider client={queryClient}>
        <PlanFormDialog open plan={null} onClose={vi.fn()} onSaved={vi.fn()} />
      </QueryClientProvider>,
    )
  }

  it('submits billing fields supported by the backend plan contract', async () => {
    renderDialog()

    fireEvent.change(screen.getByLabelText(/kode paket/i), { target: { value: 'enterprise-yearly' } })
    fireEvent.change(screen.getByLabelText(/nama paket/i), { target: { value: 'Enterprise Tahunan' } })
    fireEvent.change(screen.getByLabelText(/harga bulanan/i), { target: { value: '999000' } })
    fireEvent.change(screen.getByLabelText(/harga tahunan/i), { target: { value: '9999000' } })
    fireEvent.change(screen.getByLabelText(/durasi aktif/i), { target: { value: '365' } })
    fireEvent.change(screen.getByLabelText(/trial/i), { target: { value: '14' } })
    fireEvent.change(screen.getByLabelText(/storage/i), { target: { value: '10240' } })
    fireEvent.change(screen.getByLabelText(/max cabang/i), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText(/max user/i), { target: { value: '40' } })

    fireEvent.click(screen.getByRole('combobox', { name: /periode billing/i }))
    fireEvent.click(await screen.findByText('Tahunan'))

    fireEvent.click(screen.getByRole('button', { name: /^simpan$/i }))

    await waitFor(() => {
      expect(createPlanMock).toHaveBeenCalled()
      expect(createPlanMock.mock.calls[0]?.[0]).toEqual(expect.objectContaining({
        code: 'enterprise-yearly',
        name: 'Enterprise Tahunan',
        billingPeriod: 'yearly',
        durationDays: 365,
        trialDays: 14,
        monthlyPrice: 999000,
        yearlyPrice: 9999000,
        storageLimitMb: 10240,
        maxBranches: 10,
        maxUsers: 40,
      }))
    })
  })
})
