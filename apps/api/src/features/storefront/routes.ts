import { and, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../../lib/db.js'
import {
  customers,
  products,
  salesOrderItems,
  salesOrders,
  settings,
  tenants,
} from '../../../../../src/db/schema/index.js'

export const storefrontRoutes = new Hono()

// Helper: resolve tenantId from slug
async function resolveTenantId(slug: string): Promise<string | null> {
  const row = await db.query.settings.findFirst({
    where: and(
      eq(settings.key, 'store-slug'),
      eq(settings.value, slug),
    ),
  })
  return row?.tenantId ?? null
}

// GET /api/v1/store/:slug
storefrontRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug')

  const tenantId = await resolveTenantId(slug)
  if (!tenantId) {
    return c.json({ ok: false, message: 'Toko tidak ditemukan' }, 404)
  }

  // Fetch tenant base info
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  })

  if (!tenant) {
    return c.json({ ok: false, message: 'Toko tidak ditemukan' }, 404)
  }

  // Fetch all relevant settings for this tenant
  const storeSettings = await db.query.settings.findMany({
    where: and(
      eq(settings.tenantId, tenantId),
    ),
  })

  const getSetting = (key: string) =>
    storeSettings.find((s) => s.key === key)?.value ?? null

  return c.json({
    ok: true,
    store: {
      tenantId,
      name: getSetting('company-name') ?? tenant.name,
      phone: getSetting('company-phone') ?? tenant.phone ?? null,
      address: getSetting('company-address') ?? tenant.address ?? null,
      icon: getSetting('company-icon') ?? null,
      logoUrl: getSetting('company-logo') ?? null,
      description: getSetting('company-description') ?? null,
    },
  })
})

// GET /api/v1/store/:slug/products
storefrontRoutes.get('/:slug/products', async (c) => {
  const slug = c.req.param('slug')

  const tenantId = await resolveTenantId(slug)
  if (!tenantId) {
    return c.json({ ok: false, message: 'Toko tidak ditemukan' }, 404)
  }

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.salePrice,
      imageUrl: products.imageUrl,
      icon: products.icon,
      category: products.categoryId,
      type: products.type,
    })
    .from(products)
    .where(
      and(
        eq(products.tenantId, tenantId),
        eq(products.isActive, true),
        isNull(products.deletedAt),
      ),
    )

  return c.json({ ok: true, products: rows })
})

// GET /api/v1/store/:slug/track?phone=...
storefrontRoutes.get('/:slug/track', async (c) => {
  const slug = c.req.param('slug')
  const phone = c.req.query('phone')

  if (!phone) {
    return c.json({ ok: false, message: 'Parameter phone wajib diisi' }, 400)
  }

  const tenantId = await resolveTenantId(slug)
  if (!tenantId) {
    return c.json({ ok: false, message: 'Toko tidak ditemukan' }, 404)
  }

  // Phones are stored inconsistently (dashes/spaces, and either `0…` or `62…`
  // country prefix), so match on digits only and accept both national forms.
  const digits = phone.replace(/\D/g, '')
  if (!digits) {
    return c.json({ ok: false, message: 'Nomor telepon tidak valid' }, 400)
  }
  const phoneVariants = new Set([digits])
  if (digits.startsWith('62')) phoneVariants.add(`0${digits.slice(2)}`)
  if (digits.startsWith('0')) phoneVariants.add(`62${digits.slice(1)}`)

  // Find customer by phone
  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.tenantId, tenantId),
      inArray(
        sql`regexp_replace(${customers.phone}, '[^0-9]', '', 'g')`,
        [...phoneVariants],
      ),
    ),
  })

  if (!customer) {
    return c.json({ ok: true, customer: null, orders: [] })
  }

  // Query sales orders with item counts
  const rows = await db
    .select({
      id: salesOrders.id,
      orderNumber: salesOrders.orderNumber,
      grandTotal: salesOrders.grandTotal,
      paidTotal: salesOrders.paidTotal,
      status: salesOrders.status,
      date: salesOrders.date,
      itemCount: count(salesOrderItems.id),
    })
    .from(salesOrders)
    .leftJoin(salesOrderItems, eq(salesOrderItems.salesOrderId, salesOrders.id))
    .where(
      and(
        eq(salesOrders.tenantId, tenantId),
        eq(salesOrders.customerId, customer.id),
        isNull(salesOrders.deletedAt),
      ),
    )
    .groupBy(
      salesOrders.id,
      salesOrders.orderNumber,
      salesOrders.grandTotal,
      salesOrders.paidTotal,
      salesOrders.status,
      salesOrders.date,
    )
    .orderBy(desc(salesOrders.date))
    .limit(20)

  return c.json({
    ok: true,
    customer: {
      name: customer.name,
      phone: customer.phone,
    },
    orders: rows,
  })
})
