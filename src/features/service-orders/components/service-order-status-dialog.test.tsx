import { cleanup, fireEvent, render, screen, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ServiceOrderStatusDialog } from './service-order-status-dialog'
import type { LocalServiceOrder } from '@/services/local-db/schema'

const mockUpsert = vi.fn()
const mockGetCustomer = vi.fn()
const mockUpdateCustomer = vi.fn()

vi.mock('@/services/local-db/repository', () => ({
  serviceOrderRepository: {
    upsert: (order: unknown) => mockUpsert(order),
  },
}))

vi.mock('@/services/local-db/client', () => ({
  localDb: {
    customers: {
      get: (id: string) => mockGetCustomer(id),
      update: (id: string, changes: unknown) => mockUpdateCustomer(id, changes),
    },
    settings: {
      get: vi.fn().mockResolvedValue(null),
    },
  },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: unknown) =>
      typeof options === 'string' ? options : key,
  }),
}))

const sampleOrder: LocalServiceOrder = {
  id: 'order-123',
  tenantId: 'tenant-1',
  code: 'SRV-202611-001',
  date: '2026-11-20T10:00:00.000Z',
  customerId: 'cust-1',
  customerName: 'Budi Santoso',
  deviceBrand: 'Asus',
  deviceModel: 'ROG Zephyrus',
  complaint: 'Mati total setelah kena petir',
  description: 'Mati total setelah kena petir',
  paidTotal: 0,
  cost: 500000,
  status: 'Diterima',
  syncStatus: 'synced',
  version: 1,
  updatedAt: '2026-11-20T10:00:00.000Z',
  timeline: [],
}

describe('ServiceOrderStatusDialog', () => {
  let openSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    mockUpsert.mockReset()
    mockGetCustomer.mockReset()
    mockUpdateCustomer.mockReset()
    mockUpsert.mockResolvedValue(undefined)
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    cleanup()
    openSpy.mockRestore()
  })

  it('renders correctly with current status and customer information', async () => {
    render(
      <ServiceOrderStatusDialog
        open={true}
        onOpenChange={() => {}}
        order={sampleOrder}
        customerPhone="08123456789"
        totalPaid={200000}
        remaining={300000}
        onSuccess={() => {}}
      />,
    )

    expect(screen.getByText(/SRV-202611-001/i)).toBeInTheDocument()
    expect(screen.getByText(/Budi Santoso/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('08123456789')).toBeInTheDocument()
  })

  it('allows changing status and saves to repository with timeline entry', async () => {
    const onSuccess = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ServiceOrderStatusDialog
        open={true}
        onOpenChange={onOpenChange}
        order={sampleOrder}
        customerPhone="08123456789"
        totalPaid={200000}
        remaining={300000}
        onSuccess={onSuccess}
      />,
    )

    // Select status 'Dikerjakan'
    const dikerjakanBtn = screen.getByRole('button', { name: /^Dikerjakan/i })
    fireEvent.click(dikerjakanBtn)

    // Type a status note
    const noteInput = screen.getByPlaceholderText(/Contoh: Menunggu suku cadang/i)
    fireEvent.change(noteInput, { target: { value: 'Sedang proses reballing chipset' } })

    // Submit save & open WA
    const submitBtn = screen.getByRole('button', { name: /Simpan & Buka WhatsApp/i })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    expect(mockUpsert).toHaveBeenCalledTimes(1)
    const savedOrder = mockUpsert.mock.calls[0][0] as LocalServiceOrder
    expect(savedOrder.status).toBe('Dikerjakan')
    expect(savedOrder.timeline).toHaveLength(1)
    expect(savedOrder.timeline?.[0].note).toBe('Sedang proses reballing chipset')

    // WhatsApp window.open should have been called
    expect(openSpy).toHaveBeenCalledTimes(1)
    const waUrl = openSpy.mock.calls[0][0] as string
    expect(waUrl).toContain('https://wa.me/628123456789')
    expect(waUrl).toContain('SRV-202611-001')

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('allows saving without WhatsApp when toggle is unchecked', async () => {
    const onSuccess = vi.fn()

    render(
      <ServiceOrderStatusDialog
        open={true}
        onOpenChange={() => {}}
        order={sampleOrder}
        customerPhone="08123456789"
        totalPaid={200000}
        remaining={300000}
        onSuccess={onSuccess}
      />,
    )

    // Uncheck Kirim WA checkbox
    const waCheckbox = screen.getByLabelText(/Kirim WA/i)
    fireEvent.click(waCheckbox)

    const submitBtn = screen.getByRole('button', { name: /Simpan Status/i })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    expect(mockUpsert).toHaveBeenCalledTimes(1)
    expect(openSpy).not.toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('shows warranty options when target status is Selesai', async () => {
    render(
      <ServiceOrderStatusDialog
        open={true}
        onOpenChange={() => {}}
        order={sampleOrder}
        customerPhone="08123456789"
        totalPaid={500000}
        remaining={0}
        onSuccess={() => {}}
      />,
    )

    // Select status 'Selesai'
    const selesaiBtn = screen.getByRole('button', { name: /^Selesai/i })
    fireEvent.click(selesaiBtn)

    expect(screen.getByText(/Berikan Garansi Servis/i)).toBeInTheDocument()

    // Check warranty
    const warrantyCheckbox = screen.getByLabelText(/Berikan Garansi Servis/i)
    fireEvent.click(warrantyCheckbox)

    const submitBtn = screen.getByRole('button', { name: /Simpan & Buka WhatsApp/i })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    expect(mockUpsert).toHaveBeenCalledTimes(1)
    const savedOrder = mockUpsert.mock.calls[0][0] as LocalServiceOrder
    expect(savedOrder.status).toBe('Selesai')
    expect(savedOrder.hasWarranty).toBe(true)
    expect(savedOrder.warrantyEndDate).toBeDefined()
  })
})
