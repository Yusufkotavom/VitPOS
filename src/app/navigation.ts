import {
  BarChart3,
  Boxes,
  ClipboardList,
  Home,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { TFunction } from 'i18next'

export type NavigationItem = {
  to: string
  label: string
  icon: LucideIcon
}

export type SidebarNavigationItem = NavigationItem & {
  items?: NavigationItem[]
}

export type SidebarNavigationGroup = {
  key: string
  group: string
  items: SidebarNavigationItem[]
}

export function sidebarNavigation(t: TFunction): SidebarNavigationGroup[] {
  return [
    {
      key: 'utama',
      group: t('nav.group_utama'),
      items: [
        { to: '/', label: t('nav.dashboard'), icon: Home },
        { to: '/pos', label: t('nav.pos'), icon: ShoppingCart },
        { to: '/shift', label: t('nav.shift_kasir'), icon: Wallet },
      ],
    },
    {
      key: 'operasional',
      group: 'Operasional',
      items: [
        { to: '/sales-orders', label: t('nav.sales_orders'), icon: ClipboardList },
        { to: '/service-orders', label: t('nav.service_order'), icon: Wrench },
        { to: '/products', label: t('nav.products'), icon: Package },
        { to: '/inventory', label: t('nav.inventory'), icon: Boxes },
        { to: '/purchases', label: t('nav.pembelian'), icon: Truck },
        { to: '/customers', label: t('nav.customers'), icon: Users },
        { to: '/cash', label: t('nav.cash_bank'), icon: Wallet },
        { to: '/reports', label: t('nav.reports'), icon: BarChart3 },
      ],
    },
    {
      key: 'sistem',
      group: t('nav.group_sistem'),
      items: [
        { to: '/settings', label: t('nav.pengaturan'), icon: Settings },
      ],
    },
  ]
}

export function mobileNavigation(t: TFunction): NavigationItem[] {
  return [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/pos', label: t('nav.pos'), icon: ShoppingCart },
    { to: '/sales-orders', label: t('nav.orders'), icon: ReceiptText },
    { to: '/products', label: t('nav.products'), icon: Package },
    { to: '/settings', label: t('nav.more'), icon: Settings },
  ]
}
