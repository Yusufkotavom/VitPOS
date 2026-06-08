import { describe, expect, it, vi } from 'vitest'

import { createRepository } from '@/services/local-db/repository'
import type { LocalProduct, OutboxItem } from '@/services/local-db/schema'

function createTable<T extends { id: string }>() {
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
  }
}

describe('createRepository', () => {
  it('lists rows from the table', async () => {
    const table = createTable<LocalProduct>()
    const product: LocalProduct = {
      id: 'product-1',
      name: 'Kopi Susu',
      category: 'Minuman',
      type: 'Produk Fisik',
      price: 'Rp 18.000',
      stock: '24 pcs',
      status: 'Aktif',
    }
    table.rows.set(product.id, product)

    const repository = createRepository({ table, outboxTable: createTable<OutboxItem>(), entityType: 'product' })

    await expect(repository.list()).resolves.toEqual([product])
  })

  it('upserts row and queues matching outbox item', async () => {
    const table = createTable<LocalProduct>()
    const outboxTable = createTable<OutboxItem>()
    const product: LocalProduct = {
      id: 'product-1',
      name: 'Kopi Susu',
      category: 'Minuman',
      type: 'Produk Fisik',
      price: 'Rp 18.000',
      stock: '24 pcs',
      status: 'Aktif',
    }

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
    const outboxTable = createTable<OutboxItem>()
    const product: LocalProduct = {
      id: 'product-1',
      name: 'Kopi Susu',
      category: 'Minuman',
      type: 'Produk Fisik',
      price: 'Rp 18.000',
      stock: '24 pcs',
      status: 'Aktif',
    }
    table.rows.set(product.id, product)

    const repository = createRepository({ table, outboxTable, entityType: 'product' })
    await repository.upsert({ ...product, stock: '18 pcs' })

    expect(Array.from(outboxTable.rows.values())[0]).toMatchObject({
      entityType: 'product',
      entityId: product.id,
      mutationType: 'update',
      payload: { ...product, stock: '18 pcs' },
    })
  })

  it('deletes row and queues delete with previous payload', async () => {
    const table = createTable<LocalProduct>()
    const outboxTable = createTable<OutboxItem>()
    const product: LocalProduct = {
      id: 'product-1',
      name: 'Kopi Susu',
      category: 'Minuman',
      type: 'Produk Fisik',
      price: 'Rp 18.000',
      stock: '24 pcs',
      status: 'Aktif',
    }
    table.rows.set(product.id, product)

    const repository = createRepository({ table, outboxTable, entityType: 'product' })
    await repository.remove(product.id)

    expect(table.rows.has(product.id)).toBe(false)
    expect(Array.from(outboxTable.rows.values())[0]).toMatchObject({
      entityType: 'product',
      entityId: product.id,
      mutationType: 'delete',
      payload: product,
    })
  })
})
