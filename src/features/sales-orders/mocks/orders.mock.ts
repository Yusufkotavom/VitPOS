export type OrderRow = { id: string; code: string; customer: string; date: string; total: string; paid: string; status: string }

export const orderRows: OrderRow[] = [
  { id: '1', code: 'INV-240608-001', customer: 'Budi Santoso', date: '8 Juni 2026', total: 'Rp 450.000', paid: 'Rp 450.000', status: 'Lunas' },
  { id: '2', code: 'INV-240608-002', customer: 'Sari Printing', date: '8 Juni 2026', total: 'Rp 1.200.000', paid: 'Rp 500.000', status: 'Sebagian' },
  { id: '3', code: 'INV-240608-003', customer: 'Toko Maju Jaya', date: '8 Juni 2026', total: 'Rp 875.000', paid: 'Rp 0', status: 'Belum Bayar' },
]
