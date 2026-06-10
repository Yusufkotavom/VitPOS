import { describe, expect, it } from 'vitest'

import { addWarrantyDuration, buildWarrantyTimelineNote, isWarrantyExpired } from '@/features/service-orders/lib/warranty'

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
})
