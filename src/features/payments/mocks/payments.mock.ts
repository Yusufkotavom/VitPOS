export type PaymentRow = { id: string; ref: string; source: string; method: string; amount: string; date: string; status: string }

export const paymentRows: PaymentRow[] = [
  { id: '1', ref: 'PAY-001', source: 'POS', method: 'Tunai', amount: 'Rp 450.000', date: '8 Juni 2026', status: 'Berhasil' },
  { id: '2', ref: 'PAY-002', source: 'Invoice', method: 'QRIS', amount: 'Rp 500.000', date: '8 Juni 2026', status: 'Pending' },
  { id: '3', ref: 'PAY-003', source: 'Service', method: 'Transfer', amount: 'Rp 120.000', date: '8 Juni 2026', status: 'Refund' },
]
