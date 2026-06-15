import { describe, expect, it, vi, beforeEach } from 'vitest'

// Create mock tables that can be controlled per test
const mockTables = vi.hoisted(() => {
  const tables: Record<string, { where: ReturnType<typeof vi.fn> }> = {
    payments: { where: vi.fn() },
    cash: { where: vi.fn() },
    salesOrderItems: { where: vi.fn() },
    purchaseItems: { where: vi.fn() },
    returnItems: { where: vi.fn() },
    stockMovements: { where: vi.fn() },
    productionBatches: { where: vi.fn() },
  }
  return tables
})

vi.mock('@/services/local-db/client', () => ({
  localDb: mockTables,
}))

function mockCount(tableName: string, count: number) {
  const table = mockTables[tableName]
  if (!table) throw new Error(`Unknown table: ${tableName}`)
  table.where.mockReturnValue({
    equals: vi.fn(() => ({
      count: vi.fn(async () => count),
    })),
  })
}

function mockAllCounts(tables: Record<string, number>) {
  for (const [name, count] of Object.entries(tables)) {
    mockCount(name, count)
  }
}

describe('canDeletePaymentMethod', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('allows deletion when no payments or cash use the method', async () => {
    mockAllCounts({ payments: 0, cash: 0 })
    const { canDeletePaymentMethod } = await import('./delete-guard')
    await expect(canDeletePaymentMethod('Tunai', 'tenant-1')).resolves.toEqual({ allowed: true })
  })

  it('blocks deletion when payments reference the method', async () => {
    mockAllCounts({ payments: 3, cash: 0 })
    const { canDeletePaymentMethod } = await import('./delete-guard')
    const result = await canDeletePaymentMethod('Kartu', 'tenant-1')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('3')
  })

  it('blocks deletion when cash transactions reference the method', async () => {
    mockAllCounts({ payments: 0, cash: 2 })
    const { canDeletePaymentMethod } = await import('./delete-guard')
    const result = await canDeletePaymentMethod('Transfer', 'tenant-1')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('2')
  })
})

describe('canDeleteCashCategory', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('allows deletion when no cash transactions use the category', async () => {
    mockCount('cash', 0)
    const { canDeleteCashCategory } = await import('./delete-guard')
    await expect(canDeleteCashCategory('Modal Awal', 'tenant-1')).resolves.toEqual({ allowed: true })
  })

  it('blocks deletion when cash transactions reference the category', async () => {
    mockCount('cash', 5)
    const { canDeleteCashCategory } = await import('./delete-guard')
    const result = await canDeleteCashCategory('Biaya Listrik', 'tenant-1')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('5')
  })
})

describe('canDeleteProduct', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('allows deletion when no transactions reference the product', async () => {
    mockAllCounts({
      salesOrderItems: 0,
      purchaseItems: 0,
      returnItems: 0,
      stockMovements: 0,
      productionBatches: 0,
    })
    const { canDeleteProduct } = await import('./delete-guard')
    await expect(canDeleteProduct('product-1', 'tenant-1')).resolves.toEqual({ allowed: true })
  })

  it('blocks deletion when sales order items reference the product', async () => {
    mockAllCounts({
      salesOrderItems: 4,
      purchaseItems: 0,
      returnItems: 0,
      stockMovements: 0,
      productionBatches: 0,
    })
    const { canDeleteProduct } = await import('./delete-guard')
    const result = await canDeleteProduct('product-1', 'tenant-1')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('4')
  })
})
