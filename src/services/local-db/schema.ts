import type {
  ConflictResolution,
  ConflictStatus,
  LocalOutboxStatus as OutboxStatus,
  SyncEntityType,
  SyncMutationType,
  SyncMutationRecord as OutboxItem,
} from '@kotacom/shared-contracts/sync'

export type LocalUser = {
  id: string
  name: string
  email: string
  passwordHash: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export type LocalTenant = {
  id: string
  name: string
  type: string
  phone: string
  planCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type LocalTenantMember = {
  id: string
  tenantId: string
  userId: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type SyncStatus = 'pending' | 'synced' | 'failed' | 'conflict'
export type ProductStatus = 'Aktif' | 'Draft' | 'Arsip'
export type ProductType = 'Produk Fisik' | 'Jasa'
export type SalesOrderStatus = 'Draft' | 'Lunas' | 'Sebagian' | 'Belum Bayar' | 'Batal'
export type PaymentStatus = 'Berhasil' | 'Pending' | 'Gagal' | 'Refund'
export type PosPaymentMethodCode = string
export type StockMovementType = 'sale' | 'purchase' | 'return' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'damage_lost'

export type LocalProduct = {
  id: string
  tenantId: string
  name: string
  category: string
  type: ProductType
  price: number
  costPrice?: number
  wholesalePrice?: number
  stock: number
  manageStock?: boolean
  sku?: string
  barcode?: string
  imageUrl?: string
  icon?: string
  status: ProductStatus
  syncStatus: SyncStatus
  version: number
  updatedAt: string
}

export type LocalProductCategory = {
  id: string
  tenantId: string
  name: string
  description?: string
  status: 'Aktif' | 'Arsip'
  syncStatus: SyncStatus
  version: number
  updatedAt: string
}

export type LocalCustomer = {
  id: string
  tenantId: string
  name: string
  phone: string
  city: string
  receivable: number
  orders: number
  status: string
  syncStatus: SyncStatus
  version: number
  updatedAt: string
}

export type LocalSalesOrderItem = {
  id: string
  tenantId: string
  salesOrderId: string
  productId: string
  name: string
  qty: number
  unitPrice: number
  subtotal: number
}

export type LocalSalesOrder = {
  id: string
  tenantId: string
  code: string
  customerId?: string
  customerName: string
  date: string
  subtotal: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  paidTotal: number
  status: SalesOrderStatus
  items: LocalSalesOrderItem[]
  syncStatus: SyncStatus
  version: number
  updatedAt: string
}

export type LocalPayment = {
  id: string
  tenantId: string
  ref: string
  salesOrderId?: string
  source: string
  method: PosPaymentMethodCode
  amount: number
  date: string
  status: PaymentStatus
  syncStatus: SyncStatus
  version: number
  updatedAt: string
}

export type LocalStockMovement = {
  id: string
  tenantId: string
  productId: string
  productName: string
  warehouseId?: string
  warehouseName: string
  type: StockMovementType
  qty: number
  referenceType?: string
  referenceId?: string
  notes?: string
  syncStatus: SyncStatus
  updatedAt: string
}

export type LocalInventory = {
  id: string
  tenantId: string
  product: string
  warehouse: string
  stockSystem: number
  stockSafe: number
  movement: string
  status: string
}

export type LocalCash = {
  id: string
  tenantId: string
  ref: string
  date: string
  account: string
  category: string
  income: number
  expense: number
  status: string
}

export type LocalCashCategory = {
  id: string
  tenantId: string
  name: string
  type: 'Pemasukan' | 'Pengeluaran'
  status: 'Aktif' | 'Nonaktif'
  syncStatus: SyncStatus
  version: number
  updatedAt: string
}

export type LocalSetting = {
  id: string
  tenantId: string
  area: string
  setting: string
  value: string
  updatedAt: string
  status: string
}

export type LocalShift = {
  id: string
  tenantId: string
  cashierName: string
  startTime: string
  endTime?: string
  startCash: number
  expectedCash?: number
  actualCash?: number
  difference?: number
  status: 'open' | 'closed'
}

export type LocalSupplier = {
  id: string
  tenantId: string
  name: string
  phone: string
  city: string
  payable: number
  orders: number
  status: string
  syncStatus: SyncStatus
  version: number
  updatedAt: string
}

export type LocalPurchaseItem = {
  id: string
  tenantId: string
  purchaseId: string
  productId: string
  name: string
  qty: number
  unitPrice: number
  subtotal: number
}

export type PurchaseStatus = 'Draft' | 'Dikirim' | 'Diterima' | 'Batal'

export type LocalPurchase = {
  id: string
  tenantId: string
  code: string
  supplierId?: string
  supplierName: string
  date: string
  subtotal: number
  grandTotal: number
  status: PurchaseStatus
  items: LocalPurchaseItem[]
  syncStatus: SyncStatus
  version: number
  updatedAt: string
}

export type LocalReturnItem = {
  id: string
  tenantId: string
  returnId: string
  productId: string
  name: string
  qty: number
  unitPrice: number
  subtotal: number
}

export type ReturnType = 'Penjualan' | 'Pembelian'
export type ReturnStatus = 'Draft' | 'Diproses' | 'Selesai' | 'Batal'

export type LocalReturn = {
  id: string
  tenantId: string
  code: string
  type: ReturnType
  referenceCode: string
  date: string
  total: number
  status: ReturnStatus
  items: LocalReturnItem[]
  syncStatus: SyncStatus
  version: number
  updatedAt: string
}

export type ServiceOrderStatus = 'Diterima' | 'Dikerjakan' | 'Selesai' | 'Diambil' | 'Batal'

export type LocalServiceOrder = {
  id: string
  tenantId: string
  code: string
  customerId?: string
  customerName: string
  description: string
  date: string
  cost: number
  status: ServiceOrderStatus
  
  // New fields for POS-like behavior
  items?: { productId: string, name: string, qty: number, price: number, subtotal: number }[]
  notes?: string
  timeline?: { id: string, status: string, date: string, note: string }[]

  syncStatus: SyncStatus
  version: number
  updatedAt: string
}

export type LocalRecipeItem = {
  id: string
  tenantId: string
  recipeId: string
  productId: string
  productName: string
  qty: number
  unit: string
}

export type LocalRecipe = {
  id: string
  tenantId: string
  productId: string
  productName: string
  name: string
  batchYield: number
  items: LocalRecipeItem[]
  status: 'Draft' | 'Aktif'
  updatedAt: string
}

export type LocalPaymentMethod = {
  id: string
  tenantId: string
  name: string
  provider: string
  type: string
  accountNumber?: string
  accountName?: string
  status: 'Aktif' | 'Tidak Aktif'
  updatedAt: string
}

export type SyncConflict = {
  id: string
  tenantId: string
  entityType: SyncEntityType
  entityId: string
  localValue: unknown
  cloudValue: unknown
  reason: 'version_mismatch' | 'deleted_remotely' | 'field_conflict'
  status: 'open' | 'resolved'
  resolution?: ConflictResolution
  createdAt: string
  resolvedAt?: string
}

export type SyncRun = {
  id: string
  tenantId: string
  startedAt: string
  finishedAt?: string
  status: 'running' | 'success' | 'failed'
  processed: number
  failed: number
  pulled?: number
}

export type { ConflictResolution, ConflictStatus, OutboxItem, OutboxStatus, SyncEntityType, SyncMutationType }
