import { and, count, desc, eq, gte, inArray, lte, ne, sql, sum } from 'drizzle-orm'

import type { AppDb } from '../../lib/db.js'
import {
  cash,
  cashCategories,
  payments,
  products,
  salesOrderItems,
  salesOrders,
  serviceOrders,
  stockMovements,
  suppliers,
} from '../../../../../src/db/schema/index.js'

type ReportInput = { tenantId: string; branchId?: string; from?: string; to?: string }

function n(val: string | null | undefined): number {
  return Number(val ?? 0)
}

// ── Existing ────────────────────────────────────────────────────────────────

export async function getSalesSummary(db: AppDb, input: ReportInput) {
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

export async function getPaymentSummary(db: AppDb, input: ReportInput) {
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

export async function getInventoryMovementSummary(db: AppDb, input: ReportInput) {
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

// ── 1. Profit & Loss ────────────────────────────────────────────────────────

export async function getProfitLoss(db: AppDb, input: ReportInput) {
  const tenantId = input.tenantId

  const saleFilters = [eq(salesOrders.tenantId, tenantId), inArray(salesOrders.status, ['paid', 'partial'])]
  if (input.branchId) saleFilters.push(eq(salesOrders.branchId, input.branchId))
  if (input.from) saleFilters.push(gte(salesOrders.createdAt, new Date(input.from)))
  if (input.to) saleFilters.push(lte(salesOrders.createdAt, new Date(input.to)))

  const [salesRev] = await db
    .select({ revenue: sum(salesOrders.grandTotal), orderCount: count(salesOrders.id) })
    .from(salesOrders)
    .where(and(...saleFilters))

  const svcFilters = [eq(serviceOrders.tenantId, tenantId), inArray(serviceOrders.status, ['completed', 'picked_up'])]
  if (input.branchId) svcFilters.push(eq(serviceOrders.branchId, input.branchId))
  if (input.from) svcFilters.push(gte(serviceOrders.date, new Date(input.from)))
  if (input.to) svcFilters.push(lte(serviceOrders.date, new Date(input.to)))

  const [svcRev] = await db
    .select({ revenue: sum(serviceOrders.cost), orderCount: count(serviceOrders.id) })
    .from(serviceOrders)
    .where(and(...svcFilters))

  const cogsFilters = [eq(salesOrders.tenantId, tenantId)]
  if (input.branchId) cogsFilters.push(eq(salesOrders.branchId, input.branchId))
  if (input.from) cogsFilters.push(gte(salesOrders.createdAt, new Date(input.from)))
  if (input.to) cogsFilters.push(lte(salesOrders.createdAt, new Date(input.to)))

  const [cogsRow] = await db
    .select({ cogs: sum(sql`${salesOrderItems.qty} * COALESCE(${products.costPrice}, 0)`) })
    .from(salesOrderItems)
    .innerJoin(salesOrders, eq(salesOrderItems.salesOrderId, salesOrders.id))
    .leftJoin(products, eq(salesOrderItems.productId, products.id))
    .where(and(...cogsFilters))

  const cashFilters = [eq(cash.tenantId, tenantId)]
  if (input.branchId) cashFilters.push(eq(cash.branchId, input.branchId))
  if (input.from) cashFilters.push(gte(cash.date, new Date(input.from)))
  if (input.to) cashFilters.push(lte(cash.date, new Date(input.to)))

  const expenseRows = await db
    .select({
      category: cashCategories.name,
      total: sum(cash.expense),
    })
    .from(cash)
    .leftJoin(cashCategories, eq(cash.categoryId, cashCategories.id))
    .where(and(...cashFilters, eq(cashCategories.type, 'expense'), sql`${cash.expense} > 0`))
    .groupBy(cashCategories.name)

  const [incomeRow] = await db
    .select({ total: sum(cash.income) })
    .from(cash)
    .leftJoin(cashCategories, eq(cash.categoryId, cashCategories.id))
    .where(and(...cashFilters, eq(cashCategories.type, 'income'), sql`${cash.income} > 0`))

  const payFilters = [eq(payments.tenantId, tenantId), eq(payments.status, 'success')]
  if (input.branchId) payFilters.push(eq(payments.branchId, input.branchId))
  if (input.from) payFilters.push(gte(payments.createdAt, new Date(input.from)))
  if (input.to) payFilters.push(lte(payments.createdAt, new Date(input.to)))

  const paymentBreakdown = await db
    .select({ method: payments.method, total: sum(payments.amount), count: count(payments.id) })
    .from(payments)
    .where(and(...payFilters))
    .groupBy(payments.method)
    .orderBy(payments.method)

  const salesRevenue = n(salesRev?.revenue)
  const serviceRevenue = n(svcRev?.revenue)
  const totalRevenue = salesRevenue + serviceRevenue
  const cogs = n(cogsRow?.cogs as string | null)
  const grossProfit = totalRevenue - cogs
  const totalExpenses = expenseRows.reduce((s, r) => s + n(r.total), 0)
  const otherIncome = n(incomeRow?.total)
  const netProfit = grossProfit - totalExpenses + otherIncome

  return {
    salesRevenue,
    serviceRevenue,
    totalRevenue,
    salesOrderCount: Number(salesRev?.orderCount ?? 0),
    serviceOrderCount: Number(svcRev?.orderCount ?? 0),
    cogs,
    grossProfit,
    expenses: expenseRows.map((r) => ({ category: r.category ?? 'Lainnya', total: n(r.total) })),
    totalExpenses,
    otherIncome,
    netProfit,
    paymentBreakdown: paymentBreakdown.map((r) => ({
      method: r.method,
      total: n(r.total),
      count: Number(r.count ?? 0),
    })),
  }
}

// ── 2. Balance Sheet ────────────────────────────────────────────────────────

export async function getBalanceSheet(db: AppDb, input: ReportInput) {
  const tenantId = input.tenantId

  const cashFilters = [eq(cash.tenantId, tenantId)]
  if (input.branchId) cashFilters.push(eq(cash.branchId, input.branchId))
  if (input.to) cashFilters.push(lte(cash.date, new Date(input.to)))

  const [cashRow] = await db
    .select({
      totalIncome: sum(cash.income),
      totalExpense: sum(cash.expense),
    })
    .from(cash)
    .where(and(...cashFilters))

  const cashOnHand = n(cashRow?.totalIncome) - n(cashRow?.totalExpense)

  const arFilters = [eq(salesOrders.tenantId, tenantId), ne(salesOrders.status, 'cancelled')]
  if (input.branchId) arFilters.push(eq(salesOrders.branchId, input.branchId))
  if (input.to) arFilters.push(lte(salesOrders.createdAt, new Date(input.to)))

  const [arRow] = await db
    .select({ outstanding: sum(sql`${salesOrders.grandTotal} - ${salesOrders.paidTotal}`) })
    .from(salesOrders)
    .where(and(...arFilters))

  const accountsReceivable = Math.max(0, n(arRow?.outstanding as string | null))

  const invRows = await db
    .select({
      productId: stockMovements.productId,
      totalQty: sum(stockMovements.qty),
    })
    .from(stockMovements)
    .where(eq(stockMovements.tenantId, tenantId))
    .groupBy(stockMovements.productId)

  const productIds = invRows.map((r) => r.productId)
  const costMap = new Map<string, number>()
  if (productIds.length > 0) {
    const prodRows = await db
      .select({ id: products.id, costPrice: products.costPrice })
      .from(products)
      .where(and(eq(products.tenantId, tenantId), inArray(products.id, productIds)))
    for (const p of prodRows) {
      costMap.set(p.id, n(p.costPrice))
    }
  }

  let inventoryValue = 0
  const inventoryDetail = invRows.map((r) => {
    const stock = n(r.totalQty)
    const unitCost = costMap.get(r.productId) ?? 0
    const value = Math.max(0, stock) * unitCost
    inventoryValue += value
    return { productId: r.productId, stock: Math.max(0, stock), unitCost, value }
  })

  const totalAssets = cashOnHand + accountsReceivable + inventoryValue

  const supplierFilters = [eq(suppliers.tenantId, tenantId)]
  const [payableRow] = await db
    .select({ total: sum(suppliers.payable) })
    .from(suppliers)
    .where(and(...supplierFilters))

  const accountsPayable = n(payableRow?.total)
  const totalLiabilities = accountsPayable

  const allTimeSaleFilters = [eq(salesOrders.tenantId, tenantId), inArray(salesOrders.status, ['paid', 'partial'])]
  const [allTimeSalesRev] = await db
    .select({ revenue: sum(salesOrders.grandTotal) })
    .from(salesOrders)
    .where(and(...allTimeSaleFilters))

  const allTimeSvcFilters = [eq(serviceOrders.tenantId, tenantId), inArray(serviceOrders.status, ['completed', 'picked_up'])]
  const [allTimeSvcRev] = await db
    .select({ revenue: sum(serviceOrders.cost) })
    .from(serviceOrders)
    .where(and(...allTimeSvcFilters))

  const [allTimeCogs] = await db
    .select({ cogs: sum(sql`${salesOrderItems.qty} * COALESCE(${products.costPrice}, 0)`) })
    .from(salesOrderItems)
    .innerJoin(salesOrders, eq(salesOrderItems.salesOrderId, salesOrders.id))
    .leftJoin(products, eq(salesOrderItems.productId, products.id))
    .where(eq(salesOrders.tenantId, tenantId))

  const [allTimeExpense] = await db
    .select({ total: sum(cash.expense) })
    .from(cash)
    .leftJoin(cashCategories, eq(cash.categoryId, cashCategories.id))
    .where(and(eq(cash.tenantId, tenantId), eq(cashCategories.type, 'expense')))

  const [allTimeIncome] = await db
    .select({ total: sum(cash.income) })
    .from(cash)
    .leftJoin(cashCategories, eq(cash.categoryId, cashCategories.id))
    .where(and(eq(cash.tenantId, tenantId), eq(cashCategories.type, 'income')))

  const retainedEarnings =
    n(allTimeSalesRev?.revenue) +
    n(allTimeSvcRev?.revenue) -
    n(allTimeCogs?.cogs as string | null) -
    n(allTimeExpense?.total) +
    n(allTimeIncome?.total)

  const totalEquity = retainedEarnings
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

  return {
    assets: {
      cashOnHand,
      accountsReceivable,
      inventoryValue,
      inventoryDetail,
      totalAssets,
    },
    liabilities: {
      accountsPayable,
      totalLiabilities,
    },
    equity: {
      retainedEarnings,
      totalEquity,
    },
    totalLiabilitiesAndEquity,
  }
}

// ── 3. Sales Report ─────────────────────────────────────────────────────────

export async function getSalesReport(db: AppDb, input: ReportInput) {
  const tenantId = input.tenantId

  const saleFilters = [eq(salesOrders.tenantId, tenantId), ne(salesOrders.status, 'cancelled')]
  if (input.branchId) saleFilters.push(eq(salesOrders.branchId, input.branchId))
  if (input.from) saleFilters.push(gte(salesOrders.createdAt, new Date(input.from)))
  if (input.to) saleFilters.push(lte(salesOrders.createdAt, new Date(input.to)))

  const dailySales = await db
    .select({
      date: sql<string>`DATE(${salesOrders.createdAt})`.as('date'),
      orderCount: count(salesOrders.id),
      revenue: sum(salesOrders.grandTotal),
      paid: sum(salesOrders.paidTotal),
    })
    .from(salesOrders)
    .where(and(...saleFilters))
    .groupBy(sql`DATE(${salesOrders.createdAt})`)
    .orderBy(sql`DATE(${salesOrders.createdAt})`)

  const svcFilters = [eq(serviceOrders.tenantId, tenantId), ne(serviceOrders.status, 'cancelled')]
  if (input.branchId) svcFilters.push(eq(serviceOrders.branchId, input.branchId))
  if (input.from) svcFilters.push(gte(serviceOrders.date, new Date(input.from)))
  if (input.to) svcFilters.push(lte(serviceOrders.date, new Date(input.to)))

  const dailyService = await db
    .select({
      date: sql<string>`DATE(${serviceOrders.date})`.as('date'),
      orderCount: count(serviceOrders.id),
      revenue: sum(serviceOrders.cost),
    })
    .from(serviceOrders)
    .where(and(...svcFilters))
    .groupBy(sql`DATE(${serviceOrders.date})`)
    .orderBy(sql`DATE(${serviceOrders.date})`)

  const topProductRows = await db
    .select({
      productId: salesOrderItems.productId,
      name: salesOrderItems.name,
      totalQty: sum(salesOrderItems.qty),
      totalRevenue: sum(salesOrderItems.subtotal),
    })
    .from(salesOrderItems)
    .innerJoin(salesOrders, eq(salesOrderItems.salesOrderId, salesOrders.id))
    .where(and(...saleFilters))
    .groupBy(salesOrderItems.productId, salesOrderItems.name)
    .orderBy(desc(sum(salesOrderItems.subtotal)))
    .limit(20)

  const [totals] = await db
    .select({
      orderCount: count(salesOrders.id),
      revenue: sum(salesOrders.grandTotal),
      paid: sum(salesOrders.paidTotal),
    })
    .from(salesOrders)
    .where(and(...saleFilters))

  const [svcTotals] = await db
    .select({
      orderCount: count(serviceOrders.id),
      revenue: sum(serviceOrders.cost),
    })
    .from(serviceOrders)
    .where(and(...svcFilters))

  const totalRevenue = n(totals?.revenue) + n(svcTotals?.revenue)
  const totalOrders = Number(totals?.orderCount ?? 0) + Number(svcTotals?.orderCount ?? 0)

  return {
    summary: {
      totalRevenue,
      salesRevenue: n(totals?.revenue),
      serviceRevenue: n(svcTotals?.revenue),
      totalOrders,
      salesOrders: Number(totals?.orderCount ?? 0),
      serviceOrders: Number(svcTotals?.orderCount ?? 0),
      totalPaid: n(totals?.paid),
      avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    },
    dailySales: dailySales.map((r) => ({
      date: r.date,
      orderCount: Number(r.orderCount ?? 0),
      revenue: n(r.revenue),
      paid: n(r.paid),
    })),
    dailyService: dailyService.map((r) => ({
      date: r.date,
      orderCount: Number(r.orderCount ?? 0),
      revenue: n(r.revenue),
    })),
    topProducts: topProductRows.map((r) => ({
      productId: r.productId,
      name: r.name,
      totalQty: n(r.totalQty),
      totalRevenue: n(r.totalRevenue),
    })),
  }
}

// ── 4. Payment Report ───────────────────────────────────────────────────────

export async function getPaymentReport(db: AppDb, input: ReportInput) {
  const tenantId = input.tenantId

  const payFilters = [eq(payments.tenantId, tenantId), eq(payments.status, 'success')]
  if (input.branchId) payFilters.push(eq(payments.branchId, input.branchId))
  if (input.from) payFilters.push(gte(payments.createdAt, new Date(input.from)))
  if (input.to) payFilters.push(lte(payments.createdAt, new Date(input.to)))

  const byMethod = await db
    .select({ method: payments.method, total: sum(payments.amount), count: count(payments.id) })
    .from(payments)
    .where(and(...payFilters))
    .groupBy(payments.method)
    .orderBy(payments.method)

  const bySource = await db
    .select({ source: payments.source, total: sum(payments.amount), count: count(payments.id) })
    .from(payments)
    .where(and(...payFilters))
    .groupBy(payments.source)
    .orderBy(payments.source)

  const dailyFlow = await db
    .select({
      date: sql<string>`DATE(${payments.createdAt})`.as('date'),
      method: payments.method,
      total: sum(payments.amount),
    })
    .from(payments)
    .where(and(...payFilters))
    .groupBy(sql`DATE(${payments.createdAt})`, payments.method)
    .orderBy(sql`DATE(${payments.createdAt})`)

  const arFilters = [eq(salesOrders.tenantId, tenantId), ne(salesOrders.status, 'cancelled'), sql`${salesOrders.grandTotal} > ${salesOrders.paidTotal}`]
  if (input.branchId) arFilters.push(eq(salesOrders.branchId, input.branchId))

  const receivables = await db
    .select({
      id: salesOrders.id,
      orderNumber: salesOrders.orderNumber,
      grandTotal: salesOrders.grandTotal,
      paidTotal: salesOrders.paidTotal,
      outstanding: sql<string>`${salesOrders.grandTotal} - ${salesOrders.paidTotal}`,
      createdAt: salesOrders.createdAt,
    })
    .from(salesOrders)
    .where(and(...arFilters))
    .orderBy(salesOrders.createdAt)
    .limit(50)

  const now = new Date()
  const aging = { current: 0, days7: 0, days30: 0, days60: 0, over60: 0 }
  for (const r of receivables) {
    const days = Math.floor((now.getTime() - new Date(r.createdAt).getTime()) / 86400000)
    const amount = n(r.outstanding)
    if (days <= 7) aging.current += amount
    else if (days <= 30) aging.days7 += amount
    else if (days <= 60) aging.days30 += amount
    else aging.over60 += amount
  }

  const totalCollected = byMethod.reduce((s, r) => s + n(r.total), 0)
  const totalReceivable = receivables.reduce((s, r) => s + n(r.outstanding), 0)

  return {
    summary: {
      totalCollected,
      totalReceivable,
      transactionCount: byMethod.reduce((s, r) => s + Number(r.count ?? 0), 0),
    },
    byMethod: byMethod.map((r) => ({ method: r.method, total: n(r.total), count: Number(r.count ?? 0) })),
    bySource: bySource.map((r) => ({ source: r.source ?? 'Unknown', total: n(r.total), count: Number(r.count ?? 0) })),
    dailyFlow: dailyFlow.map((r) => ({ date: r.date, method: r.method, total: n(r.total) })),
    aging,
    receivables: receivables.map((r) => ({
      id: r.id,
      orderNumber: r.orderNumber,
      grandTotal: n(r.grandTotal),
      paidTotal: n(r.paidTotal),
      outstanding: n(r.outstanding),
      createdAt: r.createdAt.toISOString(),
    })),
  }
}

// ── 5. Inventory Report ─────────────────────────────────────────────────────

export async function getInventoryReport(db: AppDb, input: ReportInput) {
  const tenantId = input.tenantId

  const prodRows = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      type: products.type,
      costPrice: products.costPrice,
      salePrice: products.salePrice,
      minimumStock: products.minimumStock,
      isActive: products.isActive,
    })
    .from(products)
    .where(and(eq(products.tenantId, tenantId), eq(products.isActive, true)))

  const movementTotals = await db
    .select({
      productId: stockMovements.productId,
      totalQty: sum(stockMovements.qty),
    })
    .from(stockMovements)
    .where(eq(stockMovements.tenantId, tenantId))
    .groupBy(stockMovements.productId)

  const stockMap = new Map(movementTotals.map((r) => [r.productId, Math.max(0, n(r.totalQty))]))

  const valuation = prodRows.map((p) => {
    const stock = stockMap.get(p.id) ?? 0
    const unitCost = n(p.costPrice)
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      type: p.type,
      stock,
      unitCost,
      unitPrice: n(p.salePrice),
      value: stock * unitCost,
      minimumStock: p.minimumStock,
      isLow: stock <= p.minimumStock,
    }
  })

  const movFilters = [eq(stockMovements.tenantId, tenantId)]
  if (input.branchId) movFilters.push(eq(stockMovements.branchId, input.branchId))
  if (input.from) movFilters.push(gte(stockMovements.createdAt, new Date(input.from)))
  if (input.to) movFilters.push(lte(stockMovements.createdAt, new Date(input.to)))

  const movementSummary = await db
    .select({
      type: stockMovements.type,
      totalQty: sum(sql`ABS(${stockMovements.qty})`),
      count: count(stockMovements.id),
    })
    .from(stockMovements)
    .where(and(...movFilters))
    .groupBy(stockMovements.type)
    .orderBy(stockMovements.type)

  const movementDetail = await db
    .select({
      id: stockMovements.id,
      productName: products.name,
      type: stockMovements.type,
      qty: stockMovements.qty,
      referenceType: stockMovements.referenceType,
      notes: stockMovements.notes,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .leftJoin(products, eq(stockMovements.productId, products.id))
    .where(and(...movFilters))
    .orderBy(desc(stockMovements.createdAt))
    .limit(200)

  const totalSkus = valuation.length
  const totalValue = valuation.reduce((s, v) => s + v.value, 0)
  const lowStockCount = valuation.filter((v) => v.isLow).length

  return {
    summary: {
      totalSkus,
      totalValue,
      lowStockCount,
    },
    valuation,
    movementSummary: movementSummary.map((r) => ({
      type: r.type,
      totalQty: n(r.totalQty as string | null),
      count: Number(r.count ?? 0),
    })),
    movementDetail: movementDetail.map((r) => ({
      id: r.id,
      productName: r.productName ?? 'Unknown',
      type: r.type,
      qty: n(r.qty),
      referenceType: r.referenceType,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
    })),
    lowStock: valuation.filter((v) => v.isLow),
  }
}
