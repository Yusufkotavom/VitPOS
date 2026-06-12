import { describe, expect, it } from 'vitest'

import { DEFAULT_BUSINESS_MODE, DEFAULT_VERTICAL } from '@/features/auth/data/business-playbooks'
import { buildAtkPrintingSeed, createPlaybookSeedBundle } from '@/services/local-db/seed-playbooks'

describe('createPlaybookSeedBundle', () => {
  it('builds atk & printing local seed rows', () => {
    const bundle = createPlaybookSeedBundle('tenant-1')

    expect(bundle.businessVertical).toBe(DEFAULT_VERTICAL)
    expect(bundle.businessMode).toBe(DEFAULT_BUSINESS_MODE)
    expect(bundle.categories.map((item) => item.name)).toContain('Kertas')
    expect(bundle.products.some((item) => item.name === 'Kertas A4 70gsm')).toBe(true)
    expect(bundle.products.some((item) => item.manageStock)).toBe(true)
    expect(bundle.paymentMethods.map((item) => item.name)).toContain('QRIS')
    expect(bundle.cashCategories.map((item) => item.name)).toContain('Penjualan Barang')
    expect(bundle.settings.map((item) => item.setting)).toEqual([
      'business_vertical',
      'business_mode',
      'kas_awal',
      'Nama Usaha',
      'Nama Pemilik',
    ])
  })

  it('keeps physical products stock-managed and services stock-free', () => {
    const bundle = createPlaybookSeedBundle('tenant-1')

    const physical = bundle.products.find((item) => item.type === 'Produk Fisik')
    const service = bundle.products.find((item) => item.type === 'Jasa')

    expect(physical?.manageStock).toBe(true)
    expect(service?.manageStock).toBe(false)
    expect(service?.stock).toBe(0)
  })

  it('builds realistic combo seed rows with stock and jasa entries', () => {
    const seed = buildAtkPrintingSeed({
      tenantId: 'tenant-1',
      businessMode: 'atk_printing_combo',
      tenantName: 'Mitra Print & ATK',
      ownerName: 'Rina',
      city: 'Surabaya',
      initialCash: 500000,
    })

    expect(seed.products.some((item) => item.name === 'Kertas A4 70gsm')).toBe(true)
    expect(seed.products.some((item) => item.name === 'Print warna per lembar')).toBe(true)
    expect(seed.products.find((item) => item.name === 'Kertas A4 70gsm')?.stock).toBeGreaterThan(0)
    expect(seed.paymentMethods.map((item) => item.name)).toContain('QRIS')
    expect(seed.settings.some((item) => item.setting === 'business_mode')).toBe(true)
    expect(seed.settings.some((item) => item.setting === 'kas_awal' && item.value === '500000')).toBe(true)
  })
})
