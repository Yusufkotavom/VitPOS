import { productRepository } from '@/services/local-db/repository'
import { createProductId } from '@/features/catalog/lib/entity-id'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import type { LocalProduct, ProductStatus, ProductType } from '@/services/local-db/schema'

const VALID_TYPES: ProductType[] = ['Produk Fisik', 'Jasa']
const VALID_STATUSES: ProductStatus[] = ['Aktif', 'Draft', 'Arsip']

export interface ImportProductRow {
  rowIndex: number
  id: string
  name: string
  category: string
  type: string
  costPrice: string
  price: string
  wholesalePrice: string
  stock: string
  manageStock: string
  sku: string
  barcode: string
  status: string
  valid: boolean
  errors: string[]
  action: 'create' | 'update'
}

function parseNum(val: string): number | null {
  if (!val) return 0
  const cleaned = val.replace(/[^\d.-]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function parseBool(val: string, fallback: boolean): boolean {
  const v = val.toLowerCase().trim()
  if (['true', 'ya', 'ya', '1', 'aktif'].includes(v)) return true
  if (['false', 'tidak', 'no', '0', 'nonaktif'].includes(v)) return false
  return fallback
}

export function validateImportRows(
  rows: Record<string, string>[],
  existingIds: Set<string>,
): ImportProductRow[] {
  return rows.map((row, index) => {
    const id = row['ID'] ?? row['id'] ?? ''
    const name = row['Nama Produk'] ?? row['name'] ?? ''
    const category = row['Kategori'] ?? row['category'] ?? 'Umum'
    const type = row['Jenis'] ?? row['type'] ?? ''
    const costPrice = row['HPP'] ?? row['costPrice'] ?? ''
    const price = row['Harga Jual'] ?? row['price'] ?? ''
    const wholesalePrice = row['Harga Grosir'] ?? row['wholesalePrice'] ?? ''
    const stock = row['Stok'] ?? row['stock'] ?? ''
    const manageStock = row['Kelola Stok'] ?? row['manageStock'] ?? ''
    const sku = row['SKU'] ?? row['sku'] ?? ''
    const barcode = row['Barcode'] ?? row['barcode'] ?? ''
    const status = row['Status'] ?? row['status'] ?? ''

    const errors: string[] = []

    if (!name) errors.push('Nama produk wajib diisi')
    if (type && !VALID_TYPES.includes(type as ProductType)) errors.push(`Jenis tidak valid: ${type}`)
    if (!price) errors.push('Harga jual wajib diisi')
    if (price && parseNum(price) === null) errors.push('Harga jual bukan angka')
    if (costPrice && parseNum(costPrice) === null) errors.push('HPP bukan angka')
    if (wholesalePrice && parseNum(wholesalePrice) === null) errors.push('Harga grosir bukan angka')
    if (stock && parseNum(stock) === null) errors.push('Stok bukan angka')
    if (status && !VALID_STATUSES.includes(status as ProductStatus)) errors.push(`Status tidak valid: ${status}`)

    const action = id && existingIds.has(id) ? 'update' : 'create'

    return {
      rowIndex: index + 1,
      id, name, category, type, costPrice, price, wholesalePrice,
      stock, manageStock, sku, barcode, status,
      valid: errors.length === 0,
      errors,
      action,
    }
  })
}

function rowToRecord(row: ImportProductRow, tenantId: string, base?: LocalProduct): LocalProduct {
  const isService = row.type === 'Jasa'
  const manageStock = row.manageStock
    ? parseBool(row.manageStock, !isService)
    : !isService
  const now = new Date().toISOString()

  return {
    id: row.action === 'update' ? row.id : createProductId(),
    tenantId,
    name: row.name.trim(),
    category: row.category.trim() || 'Umum',
    type: (VALID_TYPES.includes(row.type as ProductType) ? row.type : 'Produk Fisik') as ProductType,
    costPrice: parseNum(row.costPrice) ?? 0,
    price: parseNum(row.price) ?? 0,
    wholesalePrice: row.wholesalePrice ? (parseNum(row.wholesalePrice) ?? undefined) : undefined,
    stock: manageStock ? (parseNum(row.stock) ?? 0) : 0,
    manageStock,
    sku: row.sku || undefined,
    barcode: row.barcode || undefined,
    status: (VALID_STATUSES.includes(row.status as ProductStatus) ? row.status : 'Aktif') as ProductStatus,
    syncStatus: 'pending',
    version: (base?.version ?? 0) + 1,
    updatedAt: now,
  }
}

export async function executeImport(
  rows: ImportProductRow[],
  existing: LocalProduct[],
): Promise<{ created: number; updated: number; failed: number }> {
  const tenantId = requireActiveTenantId()
  const existingMap = new Map(existing.map(p => [p.id, p]))
  let created = 0
  let updated = 0
  let failed = 0

  for (const row of rows) {
    if (!row.valid) { failed++; continue }
    try {
      const base = row.action === 'update' ? existingMap.get(row.id) : undefined
      const record = rowToRecord(row, tenantId, base)
      await productRepository.upsert(record)
      if (row.action === 'update') {
        updated++
      } else {
        created++
      }
    } catch {
      failed++
    }
  }

  return { created, updated, failed }
}
