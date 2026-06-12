import type { BusinessModeId } from '@/features/auth/data/business-playbooks'

export type ReportCardPreset = {
  to: string
  title: string
  description: string
}

export type ReportPreset = {
  cards: ReportCardPreset[]
}

const SHARED_OWNER_CARDS: ReportCardPreset[] = [
  {
    to: '/reports',
    title: 'Ringkasan',
    description: 'Omzet, laba kotor, stok, kas, piutang',
  },
  {
    to: '/reports/sales',
    title: 'Penjualan',
    description: 'Omzet, transaksi, produk dan jasa laris',
  },
  {
    to: '/reports/inventory',
    title: 'Stok',
    description: 'Barang hampir habis, mutasi, restok',
  },
  {
    to: '/reports/payments',
    title: 'Kas',
    description: 'Uang masuk, uang keluar, saldo berjalan',
  },
  {
    to: '/reports/payments',
    title: 'Piutang',
    description: 'Tagihan belum lunas dan histori bayar',
  },
]

export function getReportPreset(mode: BusinessModeId): ReportPreset {
  void mode
  return { cards: SHARED_OWNER_CARDS }
}
