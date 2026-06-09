import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { UserProfilePage } from './user-profile-page'
import { useAuthStore } from '@/features/auth/stores/auth-store'

vi.mock('@/features/auth/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
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
})
