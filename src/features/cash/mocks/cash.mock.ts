export type CashRow = { id: string; ref: string; date: string; account: string; category: string; income: string; expense: string; status: string }

export const cashRows: CashRow[] = [
  { id: '1', ref: 'KAS-001', date: '8 Juni 2026', account: 'Kas Toko', category: 'Penjualan', income: 'Rp 3.250.000', expense: '-', status: 'Tercatat' },
  { id: '2', ref: 'KAS-002', date: '8 Juni 2026', account: 'Kas Toko', category: 'Listrik', income: '-', expense: 'Rp 350.000', status: 'Pending Sinkron' },
  { id: '3', ref: 'KAS-003', date: '8 Juni 2026', account: 'Bank BCA', category: 'Sewa', income: '-', expense: 'Rp 1.500.000', status: 'Butuh Review' },
]
