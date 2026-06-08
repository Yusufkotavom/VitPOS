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

export const sidebarNavigation: NavigationItem[] = [
  { to: '/', label: appLabels.dashboard, icon: Home },
  { to: '/pos', label: appLabels.pos, icon: ShoppingCart },
  { to: '/products', label: appLabels.products, icon: Package },
  { to: '/customers', label: appLabels.customers, icon: Users },
  { to: '/sales-orders', label: appLabels.salesOrders, icon: ClipboardList },
  { to: '/payments', label: appLabels.payments, icon: CreditCard },
  { to: '/inventory', label: appLabels.inventory, icon: Boxes },
  { to: '/cash', label: appLabels.cashBank, icon: Wallet },
  { to: '/reports', label: appLabels.reports, icon: BarChart3 },
  { to: '/service-orders', label: 'Service Order', icon: Wrench },
  { to: '/purchases', label: 'Pembelian', icon: Truck },
  { to: '/suppliers', label: 'Supplier', icon: Users },
  { to: '/returns', label: 'Retur', icon: RotateCcw },
  { to: '/sync', label: appLabels.offlineSync, icon: RefreshCw },
  { to: '/settings', label: appLabels.companySetting, icon: Settings },
  { to: '/platform-admin', label: 'Platform Admin', icon: Shield },
]

export const mobileNavigation: NavigationItem[] = [
  { to: '/', label: appLabels.home, icon: Home },
  { to: '/pos', label: appLabels.pos, icon: ShoppingCart },
  { to: '/sales-orders', label: appLabels.orders, icon: ReceiptText },
  { to: '/products', label: appLabels.products, icon: Package },
  { to: '/settings', label: appLabels.more, icon: Settings },
]
