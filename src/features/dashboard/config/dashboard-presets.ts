import type { BusinessModeId } from '@/features/auth/data/business-playbooks'

export type DashboardPreset = {
  heroTitle: string
  heroDescription: string
  focusBlocks: string[]
  quickActions: string[]
}

const DASHBOARD_PRESETS: Record<BusinessModeId, DashboardPreset> = {
  atk_only: {
    heroTitle: 'Ringkasan usaha hari ini',
    heroDescription: 'Fokus stok, barang laris, dan restok cepat.',
    focusBlocks: ['stok', 'barang_laris', 'restok', 'kas'],
    quickActions: ['Transaksi baru', 'Tambah stok', 'Lihat barang hampir habis'],
  },
  printing_only: {
    heroTitle: 'Ringkasan usaha hari ini',
    heroDescription: 'Fokus jasa laris, omzet layanan, dan bahan habis pakai.',
    focusBlocks: ['jasa_laris', 'omzet_layanan', 'bahan_habis_pakai', 'kas'],
    quickActions: ['Transaksi baru', 'Catat pengeluaran', 'Cek jasa terlaris'],
  },
  atk_printing_combo: {
    heroTitle: 'Ringkasan usaha hari ini',
    heroDescription: 'Pantau barang, layanan, stok, dan kas dari satu layar.',
    focusBlocks: ['barang', 'layanan', 'stok', 'kas'],
    quickActions: ['Transaksi baru', 'Tambah stok', 'Catat pengeluaran', 'Input piutang'],
  },
  hp_service_repair: {
    heroTitle: 'Workshop Servis HP & Gadget',
    heroDescription: 'Pantau unit masuk, pengerjaan teknisi, stok sparepart LCD/baterai, dan kas.',
    focusBlocks: ['servis', 'sparepart', 'kas', 'piutang'],
    quickActions: ['Buat tiket servis', 'Cek status servis', 'Tambah sparepart', 'Catat kas'],
  },
  hp_accessories_combo: {
    heroTitle: 'Ringkasan Servis & Aksesoris HP',
    heroDescription: 'Pantau penjualan aksesoris, unit servis pelanggan, dan stok dari satu layar.',
    focusBlocks: ['barang', 'servis', 'stok', 'kas'],
    quickActions: ['Transaksi kasir baru', 'Buat tiket servis', 'Tambah stok', 'Lacak unit servis'],
  },
  computer_service_repair: {
    heroTitle: 'Workshop Servis PC & Laptop',
    heroDescription: 'Pantau antrean laptop, upgrade SSD/RAM, garansi aktif, dan keuangan workshop.',
    focusBlocks: ['servis', 'sparepart', 'garansi', 'kas'],
    quickActions: ['Buat tiket servis', 'Update pengerjaan', 'Tambah komponen', 'Catat kas'],
  },
  computer_printer_combo: {
    heroTitle: 'Ringkasan Servis PC, Laptop & Printer',
    heroDescription: 'Pantau perbaikan komputer, servis head/tinta printer, dan kas operasional.',
    focusBlocks: ['servis', 'tinta', 'stok', 'kas'],
    quickActions: ['Transaksi baru', 'Tiket servis masuk', 'Update pengerjaan', 'Lacak status'],
  },
  general_standard: {
    heroTitle: 'Ringkasan usaha hari ini',
    heroDescription: 'Pantau penjualan, stok, dan kas dari satu layar.',
    focusBlocks: ['stok', 'penjualan', 'kas'],
    quickActions: ['Transaksi baru', 'Tambah stok', 'Catat kas'],
  },
}

export function getDashboardPreset(mode: BusinessModeId): DashboardPreset {
  return DASHBOARD_PRESETS[mode]
}
