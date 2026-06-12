import { beforeEach, describe, expect, it } from 'vitest'

import { getInitialLanguage, isSupportedLanguage, LANGUAGE_STORAGE_KEY, persistLanguage } from '@/lib/i18n/language'

describe('i18n language helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns stored supported language', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en')

    expect(getInitialLanguage()).toBe('en')
  })

  it('falls back to id when stored language is invalid', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'jp')

    expect(getInitialLanguage()).toBe('id')
  })

  it('detects supported languages correctly', () => {
    expect(isSupportedLanguage('id')).toBe(true)
    expect(isSupportedLanguage('en')).toBe(true)
    expect(isSupportedLanguage('fr')).toBe(false)
  })

  it('persists selected language', () => {
    persistLanguage('en')

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
  })
})
