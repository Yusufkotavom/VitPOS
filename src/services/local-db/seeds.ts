import { localDb } from '@/services/local-db/client'
import {
  type LocalCash,
  type LocalCustomer,
  type LocalInventory,
  type LocalPayment,
  type LocalProduct,
  type LocalSalesOrder,
  type OutboxItem,
  type SyncConflict,
} from '@/services/local-db/schema'

function now() {
  return new Date().toISOString()
}

export const demoProducts: LocalProduct[] = [
  { id: 'prd-1', name: 'Kabel Type-C Fast Charging', category: 'Aksesoris', type: 'Produk Fisik', price: 'Rp 45.000', stock: '24 pcs', status: 'Aktif' },
  { id: 'prd-2', name: 'Jasa Ganti LCD', category: 'Service HP', type: 'Jasa', price: 'Rp 350.000', stock: '-', status: 'Aktif' },
]

export const demoCustomers: LocalCustomer[] = [
  { id: 'cus-1', name: 'Budi Santoso', phone: '0812-3456-7890', city: 'Surabaya', receivable: 'Rp 450.000', orders: '18', status: 'Aktif' },
  { id: 'cus-2', name: 'Sari Printing', phone: '0857-1111-2222', city: 'Sidoarjo', receivable: 'Rp 1.200.000', orders: '9', status: 'Piutang' },
  { id: 'cus-3', name: 'Toko Maju Jaya', phone: '0821-3333-4444', city: 'Malang', receivable: 'Rp 0', orders: '27', status: 'Aktif' },
]

export const demoSalesOrders: LocalSalesOrder[] = [
  { id: 'so-1', code: 'INV-240608-001', customer: 'Budi Santoso', date: '8 Juni 2026', total: 'Rp 450.000', paid: 'Rp 450.000', status: 'Lunas' },
  { id: 'so-2', code: 'INV-240608-002', customer: 'Sari Printing', date: '8 Juni 2026', total: 'Rp 1.200.000', paid: 'Rp 500.000', status: 'Sebagian' },
  { id: 'so-3', code: 'INV-240608-003', customer: 'Toko Maju Jaya', date: '8 Juni 2026', total: 'Rp 875.000', paid: 'Rp 0', status: 'Belum Bayar' },
]

export const demoPayments: LocalPayment[] = [
  { id: 'pay-1', ref: 'PAY-001', source: 'POS', method: 'Tunai', amount: 'Rp 450.000', date: '8 Juni 2026', status: 'Berhasil' },
  { id: 'pay-2', ref: 'PAY-002', source: 'Invoice', method: 'QRIS', amount: 'Rp 500.000', date: '8 Juni 2026', status: 'Pending' },
  { id: 'pay-3', ref: 'PAY-003', source: 'Service', method: 'Transfer', amount: 'Rp 120.000', date: '8 Juni 2026', status: 'Refund' },
]

export const demoInventory: LocalInventory[] = [
  { id: 'inv-1', product: 'Kabel Type-C', warehouse: 'Gudang Utama', stockSystem: '24 pcs', stockSafe: '10 pcs', movement: 'Sale - 8 Juni 2026', status: 'Aman' },
  { id: 'inv-2', product: 'Minyak Goreng 1L', warehouse: 'Gudang Toko', stockSystem: '5 botol', stockSafe: '12 botol', movement: 'Sale - 8 Juni 2026', status: 'Stok Rendah' },
  { id: 'inv-3', product: 'Roti Coklat', warehouse: 'Gudang Toko', stockSystem: '0 pcs', stockSafe: '8 pcs', movement: 'Sale - 8 Juni 2026', status: 'Habis' },
]

export const demoCash: LocalCash[] = [
  { id: 'cash-1', ref: 'KAS-001', date: '8 Juni 2026', account: 'Kas Toko', category: 'Penjualan', income: 'Rp 3.250.000', expense: '-', status: 'Tercatat' },
  { id: 'cash-2', ref: 'KAS-002', date: '8 Juni 2026', account: 'Kas Toko', category: 'Listrik', income: '-', expense: 'Rp 350.000', status: 'Pending Sinkron' },
  { id: 'cash-3', ref: 'KAS-003', date: '8 Juni 2026', account: 'Bank BCA', category: 'Sewa', income: '-', expense: 'Rp 1.500.000', status: 'Butuh Review' },
]

export const demoOutboxItems: OutboxItem[] = [
  {
    id: 'seed-outbox-pos-001',
    entityType: 'sale',
    entityId: 'SO-240608-001',
    mutationType: 'create',
    payload: { orderNumber: 'SO-240608-001', total: 450000, source: 'POS' },
    status: 'queued',
    attempts: 0,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'seed-outbox-stock-001',
    entityType: 'stock_movement',
    entityId: 'SM-240608-004',
    mutationType: 'create',
    payload: { product: 'Kabel Type-C', qty: -2, type: 'sale' },
    status: 'queued',
    attempts: 0,
    createdAt: now(),
    updatedAt: now(),
  },
]

export const demoConflicts: SyncConflict[] = [
  {
    id: 'seed-conflict-product-001',
    entityType: 'product',
    entityId: 'PRD-001',
    localValue: { name: 'Kabel Type-C Fast Charging', salePrice: 45000 },
    cloudValue: { name: 'Kabel Type-C Premium', salePrice: 50000 },
    reason: 'field_conflict',
    status: 'open',
    createdAt: now(),
  },
]

export async function seedLocalDemoData() {
  const existingProducts = await localDb.products.count()
  const existingCustomers = await localDb.customers.count()
  const existingSalesOrders = await localDb.salesOrders.count()
  const existingPayments = await localDb.payments.count()
  const existingInventory = await localDb.inventory.count()
  const existingCash = await localDb.cash.count()
  const existingOutbox = await localDb.outbox.count()
  const existingConflicts = await localDb.syncConflicts.count()

  if (existingProducts === 0) await localDb.products.bulkPut(demoProducts)
  if (existingCustomers === 0) await localDb.customers.bulkPut(demoCustomers)
  if (existingSalesOrders === 0) await localDb.salesOrders.bulkPut(demoSalesOrders)
  if (existingPayments === 0) await localDb.payments.bulkPut(demoPayments)
  if (existingInventory === 0) await localDb.inventory.bulkPut(demoInventory)
  if (existingCash === 0) await localDb.cash.bulkPut(demoCash)
  if (existingOutbox === 0) await localDb.outbox.bulkPut(demoOutboxItems)
  if (existingConflicts === 0) await localDb.syncConflicts.bulkPut(demoConflicts)
}
