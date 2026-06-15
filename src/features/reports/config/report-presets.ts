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
    to: '/reports/profit-loss',
    title: 'Laba Rugi',
    description: 'Pendapatan, beban, dan laba bersih periode',
  },
  {
    to: '/reports/balance-sheet',
    title: 'Neraca',
    description: 'Aset, kewajiban, dan ekuitas perusahaan',
  },
  {
    to: '/reports/general-ledger',
    title: 'Buku Besar',
    description: 'Riwayat transaksi per akun',
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
