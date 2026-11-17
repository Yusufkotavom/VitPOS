import { describe, expect, it } from 'vitest'

import {
  computeJobLineSubtotal,
  createJobLine,
  isStockTrackedLine,
  jobLineFromProduct,
  normalizeJobLines,
  sumJobLineCost,
  validateJobLines,
} from '@/features/service-orders/lib/job-lines'
import { resolveServiceVertical, getServiceVerticalById } from '@/features/service-orders/lib/vertical-config'
import type { LocalProduct, LocalServiceOrder } from '@/services/local-db/schema'

const physicalProduct: LocalProduct = {
  id: 'p-1',
  tenantId: 't-1',
  name: 'SSD NVMe 512GB',
  category: 'Storage',
  type: 'Produk Fisik',
  price: 480000,
  costPrice: 385000,
  stock: 6,
  manageStock: true,
  unit: 'pcs',
  status: 'Aktif',
  syncStatus: 'synced',
  version: 1,
  updatedAt: '',
}

const serviceProduct: LocalProduct = {
  ...physicalProduct,
  id: 'p-2',
  name: 'Install Ulang OS',
  type: 'Jasa',
  price: 100000,
  costPrice: 20000,
  stock: 0,
  manageStock: false,
  unit: 'unit',
}

describe('job lines', () => {
  it('computes unit priced subtotal', () => {
    expect(computeJobLineSubtotal({ priceMode: 'unit', qty: 3, unitPrice: 25000 })).toBe(75000)
  })

  it('computes area priced subtotal for printing', () => {
    expect(computeJobLineSubtotal({ priceMode: 'area', qty: 1, unitPrice: 45000, width: 3, height: 1 })).toBe(135000)
  })

  it('marks catalog physical products as stock tracked', () => {
    const line = jobLineFromProduct(physicalProduct)
    expect(line.source).toBe('catalog')
    expect(line.kind).toBe('product')
    expect(line.unit).toBe('pcs')
    expect(isStockTrackedLine(line)).toBe(true)
  })

  it('never tracks stock for catalog services', () => {
    const line = jobLineFromProduct(serviceProduct)
    expect(line.kind).toBe('service')
    expect(line.trackStock).toBe(false)
    expect(isStockTrackedLine(line)).toBe(false)
  })

  it('never tracks stock for custom lines', () => {
    const line = createJobLine({ name: 'Jasa las custom', unitPrice: 50000 })
    expect(line.source).toBe('custom')
    expect(isStockTrackedLine(line)).toBe(false)
  })

  it('gives every custom line a unique id', () => {
    const first = createJobLine({ name: 'A' })
    const second = createJobLine({ name: 'B' })
    expect(first.id).not.toBe(second.id)
  })

  it('sums line cost from cost price and qty', () => {
    const lines = [jobLineFromProduct(physicalProduct), jobLineFromProduct(serviceProduct)]
    expect(sumJobLineCost(lines)).toBe(385000 + 20000)
  })

  it('validates empty lines, blank names, and invalid area sizes', () => {
    expect(validateJobLines([])).not.toBeNull()
    expect(validateJobLines([createJobLine({ name: '   ' })])).not.toBeNull()
    expect(validateJobLines([createJobLine({ name: 'Banner', priceMode: 'area', unitPrice: 45000 })])).not.toBeNull()
    expect(validateJobLines([createJobLine({ name: 'Banner', priceMode: 'area', unitPrice: 45000, width: 3, height: 1 })])).toBeNull()
  })

  it('normalizes legacy item rows into job lines', () => {
    const legacy: Pick<LocalServiceOrder, 'lines' | 'items'> = {
      items: [{ productId: 'p-1', name: 'SSD', qty: 2, price: 480000, costPrice: 385000, subtotal: 960000 }],
    }
    const lines = normalizeJobLines(legacy)
    expect(lines).toHaveLength(1)
    expect(lines[0].unitPrice).toBe(480000)
    expect(lines[0].subtotal).toBe(960000)
  })
})

describe('service vertical config', () => {
  it('resolves the computer vertical from the onboarding mode', () => {
    const config = resolveServiceVertical({ modeId: 'computer_printer_combo' })
    expect(config.id).toBe('service_computer')
    expect(config.intakeFields.some((field) => field.key === 'deviceSerial')).toBe(true)
    expect(config.statusFlow).toContain('Diagnosa')
  })

  it('resolves printing vertical with area-friendly quick services', () => {
    const config = resolveServiceVertical({ verticalId: 'atk_printing' })
    expect(config.id).toBe('printing')
    expect(config.quickServices.some((service) => service.label.includes('Banner'))).toBe(true)
  })

  it('falls back to general config for unknown vertical', () => {
    expect(getServiceVerticalById('unknown').id).toBe('general')
    expect(resolveServiceVertical({}).id).toBe('general')
  })
})
