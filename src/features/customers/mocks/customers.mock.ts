export type CustomerRow = { id: string; name: string; phone: string; city: string; receivable: string; orders: string; status: string }

export const customerRows: CustomerRow[] = [
  { id: '1', name: 'Budi Santoso', phone: '0812-3456-7890', city: 'Surabaya', receivable: 'Rp 450.000', orders: '18', status: 'Aktif' },
  { id: '2', name: 'Sari Printing', phone: '0857-1111-2222', city: 'Sidoarjo', receivable: 'Rp 1.200.000', orders: '9', status: 'Piutang' },
  { id: '3', name: 'Toko Maju Jaya', phone: '0821-3333-4444', city: 'Malang', receivable: 'Rp 0', orders: '27', status: 'Aktif' },
]
