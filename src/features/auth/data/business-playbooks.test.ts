import { describe, expect, it } from 'vitest'

import {
  BUSINESS_PLAYBOOKS,
  DEFAULT_BUSINESS_MODE,
  DEFAULT_VERTICAL,
} from '@/features/auth/data/business-playbooks'

describe('business playbooks', () => {
  it('defines atk & printing vertical with all three modes', () => {
    expect(DEFAULT_VERTICAL).toBe('atk_printing')
    expect(DEFAULT_BUSINESS_MODE).toBe('atk_printing_combo')

    const playbook = BUSINESS_PLAYBOOKS.atk_printing
    expect(playbook.label).toBe('ATK & Printing')
    expect(playbook.modes.map((mode) => mode.id)).toEqual([
      'atk_only',
      'printing_only',
      'atk_printing_combo',
    ])
  })

  it('provides realistic default categories, products, and payment methods', () => {
    const combo = BUSINESS_PLAYBOOKS.atk_printing.modes.find(
      (mode) => mode.id === 'atk_printing_combo',
    )

    expect(combo?.categories).toContain('Kertas')
    expect(combo?.categories).toContain('Jasa Dokumen')
    expect(combo?.products.some((item) => item.name === 'Kertas A4 70gsm')).toBe(true)
    expect(combo?.products.some((item) => item.name === 'Print warna per lembar')).toBe(true)
    expect(combo?.paymentMethods.map((item) => item.name)).toEqual([
      'Tunai',
      'QRIS',
      'Transfer',
      'Piutang',
    ])
  })

  it('defines general business vertical with minimal running starter data', () => {
    const general = BUSINESS_PLAYBOOKS.general
    expect(general).toBeDefined()
    expect(general.label).toBe('Usaha Umum')
    expect(general.modes.map((mode) => mode.id)).toEqual(['general_standard'])

    const standard = general.modes[0]
    expect(standard.label).toBe('Standar Toko')
    expect(standard.categories).toEqual(['Umum'])
    expect(standard.products).toHaveLength(1)
    expect(standard.products[0]).toEqual({
      name: 'Produk Contoh',
      category: 'Umum',
      price: 10000,
      cost: 7000,
      type: 'Produk Fisik',
      unit: 'pcs',
      stock: 10,
      minStock: 2,
      tags: ['umum', 'stok'],
    })
    expect(standard.paymentMethods.map((item) => item.name)).toEqual([
      'Tunai',
      'QRIS',
      'Transfer',
      'Piutang',
    ])
    expect(standard.cashCategories.map((item) => item.name)).toEqual([
      'Penjualan',
      'Pembelian Stok',
      'Operasional',
    ])
  })

  it('defines service gadget vertical with repair and accessories modes', () => {
    const gadget = BUSINESS_PLAYBOOKS.service_gadget
    expect(gadget).toBeDefined()
    expect(gadget.label).toBe('Servis HP & Gadget')
    expect(gadget.modes.map((m) => m.id)).toEqual(['hp_service_repair', 'hp_accessories_combo'])

    const repair = gadget.modes.find((m) => m.id === 'hp_service_repair')
    expect(repair?.categories).toContain('Jasa Servis HP')
    expect(repair?.categories).toContain('LCD & Layar')
    expect(repair?.products.some((p) => p.name === 'Jasa Ganti LCD Touchscreen')).toBe(true)
    expect(repair?.products.some((p) => p.name === 'Baterai iPhone High Capacity')).toBe(true)
  })

  it('defines service computer vertical with repair and printer modes', () => {
    const computer = BUSINESS_PLAYBOOKS.service_computer
    expect(computer).toBeDefined()
    expect(computer.label).toBe('Servis Komputer, Laptop & Printer')
    expect(computer.modes.map((m) => m.id)).toEqual(['computer_service_repair', 'computer_printer_combo'])

    const repair = computer.modes.find((m) => m.id === 'computer_service_repair')
    expect(repair?.categories).toContain('Jasa Komputer & Laptop')
    expect(repair?.categories).toContain('Storage & RAM')
    expect(repair?.products.some((p) => p.name === 'Install Ulang OS + Software Standar')).toBe(true)
    expect(repair?.products.some((p) => p.name === 'SSD NVMe 512GB PCIe Gen3')).toBe(true)
  })
})
