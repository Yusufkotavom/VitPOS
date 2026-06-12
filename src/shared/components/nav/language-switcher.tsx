import { Check, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { persistLanguage, type SupportedLanguage } from '@/lib/i18n/language'

const LANGUAGES: SupportedLanguage[] = ['id', 'en']

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const currentLanguage: SupportedLanguage = i18n.language === 'en' ? 'en' : 'id'

  const handleLanguageChange = (language: SupportedLanguage) => {
    persistLanguage(language)
    void i18n.changeLanguage(language)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" aria-label={t('shared.language_switcher_label')}>
          <Languages className="size-4" />
          <span className="text-xs font-semibold uppercase">{currentLanguage.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {LANGUAGES.map((language) => {
          const label = t(language === 'id' ? 'shared.language_id' : 'shared.language_en')
          const isActive = currentLanguage === language

          return (
            <DropdownMenuItem key={language} onClick={() => handleLanguageChange(language)} className="flex items-center justify-between gap-3">
              <span>{label}</span>
              {isActive ? <Check className="size-4 text-primary" /> : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
