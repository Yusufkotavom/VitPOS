import { describe, expect, it } from 'vitest'

import { buildDashboardStats } from './dashboard-stats'

describe('buildDashboardStats', () => {
  it('keeps nominal dashboard cards at Rp 0 when numeric fields are missing', () => {
    const result = buildDashboardStats({
      sales: [{ code: 'INV-001', customerName: 'Umum', status: 'Lunas' }],
      inventory: [],
      customers: [{ receivable: undefined }],
    })

    expect(result.dashboardStats).toEqual([
      { label: 'Pendapatan Hari Ini', value: 'Rp 0', tone: 'text-emerald-600' },
      { label: 'Laba Kotor', value: 'Rp 0', tone: 'text-sky-600' },
      { label: 'Piutang Aktif', value: 'Rp 0', tone: 'text-amber-600' },
      { label: 'Stok Kritis', value: '0 item', tone: 'text-rose-600' },
    ])
    expect(result.dashboardTransactions[0].total).toBe('Rp 0')
    expect(result.dashboardAlerts[1].description).toBe('Masuk Rp 0')
  })
})
