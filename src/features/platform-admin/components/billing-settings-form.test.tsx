import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BillingSettingsForm } from '@/features/platform-admin/components/billing-settings-form'

describe('BillingSettingsForm', () => {
  const submitMock = vi.fn()

  beforeEach(() => {
    submitMock.mockReset()
  })

  it('submits support and bank account settings', async () => {
    render(
      <BillingSettingsForm
        settings={{ supportWhatsapp: '', supportUrl: '', supportText: '', paymentInstructions: '', bankAccounts: [] }}
        onSubmit={submitMock}
      />,
    )

    fireEvent.change(screen.getByLabelText(/whatsapp support/i), { target: { value: '6281234567890' } })
    fireEvent.change(screen.getByLabelText(/url support/i), { target: { value: 'https://wa.me/6281234567890' } })
    fireEvent.change(screen.getByLabelText(/teks support/i), { target: { value: 'Hubungi WA admin.' } })
    fireEvent.change(screen.getByLabelText(/instruksi pembayaran/i), { target: { value: 'Transfer lalu upload bukti.' } })
    fireEvent.change(screen.getByLabelText(/rekening bank/i), { target: { value: '[{"bankName":"BCA","accountName":"PT Toko","accountNumber":"123"}]' } })

    fireEvent.click(screen.getByRole('button', { name: /simpan pengaturan billing/i }))

    await waitFor(() => {
      expect(submitMock).toHaveBeenCalledWith(expect.objectContaining({
        supportWhatsapp: '6281234567890',
        supportUrl: 'https://wa.me/6281234567890',
        supportText: 'Hubungi WA admin.',
        paymentInstructions: 'Transfer lalu upload bukti.',
        bankAccounts: [{ bankName: 'BCA', accountName: 'PT Toko', accountNumber: '123' }],
      }))
    })
  })
})
