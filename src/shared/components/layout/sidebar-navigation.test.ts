import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sidebarNavigation } from '@/app/navigation'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from '@/shared/components/layout/app-sidebar'

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
    const allItems = sidebarNavigation.flatMap((group) => group.items.flatMap((item) => [item, ...(item.items ?? [])]))
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
    expect(sidebarNavigation.map((group) => group.group)).toEqual(expect.arrayContaining([
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
    expect(screen.getByRole('link', { name: /^Produk$/i })).toHaveAttribute('href', '/products')
    expect(screen.getByRole('link', { name: /Kategori Produk/i })).toHaveAttribute('href', '/products/categories')
    expect(screen.getByRole('link', { name: /Shift Kasir/i })).toHaveAttribute('href', '/shift')
  })
})
