export type BusinessVerticalId = 'atk_printing' | 'general'
export type BusinessModeId = 'atk_only' | 'printing_only' | 'atk_printing_combo' | 'general_standard'

export type PlaybookItemType = 'Produk Fisik' | 'Jasa'

export type PlaybookProduct = {
  name: string
  category: string
  price: number
  cost: number
  type: PlaybookItemType
  unit: string
  stock: number
  minStock: number
  tags: string[]
}

export type BusinessModePlaybook = {
  id: BusinessModeId
  label: string
  description: string
  categories: string[]
  products: PlaybookProduct[]
  paymentMethods: Array<{ name: string; provider: string; type: string }>
  cashCategories: Array<{ name: string; type: 'Pemasukan' | 'Pengeluaran' }>
  quickActions: string[]
  reportKeys: Array<'ringkasan' | 'penjualan' | 'stok' | 'kas' | 'piutang'>
  dashboardFocus: string[]
}

export type BusinessVerticalPlaybook = {
  id: BusinessVerticalId
  label: string
  description: string
  modes: BusinessModePlaybook[]
}

const SHARED_PAYMENT_METHODS = [
  { name: 'Tunai', provider: 'Tunai', type: 'tunai' },
  { name: 'QRIS', provider: 'QRIS', type: 'qris' },
  { name: 'Transfer', provider: 'Bank', type: 'transfer' },
  { name: 'Piutang', provider: 'Pelanggan', type: 'piutang' },
] as const

