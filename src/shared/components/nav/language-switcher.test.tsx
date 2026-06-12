import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LANGUAGE_STORAGE_KEY } from '@/lib/i18n/language'
import { LanguageSwitcher } from '@/shared/components/nav/language-switcher'

const changeLanguage = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'shared.language_switcher_label': 'Bahasa',
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

describe('LanguageSwitcher', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    localStorage.clear()
    changeLanguage.mockReset()
  })

  it('shows the active language in the trigger', () => {
    render(<LanguageSwitcher />)

    expect(screen.getByRole('button', { name: /bahasa/i })).toHaveTextContent('ID')
  })

  it('changes language and persists selection from the dropdown', () => {
    render(<LanguageSwitcher />)

    fireEvent.pointerDown(screen.getByRole('button', { name: /bahasa/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /english/i }))

    expect(changeLanguage).toHaveBeenCalledWith('en')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
  })
})
