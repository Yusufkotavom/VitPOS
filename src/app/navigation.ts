import {
  BarChart3,
  Building2,
  Boxes,
  MessageSquare,
  ClipboardList,
  CreditCard,
  Home,
  Package,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Scale,
  Settings,
  Shield,
  ShoppingCart,
  TrendingUp,
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
      key: 'penjualan',
      group: t('nav.group_penjualan'),
      items: [
        { to: '/sales-orders', label: t('nav.sales_orders'), icon: ClipboardList },
        { to: '/payments', label: t('nav.payments'), icon: CreditCard },
        { to: '/returns', label: t('nav.retur'), icon: RotateCcw },
        { to: '/service-orders', label: t('nav.service_order'), icon: Wrench },
      ],
    },
    {
      key: 'katalog_stok',
      group: t('nav.group_katalog_stok'),
      items: [
        {
          to: '/products',
          label: t('nav.products'),
          icon: Package,
          items: [
            { to: '/products', label: t('nav.daftar_produk'), icon: Package },
            { to: '/products/categories', label: t('nav.kategori_produk'), icon: Package },
            { to: '/products/recipes', label: t('nav.resep_bom'), icon: Package },
          ],
        },
        { to: '/inventory', label: t('nav.inventory'), icon: Boxes },
        { to: '/purchases', label: t('nav.pembelian'), icon: Truck },
      ],
    },
    {
      key: 'relasi_bisnis',
      group: t('nav.group_relasi_bisnis'),
      items: [
        { to: '/customers', label: t('nav.customers'), icon: Users },
        { to: '/suppliers', label: t('nav.supplier'), icon: Users },
      ],
    },
    {
      key: 'keuangan_laporan',
      group: t('nav.group_keuangan_laporan'),
      items: [
        {
          to: '/cash',
          label: t('nav.cash_bank'),
          icon: Wallet,
          items: [
            { to: '/cash/payment-methods', label: t('nav.metode_pembayaran'), icon: CreditCard },
          ],
        },
        {
          to: '/reports',
          label: t('nav.reports'),
          icon: BarChart3,
          items: [
            { to: '/reports/profit-loss', label: t('nav.laba_rugi'), icon: TrendingUp },
            { to: '/reports/balance-sheet', label: t('nav.neraca'), icon: Scale },
            { to: '/reports/sales', label: t('nav.penjualan'), icon: ReceiptText },
            { to: '/reports/payments', label: t('nav.pembayaran'), icon: CreditCard },
            { to: '/reports/inventory', label: t('nav.stok'), icon: Boxes },
          ],
        },
      ],
    },
    {
      key: 'sistem',
      group: t('nav.group_sistem'),
      items: [
        { to: '/sync', label: t('nav.offline_sync'), icon: RefreshCw },
        {
          to: '/settings',
          label: t('nav.pengaturan'),
          icon: Settings,
          items: [
            { to: '/settings/company', label: t('nav.profil_usaha'), icon: Building2 },
            { to: '/settings/profile', label: t('nav.profil_pengguna'), icon: Users },
            { to: '/settings/invoice', label: t('nav.invoice_struk'), icon: ReceiptText },
            { to: '/settings/templates', label: t('nav.template_whatsapp'), icon: MessageSquare },
          ],
        },
        { to: '/platform-admin', label: t('nav.platform_admin'), icon: Shield },
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
