import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BillingPaymentQueue } from '@/features/platform-admin/components/billing-payment-queue'

describe('BillingPaymentQueue', () => {
  const approveMock = vi.fn()
  const rejectMock = vi.fn()

  beforeEach(() => {
    approveMock.mockReset()
    rejectMock.mockReset()
  })

  it('renders submitted payment and triggers approve/reject actions', async () => {
    render(
      <BillingPaymentQueue
        payments={[{
          id: 'pay-1',
          tenantId: 'tenant-1',
          invoiceId: 'inv-1',
          amount: '99000',
          method: 'manual_transfer',
          bankName: 'BCA',
          accountName: 'Toko Uji',
          proofText: 'Sudah transfer',
          status: 'submitted',
        }]}
        onApprove={approveMock}
        onReject={rejectMock}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /setujui/i }))
    expect(approveMock).toHaveBeenCalledWith('pay-1')

    fireEvent.click(screen.getByRole('button', { name: /tolak/i }))
    fireEvent.change(screen.getByPlaceholderText(/catatan penolakan/i), { target: { value: 'Nominal salah' } })
    fireEvent.click(screen.getByRole('button', { name: /kirim penolakan/i }))

    await waitFor(() => {
      expect(rejectMock).toHaveBeenCalledWith('pay-1', 'Nominal salah')
    })
  })
})
