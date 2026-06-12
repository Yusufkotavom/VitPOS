import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { UserProfilePage } from './user-profile-page'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useSubscription } from '@/features/settings/hooks/use-subscription'

vi.mock('@/features/auth/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/features/settings/hooks/use-subscription', () => ({
  useSubscription: vi.fn(),
}))

describe('UserProfilePage', () => {
  beforeEach(() => {
    cleanup()
    vi.mocked(useAuthStore).mockReturnValue({
      currentUser: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      activeTenant: null,
      setAuth: vi.fn(),
      setActiveTenant: vi.fn(),
      isAuthenticated: () => true,
      logout: vi.fn(),
    })
    vi.mocked(useSubscription).mockReturnValue({
      planCode: 'enterprise-yearly',
      planName: 'Enterprise Tahunan',
      billingPeriod: 'yearly',
      status: 'active',
      planValidUntil: '2026-12-31T00:00:00.000Z',
      daysLeft: 120,
      isExpired: false,
      isEnforced: false,
      isExpiringSoon: false,
      warningKind: null,
    })
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  function renderPage() {
    return render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>
    )
  }

  test('renders user profile form', () => {
    renderPage()
    expect(screen.getByLabelText(/nama/i)).toHaveValue('Test User')
    expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com')
  })

  test('updates profile on submit', async () => {
    const setAuthMock = vi.fn()
    vi.mocked(useAuthStore).mockReturnValue({
      currentUser: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      activeTenant: null,
      setAuth: setAuthMock,
      setActiveTenant: vi.fn(),
      isAuthenticated: () => true,
      logout: vi.fn(),
    })

    renderPage()
    
    const nameInput = screen.getByLabelText(/nama/i)
    fireEvent.change(nameInput, { target: { value: 'New Name' } })
    
    const submitBtn = screen.getAllByRole('button', { name: /simpan/i })[0]
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(setAuthMock).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Name',
        email: 'test@example.com'
      }))
    })
  })

  test('shows live subscription summary and billing management link', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      currentUser: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      activeTenant: {
        id: 't1',
        name: 'Toko Uji',
        type: 'retail',
        phone: '',
        planCode: 'enterprise-yearly',
        billingPeriod: 'yearly',
        subscriptionStatus: 'active',
        planValidUntil: '2026-12-31T00:00:00.000Z',
        isActive: true,
        createdAt: '',
        updatedAt: '',
        role: 'owner',
      },
      setAuth: vi.fn(),
      setActiveTenant: vi.fn(),
      isAuthenticated: () => true,
      logout: vi.fn(),
    })

    renderPage()

    expect(screen.getByText('Enterprise Tahunan')).toBeInTheDocument()
    expect(screen.getByText('Aktif')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /kelola langganan/i })).toHaveAttribute('href', '/settings/billing')
  })
})
