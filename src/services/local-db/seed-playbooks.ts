import {
  BUSINESS_PLAYBOOKS,
  DEFAULT_BUSINESS_MODE,
  type BusinessModeId,
  type BusinessVerticalId,
} from '@/features/auth/data/business-playbooks'
import type {
  LocalCashCategory,
  LocalCustomer,
  LocalPaymentMethod,
  LocalProduct,
  LocalProductCategory,
  LocalSetting,
  LocalSupplier,
} from '@/services/local-db/schema'

export type BuildAtkPrintingSeedInput = {
  tenantId: string
  businessMode: BusinessModeId
  tenantName: string
  ownerName: string
  city: string
  initialCash: number
  seedIdPrefix?: string
}

export type PlaybookSeedBundle = {
  businessVertical: BusinessVerticalId
  businessMode: BusinessModeId
  categories: LocalProductCategory[]
  products: LocalProduct[]
  paymentMethods: LocalPaymentMethod[]
  cashCategories: LocalCashCategory[]
  customers: LocalCustomer[]
  suppliers: LocalSupplier[]
  settings: LocalSetting[]
}

function now() {
  return new Date().toISOString()
}

export function buildAtkPrintingSeed(input: BuildAtkPrintingSeedInput): PlaybookSeedBundle {
  const allModes = Object.values(BUSINESS_PLAYBOOKS).flatMap((vertical) =>
    vertical.modes.map((mode) => ({ mode, verticalId: vertical.id }))
  )
  const match = allModes.find((item) => item.mode.id === input.businessMode)

  if (!match) {
    throw new Error(`Unknown business mode: ${input.businessMode}`)
  }

  const { mode, verticalId } = match
  const seedIdPrefix = input.seedIdPrefix ?? 'playbook'
  const supplierName = verticalId === 'general' ? 'Supplier Umum' : 'Supplier ATK Utama'

  return {
    businessVertical: verticalId,
    businessMode: input.businessMode,
    categories: mode.categories.map((name, index) => ({
      id: `${seedIdPrefix}-category-${index + 1}`,
      tenantId: input.tenantId,
      name,
      description: `${mode.label} - ${name}`,
      status: 'Aktif',
      syncStatus: 'synced',
      version: 1,
      updatedAt: now(),
    })),
    products: mode.products.map((item, index) => ({
      id: `${seedIdPrefix}-product-${index + 1}`,
      tenantId: input.tenantId,
      name: item.name,
      category: item.category,
      type: item.type,
      price: item.price,
      costPrice: item.cost,
      stock: item.stock,
      manageStock: item.type === 'Produk Fisik',
      status: 'Aktif',
      syncStatus: 'synced',
      version: 1,
      updatedAt: now(),
    })),
    paymentMethods: mode.paymentMethods.map((item, index) => ({
      id: `${seedIdPrefix}-payment-method-${index + 1}`,
      tenantId: input.tenantId,
      name: item.name,
      provider: item.provider,
      type: item.type,
      status: 'Aktif',
      updatedAt: now(),
    })),
    cashCategories: mode.cashCategories.map((item, index) => ({
      id: `${seedIdPrefix}-cash-category-${index + 1}`,
      tenantId: input.tenantId,
      name: item.name,
      type: item.type,
      status: 'Aktif',
      syncStatus: 'synced',
      version: 1,
      updatedAt: now(),
    })),
    customers: [
      {
        id: `${seedIdPrefix}-customer-1`,
        tenantId: input.tenantId,
        name: 'Pelanggan Umum',
        phone: '081234567890',
        city: input.city,
        receivable: 0,
        orders: 0,
        status: 'Aktif',
        syncStatus: 'synced',
        version: 1,
        updatedAt: now(),
      },
    ],
    suppliers: [
      {
        id: `${seedIdPrefix}-supplier-1`,
        tenantId: input.tenantId,
        name: supplierName,
        phone: '081234567891',
        city: input.city,
        payable: 0,
        orders: 0,
        status: 'Aktif',
        syncStatus: 'synced',
        version: 1,
        updatedAt: now(),
      },
    ],
    settings: [
      {
        id: `${seedIdPrefix}-setting-1`,
        tenantId: input.tenantId,
        area: 'System',
        setting: 'business_vertical',
        value: verticalId,
        updatedAt: now(),
        status: 'Lengkap',
      },
      {
        id: `${seedIdPrefix}-setting-2`,
        tenantId: input.tenantId,
        area: 'System',
        setting: 'business_mode',
        value: input.businessMode,
        updatedAt: now(),
        status: 'Lengkap',
      },
      {
        id: `${seedIdPrefix}-setting-3`,
        tenantId: input.tenantId,
        area: 'Kas',
        setting: 'kas_awal',
        value: String(input.initialCash),
        updatedAt: now(),
        status: 'Lengkap',
      },
      {
        id: `${seedIdPrefix}-setting-4`,
        tenantId: input.tenantId,
        area: 'Profil Usaha',
        setting: 'Nama Usaha',
        value: input.tenantName,
        updatedAt: now(),
        status: 'Lengkap',
      },
      {
        id: `${seedIdPrefix}-setting-5`,
        tenantId: input.tenantId,
        area: 'Profil Usaha',
        setting: 'Nama Pemilik',
        value: input.ownerName,
        updatedAt: now(),
        status: 'Lengkap',
      },
    ],
  }
}

export function createPlaybookSeedBundle(tenantId: string, seedIdPrefix = 'playbook'): PlaybookSeedBundle {
  return buildAtkPrintingSeed({
    tenantId,
    businessMode: DEFAULT_BUSINESS_MODE,
    tenantName: 'Demo ATK Printing',
    ownerName: 'Demo Owner',
    city: 'Surabaya',
    initialCash: 1000000,
    seedIdPrefix,
  })
}
