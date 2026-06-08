import { type PosProduct } from '@/features/pos/types/pos.types'

export const mockPosProducts: PosProduct[] = [
  { id: '1', sku: 'MKN-001', name: 'Nasi Goreng', category: 'Makanan', price: 25000, stock: 18, unit: 'porsi', isFavorite: true },
  { id: '2', sku: 'MKN-002', name: 'Mie Ayam', category: 'Makanan', price: 18000, stock: 22, unit: 'porsi', isFavorite: false },
  { id: '3', sku: 'MNM-001', name: 'Es Teh Manis', category: 'Minuman', price: 8000, stock: 40, unit: 'gelas', isFavorite: true },
  { id: '4', sku: 'MNM-002', name: 'Kopi Susu', category: 'Minuman', price: 15000, stock: 12, unit: 'gelas', isFavorite: false },
  { id: '5', sku: 'SMB-001', name: 'Beras 5 Kg', category: 'Sembako', price: 76000, stock: 9, unit: 'sak', isFavorite: false },
  { id: '6', sku: 'SMB-002', name: 'Minyak Goreng 1L', category: 'Sembako', price: 19000, stock: 5, unit: 'botol', isFavorite: false },
  { id: '7', sku: 'SMB-003', name: 'Gula Pasir 1 Kg', category: 'Sembako', price: 17500, stock: 15, unit: 'pack', isFavorite: false },
  { id: '8', sku: 'PRW-001', name: 'Shampoo Sachet', category: 'Perawatan', price: 2500, stock: 50, unit: 'pcs', isFavorite: true },
  { id: '9', sku: 'PRW-002', name: 'Sabun Mandi', category: 'Perawatan', price: 4500, stock: 28, unit: 'pcs', isFavorite: false },
  { id: '10', sku: 'SNK-001', name: 'Keripik Singkong', category: 'Snack', price: 12000, stock: 16, unit: 'pack', isFavorite: false },
  { id: '11', sku: 'SNK-002', name: 'Roti Coklat', category: 'Snack', price: 7000, stock: 6, unit: 'pcs', isFavorite: false },
  { id: '12', sku: 'MNM-003', name: 'Air Mineral', category: 'Minuman', price: 5000, stock: 32, unit: 'botol', isFavorite: true },
]