export const BUSINESS_PLAYBOOKS: Record<BusinessVerticalId, BusinessVerticalPlaybook> = {
  atk_printing: {
    id: 'atk_printing',
    label: 'ATK & Printing',
    description: 'Toko alat tulis, fotokopi, print dokumen, dan layanan dokumen umum.',
    modes: [
      {
        id: 'atk_only',
        label: 'ATK saja',
        description: 'Fokus jual barang dan kontrol stok.',
        categories: ['Kertas', 'Alat Tulis', 'Map & Arsip', 'Perlengkapan Sekolah'],
        products: [
          { name: 'Kertas A4 70gsm', category: 'Kertas', price: 65000, cost: 52000, type: 'Produk Fisik', unit: 'rim', stock: 12, minStock: 4, tags: ['atk', 'stok'] },
          { name: 'Pulpen Faster', category: 'Alat Tulis', price: 3500, cost: 2200, type: 'Produk Fisik', unit: 'pcs', stock: 120, minStock: 24, tags: ['atk', 'laris'] },
        ],
        paymentMethods: [...SHARED_PAYMENT_METHODS],
        cashCategories: [
          { name: 'Penjualan ATK', type: 'Pemasukan' },
          { name: 'Pembelian Stok', type: 'Pengeluaran' },
        ],
        quickActions: ['Transaksi baru', 'Tambah stok', 'Lihat barang hampir habis'],
        reportKeys: ['ringkasan', 'penjualan', 'stok', 'kas', 'piutang'],
        dashboardFocus: ['stok', 'barang_laris', 'restok'],
      },
      {
        id: 'printing_only',
        label: 'Printing saja',
        description: 'Fokus jasa dokumen dan bahan habis pakai.',
        categories: ['Jasa Dokumen', 'Printer & Tinta', 'Laminating & Jilid'],
        products: [
          { name: 'Print hitam putih per lembar', category: 'Jasa Dokumen', price: 500, cost: 200, type: 'Jasa', unit: 'lembar', stock: 0, minStock: 0, tags: ['printing', 'jasa'] },
          { name: 'Print warna per lembar', category: 'Jasa Dokumen', price: 2000, cost: 900, type: 'Jasa', unit: 'lembar', stock: 0, minStock: 0, tags: ['printing', 'jasa'] },
        ],
        paymentMethods: [...SHARED_PAYMENT_METHODS],
        cashCategories: [
          { name: 'Pendapatan Jasa Print', type: 'Pemasukan' },
          { name: 'Beli Kertas dan Tinta', type: 'Pengeluaran' },
        ],
        quickActions: ['Transaksi baru', 'Catat pengeluaran', 'Cek jasa terlaris'],
        reportKeys: ['ringkasan', 'penjualan', 'stok', 'kas', 'piutang'],
        dashboardFocus: ['jasa_laris', 'omzet_layanan', 'bahan_habis_pakai'],
      },
      {
        id: 'atk_printing_combo',
        label: 'Gabungan ATK + Printing',
        description: 'Fokus barang + jasa dalam satu dashboard owner.',
        categories: ['Kertas', 'Alat Tulis', 'Map & Arsip', 'Printer & Tinta', 'Jasa Dokumen', 'Laminating & Jilid'],
        products: [
          { name: 'Kertas A4 70gsm', category: 'Kertas', price: 65000, cost: 52000, type: 'Produk Fisik', unit: 'rim', stock: 12, minStock: 4, tags: ['atk', 'stok'] },
          { name: 'Pulpen Faster', category: 'Alat Tulis', price: 3500, cost: 2200, type: 'Produk Fisik', unit: 'pcs', stock: 120, minStock: 24, tags: ['atk', 'laris'] },
          { name: 'Print hitam putih per lembar', category: 'Jasa Dokumen', price: 500, cost: 200, type: 'Jasa', unit: 'lembar', stock: 0, minStock: 0, tags: ['printing', 'jasa'] },
          { name: 'Print warna per lembar', category: 'Jasa Dokumen', price: 2000, cost: 900, type: 'Jasa', unit: 'lembar', stock: 0, minStock: 0, tags: ['printing', 'jasa'] },
          { name: 'Laminating', category: 'Laminating & Jilid', price: 7000, cost: 2500, type: 'Jasa', unit: 'lembar', stock: 0, minStock: 0, tags: ['printing', 'jasa'] },
        ],
        paymentMethods: [...SHARED_PAYMENT_METHODS],
        cashCategories: [
          { name: 'Penjualan Barang', type: 'Pemasukan' },
          { name: 'Pendapatan Jasa Print', type: 'Pemasukan' },
          { name: 'Pembelian Stok', type: 'Pengeluaran' },
          { name: 'Operasional Mesin Print', type: 'Pengeluaran' },
        ],
        quickActions: ['Transaksi baru', 'Tambah stok', 'Catat pengeluaran', 'Input piutang', 'Lihat barang hampir habis'],
        reportKeys: ['ringkasan', 'penjualan', 'stok', 'kas', 'piutang'],
        dashboardFocus: ['barang', 'layanan', 'stok', 'kas'],
      },
    ],
  },
  general: {
    id: 'general',
    label: 'Usaha Umum',
    description: 'Toko atau usaha umum dengan starter data minimal siap transaksi.',
    modes: [
      {
        id: 'general_standard',
        label: 'Standar Toko',
        description: 'Setup minimal untuk toko dan usaha umum (1 produk, 1 pelanggan, 1 supplier).',
        categories: ['Umum'],
        products: [
          {
            name: 'Produk Contoh',
            category: 'Umum',
            price: 10000,
            cost: 7000,
            type: 'Produk Fisik',
            unit: 'pcs',
            stock: 10,
            minStock: 2,
            tags: ['umum', 'stok'],
          },
        ],
        paymentMethods: [...SHARED_PAYMENT_METHODS],
        cashCategories: [
          { name: 'Penjualan', type: 'Pemasukan' },
          { name: 'Pembelian Stok', type: 'Pengeluaran' },
          { name: 'Operasional', type: 'Pengeluaran' },
        ],
        quickActions: ['Transaksi baru', 'Tambah stok', 'Catat kas'],
        reportKeys: ['ringkasan', 'penjualan', 'stok', 'kas', 'piutang'],
        dashboardFocus: ['stok', 'penjualan', 'kas'],
      },
    ],
  },
}

export const DEFAULT_VERTICAL: BusinessVerticalId = 'atk_printing'
export const DEFAULT_BUSINESS_MODE: BusinessModeId = 'atk_printing_combo'
