import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ServiceOrderDetailPage } from './service-order-detail-page'
import type { LocalServiceOrder } from '@/services/local-db/schema'

const mockOrder: LocalServiceOrder = {
  id: '69ee2f47-0dab-41ff-af58-8df4509b1d76',
  tenantId: 'tenant-1',
  code: 'SRV-202611-002',
  date: '2026-11-20T10:00:00.000Z',
  customerId: 'cust-1',
  customerName: 'Ahmad Fauzi',
  deviceBrand: 'Lenovo',
  deviceModel: 'ThinkPad T480',
  complaint: 'Keyboard beberapa tombol tidak merespon',
  description: 'Keyboard beberapa tombol tidak merespon',
  paidTotal: 0,
  cost: 450000,
  status: 'Diagnosa',
  syncStatus: 'synced',
  version: 1,
  updatedAt: '2026-11-20T10:00:00.000Z',
  timeline: [],
}

vi.mock('@/features/service-orders/hooks/use-service-order', () => ({
  useServiceOrder: () => ({
    data: mockOrder,
    isLoading: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/features/auth/stores/auth-store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth/stores/auth-store')>()
  return {
    ...actual,
    requireActiveTenantId: () => 'tenant-1',
    resolveTenantId: () => 'tenant-1',
  }
})

vi.mock('@/shared/hooks/use-live-query', () => ({
  useLiveQuery: (_query: unknown, _deps: unknown, initialValue: unknown) => initialValue ?? [],
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: unknown) => {
      if (typeof options === 'object' && options !== null && 'status' in options) {
        return `Lanjut ke ${(options as { status: string }).status}`
      }
      return key
    },
  }),
}))

describe('ServiceOrderDetailPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders order details and allows opening status dialog from Ubah Status button', () => {
    render(
      <MemoryRouter initialEntries={['/service-orders/69ee2f47-0dab-41ff-af58-8df4509b1d76']}>
        <Routes>
          <Route path="/service-orders/:id" element={<ServiceOrderDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('SRV-202611-002')).toBeInTheDocument()
    expect(screen.getByText('Ahmad Fauzi')).toBeInTheDocument()

    // Find "Ubah Status" button in actions
    const ubahStatusBtns = screen.getAllByRole('button', { name: /Ubah Status/i })
    expect(ubahStatusBtns.length).toBeGreaterThan(0)

    fireEvent.click(ubahStatusBtns[0])

    // Status dialog should open
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Select a different status in the dialog
    const dikerjakanBtn = screen.getByRole('button', { name: /^Dikerjakan/i })
    fireEvent.click(dikerjakanBtn)

    expect(screen.getByText(/Ubah Status & Kirim WhatsApp/i)).toBeInTheDocument()
  })

  it('opens the WhatsApp notification flow from the status dialog', () => {
    render(
      <MemoryRouter initialEntries={['/service-orders/69ee2f47-0dab-41ff-af58-8df4509b1d76']}>
        <Routes>
          <Route path="/service-orders/:id" element={<ServiceOrderDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const ubahStatusBtns = screen.getAllByRole('button', { name: /Ubah Status/i })
    fireEvent.click(ubahStatusBtns[0])

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Notifikasi WhatsApp Pelanggan/i)).toBeInTheDocument()

    const waToggle = screen.getByRole('checkbox', { name: /Kirim WA/i })
    fireEvent.click(waToggle)

    expect(screen.getByLabelText(/Nomor WhatsApp Pelanggan/i)).toBeInTheDocument()
  })
})
