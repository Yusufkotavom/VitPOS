export type BusinessVerticalId = 'atk_printing' | 'service_gadget' | 'service_computer' | 'general'
export type BusinessModeId =
  | 'atk_only'
  | 'printing_only'
  | 'atk_printing_combo'
  | 'hp_service_repair'
  | 'hp_accessories_combo'
  | 'computer_service_repair'
  | 'computer_printer_combo'
  | 'general_standard'

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
  service_gadget: {
    id: 'service_gadget',
    label: 'Servis HP & Gadget',
    description: 'Toko servis handphone, ganti LCD & baterai, sparepart gadget, dan aksesoris.',
    modes: [
      {
        id: 'hp_service_repair',
        label: 'Servis HP saja',
        description: 'Fokus pengerjaan tiket servis, diagnosa kerusakan, dan suku cadang.',
        categories: ['Jasa Servis HP', 'LCD & Layar', 'Baterai Original', 'Sparepart Mesin', 'Biaya Diagnosa'],
        products: [
          { name: 'Jasa Ganti LCD Touchscreen', category: 'Jasa Servis HP', price: 150000, cost: 50000, type: 'Jasa', unit: 'unit', stock: 0, minStock: 0, tags: ['servis', 'hp', 'jasa'] },
          { name: 'Jasa Ganti Baterai HP', category: 'Jasa Servis HP', price: 100000, cost: 35000, type: 'Jasa', unit: 'unit', stock: 0, minStock: 0, tags: ['servis', 'hp', 'jasa'] },
          { name: 'Flash & Bypass Software', category: 'Jasa Servis HP', price: 75000, cost: 10000, type: 'Jasa', unit: 'unit', stock: 0, minStock: 0, tags: ['servis', 'software', 'jasa'] },
          { name: 'Baterai iPhone High Capacity', category: 'Baterai Original', price: 220000, cost: 150000, type: 'Produk Fisik', unit: 'pcs', stock: 5, minStock: 2, tags: ['sparepart', 'stok'] },
          { name: 'Lem LCD B7000 15ml', category: 'Sparepart Mesin', price: 25000, cost: 15000, type: 'Produk Fisik', unit: 'pcs', stock: 8, minStock: 2, tags: ['alat', 'stok'] },
        ],
        paymentMethods: [...SHARED_PAYMENT_METHODS],
        cashCategories: [
          { name: 'Pendapatan Jasa Servis', type: 'Pemasukan' },
          { name: 'Penjualan Sparepart', type: 'Pemasukan' },
          { name: 'Beli Sparepart HP', type: 'Pengeluaran' },
          { name: 'Alat & Solder Teknisi', type: 'Pengeluaran' },
        ],
        quickActions: ['Buat tiket servis', 'Cek status servis', 'Tambah sparepart', 'Catat kas'],
        reportKeys: ['ringkasan', 'penjualan', 'stok', 'kas', 'piutang'],
        dashboardFocus: ['servis_aktif', 'sparepart_menipis', 'kas'],
      },
      {
        id: 'hp_accessories_combo',
        label: 'Servis + Aksesoris HP',
        description: 'Kombinasi kasir cepat toko aksesoris dan penerimaan unit servis HP.',
        categories: ['Aksesori & Kabel', 'Pelindung Layar', 'Jasa Servis HP', 'LCD & Baterai'],
        products: [
          { name: 'Kabel Data Type-C Fast Charge', category: 'Aksesori & Kabel', price: 35000, cost: 18000, type: 'Produk Fisik', unit: 'pcs', stock: 30, minStock: 5, tags: ['aksesori', 'stok', 'laris'] },
          { name: 'Tempered Glass Bening 9H', category: 'Pelindung Layar', price: 25000, cost: 8000, type: 'Produk Fisik', unit: 'pcs', stock: 50, minStock: 10, tags: ['aksesori', 'stok', 'laris'] },
          { name: 'Kepala Charger 20W Quick Charge', category: 'Aksesori & Kabel', price: 75000, cost: 42000, type: 'Produk Fisik', unit: 'pcs', stock: 15, minStock: 3, tags: ['aksesori', 'stok'] },
          { name: 'Jasa Ganti LCD Touchscreen', category: 'Jasa Servis HP', price: 150000, cost: 50000, type: 'Jasa', unit: 'unit', stock: 0, minStock: 0, tags: ['servis', 'hp', 'jasa'] },
          { name: 'Jasa Ganti Baterai HP', category: 'Jasa Servis HP', price: 100000, cost: 35000, type: 'Jasa', unit: 'unit', stock: 0, minStock: 0, tags: ['servis', 'hp', 'jasa'] },
        ],
        paymentMethods: [...SHARED_PAYMENT_METHODS],
        cashCategories: [
          { name: 'Penjualan Aksesoris', type: 'Pemasukan' },
          { name: 'Pendapatan Jasa Servis', type: 'Pemasukan' },
          { name: 'Beli Stok Aksesoris & Part', type: 'Pengeluaran' },
          { name: 'Operasional Toko', type: 'Pengeluaran' },
        ],
        quickActions: ['Transaksi kasir baru', 'Buat tiket servis', 'Tambah stok', 'Lacak unit servis'],
        reportKeys: ['ringkasan', 'penjualan', 'stok', 'kas', 'piutang'],
        dashboardFocus: ['barang', 'servis', 'stok', 'kas'],
      },
    ],
  },
  service_computer: {
    id: 'service_computer',
    label: 'Servis Komputer, Laptop & Printer',
    description: 'Reparasi laptop, instalasi PC, servis printer infus/head, dan perlengkapan komputer.',
    modes: [
      {
        id: 'computer_service_repair',
        label: 'Servis Laptop & PC saja',
        description: 'Fokus reparasi hardware, install ulang sistem, dan upgrade komponen.',
        categories: ['Jasa Komputer & Laptop', 'Storage & RAM', 'Thermal Paste & Fan', 'Perangkat Keras'],
        products: [
          { name: 'Install Ulang OS + Software Standar', category: 'Jasa Komputer & Laptop', price: 100000, cost: 20000, type: 'Jasa', unit: 'unit', stock: 0, minStock: 0, tags: ['servis', 'pc', 'jasa'] },
          { name: 'Deep Cleaning & Ganti Thermal Paste', category: 'Jasa Komputer & Laptop', price: 125000, cost: 30000, type: 'Jasa', unit: 'unit', stock: 0, minStock: 0, tags: ['servis', 'laptop', 'jasa'] },
          { name: 'SSD NVMe 512GB PCIe Gen3', category: 'Storage & RAM', price: 480000, cost: 385000, type: 'Produk Fisik', unit: 'pcs', stock: 6, minStock: 2, tags: ['sparepart', 'stok'] },
          { name: 'RAM DDR4 8GB PC 3200MHz', category: 'Storage & RAM', price: 290000, cost: 230000, type: 'Produk Fisik', unit: 'pcs', stock: 8, minStock: 2, tags: ['sparepart', 'stok'] },
          { name: 'Jasa Perbaikan Engsel Laptop', category: 'Jasa Komputer & Laptop', price: 150000, cost: 40000, type: 'Jasa', unit: 'unit', stock: 0, minStock: 0, tags: ['servis', 'laptop', 'jasa'] },
        ],
        paymentMethods: [...SHARED_PAYMENT_METHODS],
        cashCategories: [
          { name: 'Pendapatan Jasa Servis PC/Laptop', type: 'Pemasukan' },
          { name: 'Penjualan Komponen & SSD', type: 'Pemasukan' },
          { name: 'Beli Komponen & Sparepart', type: 'Pengeluaran' },
          { name: 'Alat & Bahan Kimia Pembersih', type: 'Pengeluaran' },
        ],
        quickActions: ['Buat tiket servis', 'Cari pelanggan servis', 'Tambah komponen', 'Catat pengeluaran'],
        reportKeys: ['ringkasan', 'penjualan', 'stok', 'kas', 'piutang'],
        dashboardFocus: ['servis_selesai', 'garansi_aktif', 'stok_sparepart', 'kas'],
      },
      {
        id: 'computer_printer_combo',
        label: 'Servis Komputer + Printer & Tinta',
        description: 'Kombinasi komprehensif servis komputer dan servis printer head/infus.',
        categories: ['Jasa Servis Komputer', 'Jasa Servis Printer', 'Tinta & Cartridge', 'Sparepart Komputer'],
        products: [
          { name: 'Install Ulang OS + Software', category: 'Jasa Servis Komputer', price: 100000, cost: 20000, type: 'Jasa', unit: 'unit', stock: 0, minStock: 0, tags: ['servis', 'jasa'] },
          { name: 'Servis Printer Head Buntu / Cleaning', category: 'Jasa Servis Printer', price: 90000, cost: 25000, type: 'Jasa', unit: 'unit', stock: 0, minStock: 0, tags: ['servis', 'printer', 'jasa'] },
          { name: 'Tinta Botol 003 Black 65ml', category: 'Tinta & Cartridge', price: 85000, cost: 68000, type: 'Produk Fisik', unit: 'botol', stock: 12, minStock: 3, tags: ['tinta', 'stok', 'laris'] },
          { name: 'Cartridge PG-810 Black Original', category: 'Tinta & Cartridge', price: 260000, cost: 220000, type: 'Produk Fisik', unit: 'pcs', stock: 6, minStock: 2, tags: ['cartridge', 'stok'] },
          { name: 'SSD SATA 256GB 2.5 Inch', category: 'Sparepart Komputer', price: 260000, cost: 195000, type: 'Produk Fisik', unit: 'pcs', stock: 10, minStock: 3, tags: ['sparepart', 'stok'] },
        ],
        paymentMethods: [...SHARED_PAYMENT_METHODS],
        cashCategories: [
          { name: 'Jasa Servis PC & Printer', type: 'Pemasukan' },
          { name: 'Penjualan Tinta & Sparepart', type: 'Pemasukan' },
          { name: 'Beli Stok Tinta & Part', type: 'Pengeluaran' },
          { name: 'Operasional Workshop', type: 'Pengeluaran' },
        ],
        quickActions: ['Transaksi baru', 'Tiket servis masuk', 'Update pengerjaan', 'Lacak status'],
        reportKeys: ['ringkasan', 'penjualan', 'stok', 'kas', 'piutang'],
        dashboardFocus: ['servis', 'tinta_laris', 'stok_kritis', 'kas'],
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
