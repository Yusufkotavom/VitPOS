import { describe, expect, it } from 'vitest'

import {
  mapPurchaseRecordToFormValues,
  purchaseFormSchema,
} from '@/features/purchases/schemas/purchase-form-schema'
import {
  normalizePurchase,
  normalizePurchaseItems,
  normalizePurchaseStatus,
} from '@/features/purchases/lib/purchase-status'
import type { LocalPurchase } from '@/services/local-db/schema'

const basePurchase: LocalPurchase = {
  id: 'po-1',
  tenantId: 'tenant-1',
  code: 'PO-20261120-001',
  supplierName: 'PT Maju',
  date: '2026-11-20',
  subtotal: 50000,
  grandTotal: 50000,
  paidTotal: 0,
  status: 'Draft',
  items: [
    { id: 'item-1', tenantId: 'tenant-1', purchaseId: 'po-1', productId: 'p-1', name: 'Kertas A4', qty: 2, unitPrice: 25000, subtotal: 50000 },
  ],
  syncStatus: 'synced',
  version: 1,
  updatedAt: '',
}

describe('purchase status normalization', () => {
  it('maps cloud API statuses back to local Indonesian values', () => {
    expect(normalizePurchaseStatus('draft')).toBe('Draft')
    expect(normalizePurchaseStatus('shipped')).toBe('Dikirim')
    expect(normalizePurchaseStatus('received')).toBe('Diterima')
    expect(normalizePurchaseStatus('cancelled')).toBe('Batal')
  })

  it('keeps local values and is case-insensitive', () => {
    expect(normalizePurchaseStatus('DRAFT')).toBe('Draft')
    expect(normalizePurchaseStatus('DiKirim')).toBe('Dikirim')
    expect(normalizePurchaseStatus('Diterima')).toBe('Diterima')
  })

  it('falls back to Draft for unknown or missing values', () => {
    expect(normalizePurchaseStatus(undefined)).toBe('Draft')
    expect(normalizePurchaseStatus(null)).toBe('Draft')
    expect(normalizePurchaseStatus('weird')).toBe('Draft')
    expect(normalizePurchaseStatus('')).toBe('Draft')
  })

  it('normalizes a pulled purchase with a foreign status', () => {
    const pulled = normalizePurchase({ ...basePurchase, status: 'received' as LocalPurchase['status'] })
    expect(pulled.status).toBe('Diterima')
  })
})

describe('purchase item hydration', () => {
  it('rebuilds items that arrive without tenant or purchase ids', () => {
    const items = normalizePurchaseItems(
      [{ productId: 'p-1', name: 'Kertas A4', qty: '2', unitPrice: '25000' }],
      'tenant-1',
      'po-1',
    )

    expect(items).toHaveLength(1)
    expect(items[0].tenantId).toBe('tenant-1')
    expect(items[0].purchaseId).toBe('po-1')
    expect(items[0].subtotal).toBe(50000)
    expect(items[0].id).toBeTruthy()
  })

  it('returns an empty list for malformed payloads', () => {
    expect(normalizePurchaseItems(undefined, 'tenant-1', 'po-1')).toEqual([])
    expect(normalizePurchaseItems('nope', 'tenant-1', 'po-1')).toEqual([])
  })

  it('hydrates purchase items when editing a PO', () => {
    const values = mapPurchaseRecordToFormValues({ ...basePurchase, status: 'shipped' as LocalPurchase['status'] })

    expect(values.status).toBe('Dikirim')
    expect(values.items).toHaveLength(1)
    expect(values.items[0]).toEqual({ productId: 'p-1', name: 'Kertas A4', qty: '2', unitPrice: '25000' })
  })

  it('keeps an editable empty row when a PO has no items', () => {
    const values = mapPurchaseRecordToFormValues({ ...basePurchase, items: [] })
    expect(values.items).toHaveLength(1)
    expect(values.items[0].name).toBe('')
  })
})

describe('purchase form validation', () => {
  const validValues = {
    code: 'PO-20261120-001',
    supplierName: 'PT Maju',
    date: '2026-11-20',
    status: 'Draft',
    items: [{ productId: 'p-1', name: 'Kertas A4', qty: '2', unitPrice: '25000' }],
  }

  it('accepts a foreign status instead of blocking save', () => {
    expect(purchaseFormSchema.safeParse({ ...validValues, status: 'received' }).success).toBe(true)
  })

  it('still requires supplier, date, and at least one item', () => {
    expect(purchaseFormSchema.safeParse({ ...validValues, supplierName: '' }).success).toBe(false)
    expect(purchaseFormSchema.safeParse({ ...validValues, date: '' }).success).toBe(false)
    expect(purchaseFormSchema.safeParse({ ...validValues, items: [] }).success).toBe(false)
  })

  it('rejects zero quantity and blank item names', () => {
    const zeroQty = { ...validValues, items: [{ ...validValues.items[0], qty: '0' }] }
    const blankName = { ...validValues, items: [{ ...validValues.items[0], name: '' }] }

    expect(purchaseFormSchema.safeParse(zeroQty).success).toBe(false)
    expect(purchaseFormSchema.safeParse(blankName).success).toBe(false)
  })
})
