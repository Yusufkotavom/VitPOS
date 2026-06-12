import { describe, expect, it } from 'vitest'

import { getReportPreset } from '@/features/reports/config/report-presets'

describe('report presets', () => {
  it('returns five owner-first report cards for atk printing combo', () => {
    const preset = getReportPreset('atk_printing_combo')

    expect(preset.cards.map((card) => card.title)).toEqual([
      'Ringkasan',
      'Penjualan',
      'Stok',
      'Kas',
      'Piutang',
    ])
  })
})
