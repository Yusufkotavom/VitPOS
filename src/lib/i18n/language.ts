export const LANGUAGE_STORAGE_KEY = 'vitpos-language'

export type SupportedLanguage = 'id' | 'en'

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['id', 'en']

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return value === 'id' || value === 'en'
}

export function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') {
    return 'id'
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return isSupportedLanguage(stored) ? stored : 'id'
}

export function persistLanguage(language: SupportedLanguage) {
  if (typeof window === 'undefined') {
    return
  }

  if (SUPPORTED_LANGUAGES.includes(language)) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }
}
