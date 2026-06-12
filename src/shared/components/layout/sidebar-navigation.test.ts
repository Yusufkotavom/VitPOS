import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sidebarNavigation } from '@/app/navigation'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from '@/shared/components/layout/app-sidebar'

const idNav = {
  group_utama: 'Utama',
  group_penjualan: 'Penjualan',
  group_katalog_stok: 'Katalog & Stok',
  group_relasi_bisnis: 'Relasi Bisnis',
  group_keuangan_laporan: 'Keuangan & Laporan',
  group_sistem: 'Sistem',
  dashboard: 'Dasbor',
  home: 'Beranda',
  pos: 'POS',
  shift_kasir: 'Shift Kasir',
  sales_orders: 'Pesanan Penjualan',
  orders: 'Pesanan',
  payments: 'Pembayaran',
  retur: 'Retur',
  service_order: 'Service Order',
  products: 'Produk',
  daftar_produk: 'Daftar Produk',
  kategori_produk: 'Kategori Produk',
  resep_bom: 'Resep / BOM',
  inventory: 'Stok & Gudang',
  pembelian: 'Pembelian',
  customers: 'Pelanggan',
  supplier: 'Supplier',
  cash_bank: 'Kas & Bank',
  metode_pembayaran: 'Metode Pembayaran',
  reports: 'Laporan',
  laba_rugi: 'Laba Rugi',
  neraca: 'Neraca',
  penjualan: 'Penjualan',
  stok: 'Stok',
  offline_sync: 'Sinkron Offline',
  pengaturan: 'Pengaturan',
  profil_usaha: 'Profil Usaha',
  profil_pengguna: 'Profil Pengguna',
  invoice_struk: 'Invoice & Struk',
  template_whatsapp: 'Template WhatsApp',
  platform_admin: 'Platform Admin',
  more: 'Lainnya',
}

function mockT(key: string): string {
  const parts = key.split('.')
  if (parts[0] === 'nav') {
    return (idNav as Record<string, string>)[parts[1]] ?? key
  }
  if (parts[0] === 'shared') {
    const shared: Record<string, string> = {
      sidebar_business_suite: 'Business Suite',
      sidebar_main_branch: 'Cabang Utama',
    }
    return shared[parts[1]] ?? key
  }
  return key
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}))

describe('sidebar navigation coverage', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('includes grouped entries for all major operational routes', () => {
    const nav = sidebarNavigation(mockT)
    const allItems = nav.flatMap((group) => group.items.flatMap((item) => [item, ...(item.items ?? [])]))
    const routes = allItems.map((item) => item.to)

    expect(routes).toEqual(expect.arrayContaining([
      '/products/categories',
      '/service-orders',
      '/purchases',
      '/suppliers',
      '/returns',
      '/sync',
      '/shift',
      '/platform-admin',
    ]))
    expect(nav.map((group) => group.group)).toEqual(expect.arrayContaining([
      'Utama',
      'Penjualan',
      'Katalog & Stok',
      'Relasi Bisnis',
      'Keuangan & Laporan',
      'Sistem',
    ]))
  })

  it('renders grouped and nested sidebar links in the DOM', () => {
    render(
      createElement(MemoryRouter, null,
        createElement(TooltipProvider, null,
          createElement(SidebarProvider, null, createElement(AppSidebar)),
        ),
      ),
    )

    expect(screen.getByText('Katalog & Stok')).toBeInTheDocument()
    expect(screen.getByText('Produk')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Kategori Produk/i })).toHaveAttribute('href', '/products/categories')
    expect(screen.getByRole('link', { name: /Shift Kasir/i })).toHaveAttribute('href', '/shift')
  })
})
