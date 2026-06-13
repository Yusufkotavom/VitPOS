import { Link } from 'react-router-dom'
import { Building2, Check, CreditCard, Languages, LifeBuoy, LogOut, MonitorCog, Moon, Settings, Sun, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/theme-provider'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { persistLanguage, type SupportedLanguage } from '@/lib/i18n/language'

type ThemeOption = 'light' | 'dark' | 'system'

const LANGUAGES: SupportedLanguage[] = ['id', 'en']
const THEMES: Array<{ value: ThemeOption; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Terang', icon: Sun },
  { value: 'dark', label: 'Gelap', icon: Moon },
  { value: 'system', label: 'Sistem', icon: MonitorCog },
]

export function UserMenu() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const currentUser = useAuthStore((state) => state.currentUser)
  const activeTenant = useAuthStore((state) => state.activeTenant)
  const logout = useAuthStore((state) => state.logout)
  const currentLanguage: SupportedLanguage = i18n.language === 'en' ? 'en' : 'id'

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  const handleLanguageChange = (language: SupportedLanguage) => {
    persistLanguage(language)
    void i18n.changeLanguage(language)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-8 rounded-full p-0">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">{currentUser?.name ?? 'Pengguna'}</p>
            <p className="text-xs leading-none text-muted-foreground">{activeTenant?.name ?? 'Belum ada toko'}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/settings/profile" className="cursor-pointer">
              <User className="mr-2 size-4" />
              Profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings" className="cursor-pointer">
              <Settings className="mr-2 size-4" />
              Pengaturan
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings/company" className="cursor-pointer">
              <Building2 className="mr-2 size-4" />
              Info Toko
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Languages className="mr-2 size-4" />
              Bahasa
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
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
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Sun className="mr-2 size-4" />
              Tema
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {THEMES.map((themeOption) => {
                const ThemeIcon = themeOption.icon
                const isActive = theme === themeOption.value

                return (
                  <DropdownMenuItem key={themeOption.value} onClick={() => setTheme(themeOption.value)} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <ThemeIcon className="size-4" />
                      {themeOption.label}
                    </span>
                    {isActive ? <Check className="size-4 text-primary" /> : null}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings/billing" className="cursor-pointer">
            <CreditCard className="mr-2 size-4" />
            Langganan
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/help" className="cursor-pointer">
            <LifeBuoy className="mr-2 size-4" />
            Bantuan
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 size-4" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
