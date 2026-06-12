import { describe, expect, it } from 'vitest'

import { getDashboardPreset } from '@/features/dashboard/config/dashboard-presets'

describe('dashboard presets', () => {
  it('returns combo layout with barang and layanan focus', () => {
    const preset = getDashboardPreset('atk_printing_combo')

    expect(preset.heroTitle).toBe('Ringkasan usaha hari ini')
    expect(preset.focusBlocks).toEqual(['barang', 'layanan', 'stok', 'kas'])
    expect(preset.quickActions).toContain('Transaksi baru')
  })

  it('returns mode-specific focus blocks', () => {
    expect(getDashboardPreset('atk_only').focusBlocks).toContain('restok')
    expect(getDashboardPreset('printing_only').focusBlocks).toContain('jasa_laris')
  })
})
