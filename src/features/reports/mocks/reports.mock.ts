export type ReportRow = { id: string; name: string; period: string; summary: string; value: string; updatedAt: string; status: string }

export const reportRows: ReportRow[] = [
  { id: '1', name: 'Laba Rugi', period: 'Juni 2026', summary: 'Pendapatan vs HPP vs biaya', value: 'Rp 12.500.000', updatedAt: '8 Juni 2026', status: 'Siap Export' },
  { id: '2', name: 'Arus Kas', period: 'Juni 2026', summary: 'Masuk dan keluar kas', value: 'Rp 5.400.000', updatedAt: '8 Juni 2026', status: 'Siap Export' },
  { id: '3', name: 'Persediaan', period: 'Juni 2026', summary: 'Stok awal, masuk, keluar, akhir', value: 'Rp 8.900.000', updatedAt: '8 Juni 2026', status: 'Draft' },
]
