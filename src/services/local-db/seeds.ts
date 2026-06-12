import { baimRuntime } from '@/lib/baim-runtime'
import { localDb } from '@/services/local-db/client'
import { createPlaybookSeedBundle } from '@/services/local-db/seed-playbooks'
import type {
  LocalCash,
  LocalCustomer,
  LocalInventory,
  LocalPayment,
  LocalProduct,
  LocalSalesOrder,
  LocalSetting,
  LocalStockMovement,
  OutboxItem,
  SyncConflict,
} from '@/services/local-db/schema'

function now() {
  return new Date().toISOString()
}

export const DEMO_TENANT_ID = baimRuntime.tenantId

export const demoProducts: LocalProduct[] = [
  { id: baimRuntime.productId, tenantId: DEMO_TENANT_ID, name: 'Kabel Type-C Fast Charging', category: 'Aksesoris', type: 'Produk Fisik', price: 45000, stock: 24, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now() },
  { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', tenantId: DEMO_TENANT_ID, name: 'Jasa Ganti LCD', category: 'Service HP', type: 'Jasa', price: 350000, stock: 0, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now() },
  { id: 'aaaa1111-1111-4111-8111-111111111111', tenantId: DEMO_TENANT_ID, name: 'Adaptor 20W Apple', category: 'Aksesoris', type: 'Produk Fisik', price: 150000, stock: 12, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now() },
  { id: 'bbbb2222-2222-4222-8222-222222222222', tenantId: DEMO_TENANT_ID, name: 'Tempered Glass iPhone 13', category: 'Aksesoris', type: 'Produk Fisik', price: 35000, stock: 40, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now() },
  { id: 'cccc3333-3333-4333-8333-333333333333', tenantId: DEMO_TENANT_ID, name: 'Service Baterai Android', category: 'Service HP', type: 'Jasa', price: 150000, stock: 0, status: 'Draft', syncStatus: 'pending', version: 1, updatedAt: now() },
]

export const demoCustomers: LocalCustomer[] = [
  { id: baimRuntime.customerId, tenantId: DEMO_TENANT_ID, name: 'Budi Santoso', phone: '0812-3456-7890', city: 'Surabaya', receivable: 450000, orders: 18, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now() },
  { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', tenantId: DEMO_TENANT_ID, name: 'Sari Printing', phone: '0857-1111-2222', city: 'Sidoarjo', receivable: 1200000, orders: 9, status: 'Piutang', syncStatus: 'synced', version: 1, updatedAt: now() },
  { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', tenantId: DEMO_TENANT_ID, name: 'Toko Maju Jaya', phone: '0821-3333-4444', city: 'Malang', receivable: 0, orders: 27, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now() },
  { id: 'dddd4444-4444-4444-8444-444444444444', tenantId: DEMO_TENANT_ID, name: 'Ani Wijaya', phone: '0899-8888-7777', city: 'Surabaya', receivable: 0, orders: 3, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now() },
  { id: 'eeee5555-5555-4555-8555-555555555555', tenantId: DEMO_TENANT_ID, name: 'Rudi Hermawan', phone: '0838-5555-6666', city: 'Gresik', receivable: 150000, orders: 5, status: 'Piutang', syncStatus: 'synced', version: 1, updatedAt: now() },
]

export const demoSalesOrders: LocalSalesOrder[] = [
  {
    id: baimRuntime.salesOrderId,
    tenantId: DEMO_TENANT_ID,
    code: 'INV-240608-001',
    customerName: 'Budi Santoso',
    date: '8 Juni 2026',
    subtotal: 450000,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 450000,
    paidTotal: 450000,
    status: 'Lunas',
    items: [
      { id: baimRuntime.salesOrderItemId, tenantId: DEMO_TENANT_ID, salesOrderId: baimRuntime.salesOrderId, productId: baimRuntime.productId, name: 'Kabel Type-C Fast Charging', qty: 10, unitPrice: 45000, subtotal: 450000 },
    ],
    syncStatus: 'synced',
    version: 1,
    updatedAt: now(),
  },
  {
    id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    tenantId: DEMO_TENANT_ID,
    code: 'INV-240608-002',
    customerName: 'Sari Printing',
    date: '8 Juni 2026',
    subtotal: 1200000,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 1200000,
    paidTotal: 500000,
    status: 'Sebagian',
    items: [],
    syncStatus: 'synced',
    version: 1,
    updatedAt: now(),
  },
  {
    id: '12121212-1212-4212-8212-121212121212',
    tenantId: DEMO_TENANT_ID,
    code: 'INV-240608-003',
    customerName: 'Toko Maju Jaya',
    date: '8 Juni 2026',
    subtotal: 875000,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 875000,
    paidTotal: 0,
    status: 'Belum Bayar',
    items: [],
    syncStatus: 'pending',
    version: 1,
    updatedAt: now(),
  },
  {
    id: 'ffff6666-6666-4666-8666-666666666666',
    tenantId: DEMO_TENANT_ID,
    code: 'INV-240608-004',
    customerName: 'Ani Wijaya',
    date: '8 Juni 2026',
    subtotal: 35000,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 35000,
    paidTotal: 35000,
    status: 'Lunas',
    items: [],
    syncStatus: 'synced',
    version: 1,
    updatedAt: now(),
  },
  {
    id: '12127777-7777-4777-8777-777777777777',
    tenantId: DEMO_TENANT_ID,
    code: 'INV-240608-005',
    customerName: 'Umum',
    date: '8 Juni 2026',
    subtotal: 150000,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 150000,
    paidTotal: 150000,
    status: 'Lunas',
    items: [],
    syncStatus: 'synced',
    version: 1,
    updatedAt: now(),
  },
]

export const demoPayments: LocalPayment[] = [
  { id: baimRuntime.paymentId, tenantId: DEMO_TENANT_ID, ref: 'PAY-001', salesOrderId: baimRuntime.salesOrderId, source: 'POS', method: 'tunai', amount: 450000, date: '8 Juni 2026', status: 'Berhasil', syncStatus: 'synced', version: 1, updatedAt: now() },
  { id: '34343434-3434-4434-8434-343434343434', tenantId: DEMO_TENANT_ID, ref: 'PAY-002', source: 'Invoice', method: 'qris', amount: 500000, date: '8 Juni 2026', status: 'Pending', syncStatus: 'pending', version: 1, updatedAt: now() },
  { id: '56565656-5656-4565-8565-565656565656', tenantId: DEMO_TENANT_ID, ref: 'PAY-003', source: 'Service', method: 'transfer', amount: 120000, date: '8 Juni 2026', status: 'Refund', syncStatus: 'failed', version: 1, updatedAt: now() },
]

export const demoStockMovements: LocalStockMovement[] = [
  { id: baimRuntime.stockMovementId, tenantId: DEMO_TENANT_ID, productId: baimRuntime.productId, productName: 'Kabel Type-C', warehouseName: 'Gudang Utama', type: 'sale', qty: -2, referenceType: 'sale', referenceId: baimRuntime.salesOrderId, syncStatus: 'synced', updatedAt: now() },
  { id: '78787878-7878-4787-8787-787878787878', tenantId: DEMO_TENANT_ID, productId: '78788888-8888-4888-8888-888888888888', productName: 'Adaptor 20W Apple', warehouseName: 'Gudang Utama', type: 'purchase', qty: 12, referenceType: 'purchase', syncStatus: 'synced', updatedAt: now() },
  { id: '90909090-9090-4090-8090-909090909090', tenantId: DEMO_TENANT_ID, productId: 'bbbb2222-2222-4222-8222-222222222222', productName: 'Tempered Glass iPhone 13', warehouseName: 'Gudang Toko', type: 'sale', qty: -5, referenceType: 'sale', syncStatus: 'synced', updatedAt: now() },
]

export const demoInventory: LocalInventory[] = [
  { id: baimRuntime.stockMovementId, tenantId: DEMO_TENANT_ID, product: 'Kabel Type-C', warehouse: 'Gudang Utama', stockSystem: 24, stockSafe: 10, movement: 'Sale - 8 Juni 2026', status: 'Aman' },
  { id: '78787878-7878-4787-8787-787878787878', tenantId: DEMO_TENANT_ID, product: 'Minyak Goreng 1L', warehouse: 'Gudang Toko', stockSystem: 5, stockSafe: 12, movement: 'Sale - 8 Juni 2026', status: 'Stok Rendah' },
  { id: '90909090-9090-4090-8090-909090909090', tenantId: DEMO_TENANT_ID, product: 'Roti Coklat', warehouse: 'Gudang Toko', stockSystem: 0, stockSafe: 8, movement: 'Sale - 8 Juni 2026', status: 'Habis' },
  { id: '78788888-8888-4888-8888-888888888888', tenantId: DEMO_TENANT_ID, product: 'Adaptor 20W Apple', warehouse: 'Gudang Utama', stockSystem: 12, stockSafe: 5, movement: 'Restock - 7 Juni 2026', status: 'Aman' },
  { id: '90909999-9999-4999-8999-999999999999', tenantId: DEMO_TENANT_ID, product: 'Tempered Glass iPhone 13', warehouse: 'Gudang Toko', stockSystem: 40, stockSafe: 15, movement: 'Sale - 8 Juni 2026', status: 'Aman' },
]

export const demoCash: LocalCash[] = [
  { id: 'abababab-abab-4bab-8bab-abababababab', tenantId: DEMO_TENANT_ID, ref: 'KAS-001', date: '8 Juni 2026', account: 'Kas Toko', category: 'Penjualan', income: 3250000, expense: 0, status: 'Tercatat' },
  { id: 'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd', tenantId: DEMO_TENANT_ID, ref: 'KAS-002', date: '8 Juni 2026', account: 'Kas Toko', category: 'Listrik', income: 0, expense: 350000, status: 'Pending Sinkron' },
  { id: 'efefefef-efef-4fef-8fef-efefefefefef', tenantId: DEMO_TENANT_ID, ref: 'KAS-003', date: '8 Juni 2026', account: 'Bank BCA', category: 'Sewa', income: 0, expense: 1500000, status: 'Butuh Review' },
]

export const demoSettings: LocalSetting[] = [
  { id: 'set-1', tenantId: DEMO_TENANT_ID, area: 'Profil Usaha', setting: 'Nama usaha dan logo', value: 'Toko Sumber Rejeki', updatedAt: '8 Juni 2026', status: 'Lengkap' },
  { id: 'set-2', tenantId: DEMO_TENANT_ID, area: 'Legal', setting: 'NPWP dan NIB', value: 'Belum diisi', updatedAt: '-', status: 'Belum Lengkap' },
  { id: 'set-3', tenantId: DEMO_TENANT_ID, area: 'Struk', setting: 'Header/footer struk', value: 'Template default', updatedAt: '8 Juni 2026', status: 'Lengkap' },
]

export const demoOutboxItems: (OutboxItem & { tenantId: string })[] = [
  {
    id: 'seed-outbox-pos-001',
    tenantId: DEMO_TENANT_ID,
    entityType: 'sale',
    entityId: baimRuntime.salesOrderId,
    mutationType: 'create',
    payload: { orderNumber: 'SO-240608-001', grandTotal: 450000, source: 'POS', id: baimRuntime.salesOrderId },
    status: 'queued',
    attempts: 0,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'seed-outbox-stock-001',
    tenantId: DEMO_TENANT_ID,
    entityType: 'stock_movement',
    entityId: baimRuntime.stockMovementId,
    mutationType: 'create',
    payload: { productId: baimRuntime.productId, qty: -2, type: 'sale', id: baimRuntime.stockMovementId },
    status: 'queued',
    attempts: 0,
    createdAt: now(),
    updatedAt: now(),
  },
]

export const demoConflicts: SyncConflict[] = [
  {
    id: 'seed-conflict-product-001',
    tenantId: DEMO_TENANT_ID,
    entityType: 'product',
    entityId: baimRuntime.productId,
    localValue: { name: 'Kabel Type-C Fast Charging', salePrice: 45000 },
    cloudValue: { name: 'Kabel Type-C Premium', salePrice: 50000 },
    reason: 'field_conflict',
    status: 'open',
    createdAt: now(),
  },
]

export function createDemoPlaybookSeedBundle(tenantId: string = DEMO_TENANT_ID) {
  return createPlaybookSeedBundle(tenantId)
}

export async function clearLocalDemoData() {
  await Promise.all([
    localDb.products.where('tenantId').equals(DEMO_TENANT_ID).delete(),
    localDb.customers.where('tenantId').equals(DEMO_TENANT_ID).delete(),
    localDb.salesOrders.where('tenantId').equals(DEMO_TENANT_ID).delete(),
    localDb.salesOrderItems.where('tenantId').equals(DEMO_TENANT_ID).delete(),
    localDb.payments.where('tenantId').equals(DEMO_TENANT_ID).delete(),
    localDb.stockMovements.where('tenantId').equals(DEMO_TENANT_ID).delete(),
    localDb.inventory.where('tenantId').equals(DEMO_TENANT_ID).delete(),
    localDb.cash.where('tenantId').equals(DEMO_TENANT_ID).delete(),
    localDb.productCategories.where('tenantId').equals(DEMO_TENANT_ID).delete(),
    localDb.cashCategories.where('tenantId').equals(DEMO_TENANT_ID).delete(),
    localDb.settings.where('tenantId').equals(DEMO_TENANT_ID).delete(),
    localDb.outbox.where('tenantId').equals(DEMO_TENANT_ID).delete(),
    localDb.syncConflicts.where('tenantId').equals(DEMO_TENANT_ID).delete(),
  ])
}

export async function seedLocalDemoData() {
  const existingProducts = await localDb.products.count()
  const existingCustomers = await localDb.customers.count()
  const existingSalesOrders = await localDb.salesOrders.count()
  const existingPayments = await localDb.payments.count()
  const existingStockMovements = await localDb.stockMovements.count()
  const existingInventory = await localDb.inventory.count()
  const existingCash = await localDb.cash.count()
  const existingSettings = await localDb.settings.count()

  if (existingProducts === 0) await localDb.products.bulkPut(demoProducts)
  if (existingCustomers === 0) await localDb.customers.bulkPut(demoCustomers)
  if (existingSalesOrders === 0) await localDb.salesOrders.bulkPut(demoSalesOrders)
  if (existingPayments === 0) await localDb.payments.bulkPut(demoPayments)
  if (existingStockMovements === 0) await localDb.stockMovements.bulkPut(demoStockMovements)
  if (existingInventory === 0) await localDb.inventory.bulkPut(demoInventory)
  if (existingCash === 0) await localDb.cash.bulkPut(demoCash)
  if (existingSettings === 0) await localDb.settings.bulkPut(demoSettings)
  // Demo outbox and conflicts intentionally NOT seeded to prevent sync loops
}
