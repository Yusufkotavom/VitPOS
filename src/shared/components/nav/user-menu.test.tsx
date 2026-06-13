import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/stores/auth-store'
import { LANGUAGE_STORAGE_KEY } from '@/lib/i18n/language'
import { UserMenu } from '@/shared/components/nav/user-menu'

const changeLanguage = vi.fn()
const setTheme = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'shared.language_id': 'Bahasa Indonesia',
        'shared.language_en': 'English',
      }
      return dict[key] ?? key
    },
    i18n: {
      language: 'id',
      changeLanguage,
    },
  }),
}))

vi.mock('@/components/theme-provider', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme,
  }),
}))

describe('UserMenu', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    localStorage.clear()
    changeLanguage.mockReset()
    setTheme.mockReset()
    useAuthStore.setState({
      currentUser: { id: 'u1', email: 'owner@usaha.co.id', name: 'Owner Toko', passwordHash: '', createdAt: '', updatedAt: '' },
      activeTenant: { id: 't1', name: 'Toko Demo', type: 'Retail', phone: '', planCode: 'Pro', isActive: true, createdAt: '', updatedAt: '', role: 'owner' },
    })
  })

  it('shows language and theme controls inside avatar menu', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>,
    )

    fireEvent.pointerDown(screen.getByRole('button'))

    expect(screen.getByRole('menuitem', { name: /bahasa/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /tema/i })).toBeInTheDocument()
  })

  it('changes language from avatar menu', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>,
    )

    fireEvent.pointerDown(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('menuitem', { name: /bahasa/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /english/i }))

    expect(changeLanguage).toHaveBeenCalledWith('en')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
  })

  it('changes theme from avatar menu', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>,
    )

    fireEvent.pointerDown(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('menuitem', { name: /tema/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /gelap/i }))

    expect(setTheme).toHaveBeenCalledWith('dark')
  })
})
