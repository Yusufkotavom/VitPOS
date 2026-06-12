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
}

export function getDashboardPreset(mode: BusinessModeId): DashboardPreset {
  return DASHBOARD_PRESETS[mode]
}
