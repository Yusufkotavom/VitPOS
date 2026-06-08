import type {
  ConflictResolution,
  ConflictStatus,
  LocalOutboxStatus as OutboxStatus,
  SyncEntityType,
  SyncMutationType,
  SyncMutationRecord as OutboxItem,
} from '@kotacom/shared-contracts/sync'

export type SyncStatus = 'pending' | 'synced' | 'failed' | 'conflict'
export type ProductStatus = 'Aktif' | 'Draft' | 'Arsip'
export type ProductType = 'Produk Fisik' | 'Jasa'
export type SalesOrderStatus = 'Draft' | 'Lunas' | 'Sebagian' | 'Belum Bayar' | 'Batal'
export type PaymentStatus = 'Berhasil' | 'Pending' | 'Gagal' | 'Refund'
export type PosPaymentMethodCode = 'tunai' | 'qris' | 'kartu' | 'transfer' | 'e-wallet' | 'piutang'
export type StockMovementType = 'sale' | 'purchase' | 'return' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'damage_lost'

export type LocalProduct = {
  id: string
  name: string
  category: string
  type: ProductType
  price: number
  stock: number
  sku?: string
  barcode?: string
  status: ProductStatus
  syncStatus: SyncStatus
  version: number
  updatedAt: string
}

export type LocalProductCategory = {
  id: string
  name: string
  description?: string
  status: 'Aktif' | 'Arsip'
  syncStatus: SyncStatus
  version: number
  updatedAt: string
}

export type LocalCustomer = {
  id: string
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
  salesOrderId: string
  productId: string
  name: string
  qty: number
  unitPrice: number
  subtotal: number
}

export type LocalSalesOrder = {
  id: string
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
  product: string
  warehouse: string
  stockSystem: number
  stockSafe: number
  movement: string
  status: string
}

export type LocalCash = {
  id: string
  ref: string
  date: string
  account: string
  category: string
  income: number
  expense: number
  status: string
}

export type LocalSetting = {
  id: string
  area: string
  setting: string
  value: string
  updatedAt: string
  status: string
}

export type LocalShift = {
  id: string
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
  code: string
  customerName: string
  description: string
  date: string
  cost: number
  status: ServiceOrderStatus
  syncStatus: SyncStatus
  version: number
  updatedAt: string
}

export type SyncConflict = {
  id: string
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
  startedAt: string
  finishedAt?: string
  status: 'running' | 'success' | 'failed'
  processed: number
  failed: number
  pulled?: number
}

export type { ConflictResolution, ConflictStatus, OutboxItem, OutboxStatus, SyncEntityType, SyncMutationType }
