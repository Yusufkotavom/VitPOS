import { and, count, eq, gte, lte, sum } from 'drizzle-orm'

import type { AppDb } from '../../lib/db.js'
import { payments, salesOrders, stockMovements } from '../../../../../src/db/schema/index.js'

export async function getSalesSummary(db: AppDb, input: { tenantId: string; branchId?: string; from?: string; to?: string }) {
  const filters = [eq(salesOrders.tenantId, input.tenantId)]

  if (input.branchId) filters.push(eq(salesOrders.branchId, input.branchId))
  if (input.from) filters.push(gte(salesOrders.createdAt, new Date(input.from)))
  if (input.to) filters.push(lte(salesOrders.createdAt, new Date(input.to)))

  const [summary] = await db
    .select({
      orderCount: count(salesOrders.id),
      grossSales: sum(salesOrders.grandTotal),
      paidTotal: sum(salesOrders.paidTotal),
    })
    .from(salesOrders)
    .where(and(...filters))

  return {
    orderCount: Number(summary?.orderCount ?? 0),
    grossSales: String(summary?.grossSales ?? '0'),
    paidTotal: String(summary?.paidTotal ?? '0'),
  }
}

export async function getPaymentSummary(db: AppDb, input: { tenantId: string; branchId?: string; from?: string; to?: string }) {
  const filters = [eq(payments.tenantId, input.tenantId)]

  if (input.branchId) filters.push(eq(payments.branchId, input.branchId))
  if (input.from) filters.push(gte(payments.createdAt, new Date(input.from)))
  if (input.to) filters.push(lte(payments.createdAt, new Date(input.to)))

  const rows = await db
    .select({
      method: payments.method,
      total: sum(payments.amount),
      count: count(payments.id),
    })
    .from(payments)
    .where(and(...filters))
    .groupBy(payments.method)
    .orderBy(payments.method)

  return rows.map((row) => ({
    method: row.method,
    total: String(row.total ?? '0'),
    count: Number(row.count ?? 0),
  }))
}

export async function getInventoryMovementSummary(db: AppDb, input: { tenantId: string; branchId?: string; from?: string; to?: string }) {
  const filters = [eq(stockMovements.tenantId, input.tenantId)]

  if (input.branchId) filters.push(eq(stockMovements.branchId, input.branchId))
  if (input.from) filters.push(gte(stockMovements.createdAt, new Date(input.from)))
  if (input.to) filters.push(lte(stockMovements.createdAt, new Date(input.to)))

  const rows = await db
    .select({
      type: stockMovements.type,
      totalQty: sum(stockMovements.qty),
      count: count(stockMovements.id),
    })
    .from(stockMovements)
    .where(and(...filters))
    .groupBy(stockMovements.type)
    .orderBy(stockMovements.type)

  return rows.map((row) => ({
    type: row.type,
    totalQty: String(row.totalQty ?? '0'),
    count: Number(row.count ?? 0),
  }))
}
