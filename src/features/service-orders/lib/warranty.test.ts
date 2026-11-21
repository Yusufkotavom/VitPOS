import { describe, expect, it } from 'vitest'

import { addWarrantyDuration, buildWarrantyTimelineNote, isWarrantyExpired, resolveServiceWarranty } from '@/features/service-orders/lib/warranty'

describe('warranty helpers', () => {
  it('adds 30 hari from completion date', () => {
    const end = addWarrantyDuration('2026-06-10T10:00:00.000Z', 30, 'hari')

    expect(end).toBe('2026-07-10T10:00:00.000Z')
  })

  it('builds activation note', () => {
    expect(buildWarrantyTimelineNote({ value: 3, unit: 'bulan', mode: 'activated', endDate: '2026-09-10T10:00:00.000Z' })).toContain('Garansi aktif sampai')
  })

  it('detects expired warranty', () => {
    expect(isWarrantyExpired('2020-01-01T00:00:00.000Z', new Date('2026-01-01T00:00:00.000Z'))).toBe(true)
  })

  it('resolves warranty when hasWarranty is true directly', () => {
    const resolved = resolveServiceWarranty({
      hasWarranty: true,
      warrantyValue: 14,
      warrantyUnit: 'hari',
      status: 'Selesai',
      date: '2026-11-20T00:00:00.000Z',
    })

    expect(resolved.hasWarranty).toBe(true)
    expect(resolved.warrantyValue).toBe(14)
    expect(resolved.warrantyUnit).toBe('hari')
    expect(resolved.warrantyEndDate).toBeDefined()
  })

  it('recovers warranty from timeline when hasWarranty was lost or undefined', () => {
    const resolved = resolveServiceWarranty({
      hasWarranty: undefined,
      status: 'Selesai',
      date: '2026-11-20T00:00:00.000Z',
      timeline: [
        { id: '1', status: 'Diterima', date: '2026-11-20T00:00:00.000Z', note: 'Service order dibuat' },
        { id: '2', status: 'Selesai', date: '2026-11-21T00:00:00.000Z', note: 'Garansi diatur 30 hari', type: 'warranty' },
      ],
    })

    expect(resolved.hasWarranty).toBe(true)
    expect(resolved.warrantyValue).toBe(30)
    expect(resolved.warrantyUnit).toBe('hari')
    expect(resolved.warrantyEndDate).toBeDefined()
  })

  it('recovers warranty when warrantyEndDate exists even if hasWarranty is falsy', () => {
    const resolved = resolveServiceWarranty({
      hasWarranty: false,
      warrantyEndDate: '2026-12-21T00:00:00.000Z',
      status: 'Selesai',
    })

    expect(resolved.hasWarranty).toBe(true)
    expect(resolved.warrantyEndDate).toBe('2026-12-21T00:00:00.000Z')
  })

  it('respects removed warranty in timeline', () => {
    const resolved = resolveServiceWarranty({
      hasWarranty: true,
      status: 'Selesai',
      timeline: [
        { id: '1', status: 'Selesai', date: '2026-11-20T00:00:00.000Z', note: 'Garansi diatur 30 hari', type: 'warranty' },
        { id: '2', status: 'Selesai', date: '2026-11-21T00:00:00.000Z', note: 'Garansi dihapus', type: 'warranty' },
      ],
    })

    expect(resolved.hasWarranty).toBe(false)
  })
})
