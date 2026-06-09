import { Link } from 'react-router-dom'
import { Building2, CreditCard, LifeBuoy, LogOut, Settings, User } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/features/auth/stores/auth-store'

export function UserMenu() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const activeTenant = useAuthStore((state) => state.activeTenant)
  const logout = useAuthStore((state) => state.logout)

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

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
