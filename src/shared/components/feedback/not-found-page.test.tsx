import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NotFoundPage } from '@/shared/components/feedback/not-found-page'

const mockNavigate = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'common.back': 'Kembali',
        'errors.not_found_code': '404',
        'errors.not_found_title': 'Halaman tidak ditemukan',
        'errors.not_found_description': 'Halaman yang Anda cari mungkin dipindahkan, dihapus, atau alamatnya salah.',
        'errors.not_found_go_dashboard': 'Ke Dashboard',
        'errors.not_found_open_pos': 'Buka POS',
      }

      return dict[key] ?? key
    },
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('NotFoundPage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it('renders the primary recovery actions', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /halaman tidak ditemukan/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ke dashboard/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /buka pos/i })).toHaveAttribute('href', '/pos')
    expect(screen.getByRole('button', { name: /kembali/i })).toBeInTheDocument()
  })

  it('falls back to dashboard when back action has no meaningful history', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /kembali/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
