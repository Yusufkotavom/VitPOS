import {
  BUSINESS_PLAYBOOKS,
  DEFAULT_BUSINESS_MODE,
  DEFAULT_VERTICAL,
  type BusinessModeId,
  type BusinessVerticalId,
} from '@/features/auth/data/business-playbooks'

export type TemplatePreset = {
  businessVertical?: BusinessVerticalId
  businessMode?: BusinessModeId
  categories: { name: string; description?: string }[]
  products: { name: string; category: string; price: number; type: 'Produk Fisik' | 'Jasa' }[]
  paymentMethods: { name: string; provider: string; type: string }[]
  cashCategories: { name: string; type: 'Pemasukan' | 'Pengeluaran' }[]
  customer: { name: string; phone: string; city: string }
  supplier: { name: string; phone: string; city: string }
}

const combo = BUSINESS_PLAYBOOKS[DEFAULT_VERTICAL].modes.find((mode) => mode.id === DEFAULT_BUSINESS_MODE)!

export const TEMPLATE_PRESETS: Record<string, TemplatePreset> = {
  atk_printing: {
    businessVertical: DEFAULT_VERTICAL,
    businessMode: DEFAULT_BUSINESS_MODE,
    categories: combo.categories.map((name) => ({ name })),
    products: combo.products.map((item) => ({
      name: item.name,
      category: item.category,
      price: item.price,
      type: item.type,
    })),
    paymentMethods: [...combo.paymentMethods],
    cashCategories: [...combo.cashCategories],
    customer: { name: 'Pelanggan Umum', phone: '081234567890', city: 'Surabaya' },
    supplier: { name: 'Supplier ATK Utama', phone: '081234567891', city: 'Surabaya' },
  },
  retail: {
    categories: [
      { name: 'Makanan & Minuman', description: 'Produk makanan dan minuman' },
      { name: 'Elektronik', description: 'Alat elektronik dan aksesoris' },
      { name: 'Rumah Tangga', description: 'Kebutuhan rumah tangga' },
    ],
    products: [
      { name: 'Snack Curah', category: 'Makanan & Minuman', price: 5000, type: 'Produk Fisik' },
      { name: 'Beras 5kg', category: 'Makanan & Minuman', price: 65000, type: 'Produk Fisik' },
      { name: 'Kabel Listrik', category: 'Elektronik', price: 15000, type: 'Produk Fisik' },
      { name: 'Sabun Cuci', category: 'Rumah Tangga', price: 12000, type: 'Produk Fisik' },
    ],
    paymentMethods: [
      { name: 'Tunai', provider: 'Tunai', type: 'tunai' },
      { name: 'QRIS', provider: 'QRIS', type: 'qris' },
      { name: 'Transfer Bank', provider: 'Bank', type: 'transfer' },
    ],
    cashCategories: [
      { name: 'Penjualan Tunai', type: 'Pemasukan' },
      { name: 'Penjualan Transfer', type: 'Pemasukan' },
      { name: 'Pembelian Stok', type: 'Pengeluaran' },
      { name: 'Operasional Toko', type: 'Pengeluaran' },
    ],
    customer: { name: 'Pelanggan Umum', phone: '081234567890', city: 'Jakarta' },
    supplier: { name: 'Supplier Umum', phone: '081234567891', city: 'Jakarta' },
  },

  fnb: {
    categories: [
      { name: 'Makanan', description: 'Menu makanan' },
      { name: 'Minuman', description: 'Menu minuman' },
      { name: 'Camilan', description: 'Camilan ringan' },
    ],
    products: [
      { name: 'Nasi Goreng', category: 'Makanan', price: 25000, type: 'Produk Fisik' },
      { name: 'Es Teh Manis', category: 'Minuman', price: 5000, type: 'Produk Fisik' },
      { name: 'Ayam Goreng', category: 'Makanan', price: 20000, type: 'Produk Fisik' },
      { name: 'Pisang Goreng', category: 'Camilan', price: 10000, type: 'Produk Fisik' },
    ],
    paymentMethods: [
      { name: 'Tunai', provider: 'Tunai', type: 'tunai' },
      { name: 'QRIS', provider: 'QRIS', type: 'qris' },
    ],
    cashCategories: [
      { name: 'Penjualan Makanan', type: 'Pemasukan' },
      { name: 'Penjualan Minuman', type: 'Pemasukan' },
      { name: 'Bahan Baku', type: 'Pengeluaran' },
      { name: 'Operasional Dapur', type: 'Pengeluaran' },
    ],
    customer: { name: 'Pelanggan Umum', phone: '081234567890', city: 'Jakarta' },
    supplier: { name: 'Supplier Bahan Baku', phone: '081234567891', city: 'Jakarta' },
  },

  jasa: {
    categories: [
      { name: 'Jasa Utama', description: 'Layanan jasa utama' },
      { name: 'Jasa Pendukung', description: 'Layanan pendukung' },
    ],
    products: [
      { name: 'Jasa Cuci AC', category: 'Jasa Utama', price: 75000, type: 'Jasa' },
      { name: 'Jasa Service HP', category: 'Jasa Utama', price: 100000, type: 'Jasa' },
      { name: 'Konsultasi', category: 'Jasa Pendukung', price: 50000, type: 'Jasa' },
    ],
    paymentMethods: [
      { name: 'Tunai', provider: 'Tunai', type: 'tunai' },
      { name: 'Transfer Bank', provider: 'Bank', type: 'transfer' },
    ],
    cashCategories: [
      { name: 'Pendapatan Jasa', type: 'Pemasukan' },
      { name: 'Pendapatan Konsultasi', type: 'Pemasukan' },
      { name: 'Operasional', type: 'Pengeluaran' },
      { name: 'Transportasi', type: 'Pengeluaran' },
    ],
    customer: { name: 'Pelanggan Umum', phone: '081234567890', city: 'Jakarta' },
    supplier: { name: 'Vendor Penyedia', phone: '081234567891', city: 'Jakarta' },
  },

  grosir: {
    categories: [
      { name: 'Sembako', description: 'Bahan pokok sembilan bahan' },
      { name: 'Minuman', description: 'Minuman kemasan' },
      { name: 'Rumah Tangga', description: 'Kebutuhan rumah tangga' },
    ],
    products: [
      { name: 'Beras 25kg', category: 'Sembako', price: 250000, type: 'Produk Fisik' },
      { name: 'Minyak Goreng 2L', category: 'Sembako', price: 35000, type: 'Produk Fisik' },
      { name: 'Air Mineral Dus', category: 'Minuman', price: 25000, type: 'Produk Fisik' },
      { name: 'Deterjen 1kg', category: 'Rumah Tangga', price: 18000, type: 'Produk Fisik' },
    ],
    paymentMethods: [
      { name: 'Tunai', provider: 'Tunai', type: 'tunai' },
      { name: 'Transfer Bank', provider: 'Bank', type: 'transfer' },
    ],
    cashCategories: [
      { name: 'Penjualan Tunai', type: 'Pemasukan' },
      { name: 'Penjualan Transfer', type: 'Pemasukan' },
      { name: 'Pembelian Stok', type: 'Pengeluaran' },
      { name: 'Biaya Gudang', type: 'Pengeluaran' },
    ],
    customer: { name: 'Pelanggan Grosir', phone: '081234567890', city: 'Jakarta' },
    supplier: { name: 'Supplier Utama', phone: '081234567891', city: 'Jakarta' },
  },

  klinik: {
    categories: [
      { name: 'Umum', description: 'Layanan kesehatan umum' },
      { name: 'Gigi', description: 'Layanan kesehatan gigi' },
      { name: 'Obat', description: 'Obat-obatan' },
    ],
    products: [
      { name: 'Jasa Periksa Umum', category: 'Umum', price: 50000, type: 'Jasa' },
      { name: 'Jasa Cabut Gigi', category: 'Gigi', price: 150000, type: 'Jasa' },
      { name: 'Paracetamol', category: 'Obat', price: 10000, type: 'Produk Fisik' },
      { name: 'Vitamin C', category: 'Obat', price: 25000, type: 'Produk Fisik' },
    ],
    paymentMethods: [
      { name: 'Tunai', provider: 'Tunai', type: 'tunai' },
      { name: 'QRIS', provider: 'QRIS', type: 'qris' },
      { name: 'Kartu Debit', provider: 'Bank', type: 'kartu' },
    ],
    cashCategories: [
      { name: 'Pendapatan Jasa', type: 'Pemasukan' },
      { name: 'Penjualan Obat', type: 'Pemasukan' },
      { name: 'Alat Kesehatan', type: 'Pengeluaran' },
      { name: 'Operasional Klinik', type: 'Pengeluaran' },
    ],
    customer: { name: 'Pasien Umum', phone: '081234567890', city: 'Jakarta' },
    supplier: { name: 'Supplier Obat', phone: '081234567891', city: 'Jakarta' },
  },

  lainnya: {
    categories: [
      { name: 'Produk Utama', description: 'Produk utama bisnis' },
      { name: 'Produk Lain', description: 'Produk tambahan' },
    ],
    products: [
      { name: 'Produk Utama 1', category: 'Produk Utama', price: 50000, type: 'Produk Fisik' },
      { name: 'Produk Lain 1', category: 'Produk Lain', price: 25000, type: 'Produk Fisik' },
    ],
    paymentMethods: [
      { name: 'Tunai', provider: 'Tunai', type: 'tunai' },
      { name: 'QRIS', provider: 'QRIS', type: 'qris' },
    ],
    cashCategories: [
      { name: 'Pendapatan Utama', type: 'Pemasukan' },
      { name: 'Operasional', type: 'Pengeluaran' },
    ],
    customer: { name: 'Pelanggan', phone: '081234567890', city: 'Jakarta' },
    supplier: { name: 'Supplier', phone: '081234567891', city: 'Jakarta' },
  },
}

export const TEMPLATE_LABELS: Record<string, string> = {
  atk_printing: 'ATK & Printing',
  retail: 'Toko Retail',
  fnb: 'F&B / Makanan Minuman',
  jasa: 'Jasa',
  grosir: 'Grosir',
  klinik: 'Klinik',
  lainnya: 'Lainnya',
}

export const TEMPLATE_ICONS: Record<string, string> = {
  atk_printing: 'Package',
  retail: 'ShoppingCart',
  fnb: 'Coffee',
  jasa: 'Monitor',
  grosir: 'Package',
  klinik: 'Stethoscope',
  lainnya: 'Building2',
}
