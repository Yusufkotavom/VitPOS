import {
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  Home,
  Package,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Settings,
  Shield,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import { appLabels } from '@/app/labels'

export type NavigationItem = {
  to: string
  label: string
  icon: LucideIcon
}

export type SidebarNavigationItem = NavigationItem & {
  items?: NavigationItem[]
}

export type SidebarNavigationGroup = {
  group: string
  items: SidebarNavigationItem[]
}

export const sidebarNavigation: SidebarNavigationGroup[] = [
  {
    group: 'Utama',
    items: [
      { to: '/', label: appLabels.dashboard, icon: Home },
      { to: '/pos', label: appLabels.pos, icon: ShoppingCart },
      { to: '/shift', label: 'Shift Kasir', icon: Wallet },
    ],
  },
  {
    group: 'Penjualan',
    items: [
      { to: '/sales-orders', label: appLabels.salesOrders, icon: ClipboardList },
      { to: '/payments', label: appLabels.payments, icon: CreditCard },
      { to: '/returns', label: 'Retur', icon: RotateCcw },
      { to: '/service-orders', label: 'Service Order', icon: Wrench },
    ],
  },
  {
    group: 'Katalog & Stok',
    items: [
      {
        to: '/products',
        label: appLabels.products,
        icon: Package,
        items: [
          { to: '/products/categories', label: 'Kategori Produk', icon: Package },
        ],
      },
      { to: '/inventory', label: appLabels.inventory, icon: Boxes },
      { to: '/purchases', label: 'Pembelian', icon: Truck },
    ],
  },
  {
    group: 'Relasi Bisnis',
    items: [
      { to: '/customers', label: appLabels.customers, icon: Users },
      { to: '/suppliers', label: 'Supplier', icon: Users },
    ],
  },
  {
    group: 'Keuangan & Laporan',
    items: [
      { to: '/cash', label: appLabels.cashBank, icon: Wallet },
      { to: '/reports', label: appLabels.reports, icon: BarChart3 },
    ],
  },
  {
    group: 'Sistem',
    items: [
      { to: '/sync', label: appLabels.offlineSync, icon: RefreshCw },
      { to: '/settings', label: appLabels.companySetting, icon: Settings },
      { to: '/platform-admin', label: 'Platform Admin', icon: Shield },
    ],
  },
]

export const mobileNavigation: NavigationItem[] = [
  { to: '/', label: appLabels.home, icon: Home },
  { to: '/pos', label: appLabels.pos, icon: ShoppingCart },
  { to: '/sales-orders', label: appLabels.orders, icon: ReceiptText },
  { to: '/products', label: appLabels.products, icon: Package },
  { to: '/settings', label: appLabels.more, icon: Settings },
]
