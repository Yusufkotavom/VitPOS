import { describe, expect, it, vi } from 'vitest'

import { createRepository } from '@/services/local-db/repository'
import type { LocalProduct } from '@/services/local-db/schema'

function createTable<T extends { id: string; tenantId: string }>() {
  const rows = new Map<string, T>()

  return {
    rows,
    toArray: vi.fn(async () => Array.from(rows.values())),
    get: vi.fn(async (id: string) => rows.get(id)),
    put: vi.fn(async (row: T) => {
      rows.set(row.id, row)
      return row.id
    }),
    delete: vi.fn(async (id: string) => {
      rows.delete(id)
    }),
    where: vi.fn((key: string) => ({
      equals: vi.fn((value: string) => ({
        toArray: vi.fn(async () => Array.from(rows.values()).filter((row) => key in row && row[key as keyof T] === value)),
      })),
    })),
  }
}

function createOutboxTable() {
  const rows = new Map<string, { id: string; entityType: string; entityId: string; mutationType: string; payload: unknown; status: string; attempts: number; createdAt: string; updatedAt: string; tenantId?: string }>()

  return {
    rows,
    put: vi.fn(async (row: { id: string; entityType: string; entityId: string; mutationType: string; payload: unknown; status: string; attempts: number; createdAt: string; updatedAt: string; tenantId?: string }) => {
      rows.set(row.id, row)
      return row.id
    }),
  }
}

function sampleProduct(overrides: Partial<LocalProduct> = {}): LocalProduct {
  return {
    id: 'product-1',
    tenantId: 'tenant-1',
    name: 'Kopi Susu',
    category: 'Minuman',
    type: 'Produk Fisik',
    price: 18000,
    stock: 24,
    status: 'Aktif',
    syncStatus: 'pending',
    version: 1,
    updatedAt: '2026-06-08T00:00:00.000Z',
    ...overrides,
  }
}

describe('createRepository', () => {
  it('lists rows from the table', async () => {
    const table = createTable<LocalProduct>()
    const product = sampleProduct()
    table.rows.set(product.id, product)

    const repository = createRepository({ table, outboxTable: createOutboxTable(), entityType: 'product' })

    await expect(repository.list('tenant-1')).resolves.toEqual([product])
  })

  it('upserts row and queues create outbox item when row does not exist', async () => {
    const table = createTable<LocalProduct>()
    const outboxTable = createOutboxTable()
    const product = sampleProduct()

    const repository = createRepository({ table, outboxTable, entityType: 'product' })
    await repository.upsert(product)

    expect(table.rows.get(product.id)).toEqual(product)
    const outboxItems = Array.from(outboxTable.rows.values())
    expect(outboxItems).toHaveLength(1)
    expect(outboxItems[0]).toMatchObject({
      entityType: 'product',
      entityId: product.id,
      mutationType: 'create',
      payload: product,
      status: 'queued',
      attempts: 0,
    })
  })

  it('updates row and queues update when row already exists', async () => {
    const table = createTable<LocalProduct>()
    const outboxTable = createOutboxTable()
    const product = sampleProduct()
    table.rows.set(product.id, product)

    const repository = createRepository({ table, outboxTable, entityType: 'product' })
    await repository.upsert({ ...product, stock: 18 })

    expect(Array.from(outboxTable.rows.values())[0]).toMatchObject({
      entityType: 'product',
      entityId: product.id,
      mutationType: 'update',
      payload: { ...product, stock: 18 },
    })
  })

  it('deletes row and queues delete with previous payload', async () => {
    const table = createTable<LocalProduct>()
    const outboxTable = createOutboxTable()
    const product = sampleProduct()
    table.rows.set(product.id, product)

    const repository = createRepository({ table, outboxTable, entityType: 'product' })
    await repository.remove(product.id, 'tenant-1')

    expect(table.rows.has(product.id)).toBe(false)
    expect(Array.from(outboxTable.rows.values())[0]).toMatchObject({
      entityType: 'product',
      entityId: product.id,
      mutationType: 'delete',
      payload: product,
    })
  })
})
