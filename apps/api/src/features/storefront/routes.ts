import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../../lib/db.js'
import {
  branches,
  customers,
  productCategories,
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
      category: productCategories.name,
      type: products.type,
    })
    .from(products)
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
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
  const queryParam = c.req.query('phone') ?? c.req.query('q') ?? ''
  const trimmed = queryParam.trim()

  if (!trimmed) {
    return c.json({ ok: false, message: 'Parameter phone atau nomor pesanan wajib diisi' }, 400)
  }

  const tenantId = await resolveTenantId(slug)
  if (!tenantId) {
    return c.json({ ok: false, message: 'Toko tidak ditemukan' }, 404)
  }

  type OrderRow = typeof salesOrders.$inferSelect
  let orderRows: OrderRow[] = []
  let customerInfo: { name: string; phone: string | null } | null = null

  // 1. Search by order number if starts with "SO-"
  if (trimmed.toUpperCase().startsWith('SO-')) {
    orderRows = await db.query.salesOrders.findMany({
      where: and(
        eq(salesOrders.tenantId, tenantId),
        sql`upper(${salesOrders.orderNumber}) = upper(${trimmed})`,
        isNull(salesOrders.deletedAt),
      ),
      limit: 10,
    })

    if (orderRows.length > 0 && orderRows[0].customerId) {
      const cust = await db.query.customers.findFirst({
        where: and(
          eq(customers.tenantId, tenantId),
          eq(customers.id, orderRows[0].customerId),
        ),
      })
      if (cust) {
        customerInfo = { name: cust.name, phone: cust.phone }
      }
    }
  } else {
    // 2. Search by customer phone
    const digits = trimmed.replace(/\D/g, '')
    if (digits) {
      const phoneVariants = new Set([digits])
      if (digits.startsWith('62')) phoneVariants.add(`0${digits.slice(2)}`)
      if (digits.startsWith('0')) phoneVariants.add(`62${digits.slice(1)}`)

      const customer = await db.query.customers.findFirst({
        where: and(
          eq(customers.tenantId, tenantId),
          inArray(
            sql`regexp_replace(${customers.phone}, '[^0-9]', '', 'g')`,
            [...phoneVariants],
          ),
        ),
      })

      if (customer) {
        customerInfo = { name: customer.name, phone: customer.phone }
        orderRows = await db.query.salesOrders.findMany({
          where: and(
            eq(salesOrders.tenantId, tenantId),
            eq(salesOrders.customerId, customer.id),
            isNull(salesOrders.deletedAt),
          ),
          orderBy: [desc(salesOrders.date)],
          limit: 20,
        })
      }
    }
  }

  if (orderRows.length === 0) {
    return c.json({ ok: true, customer: customerInfo, orders: [] })
  }

  // Fetch items for the orders
  const orderIds = orderRows.map((o) => o.id)
  const itemRows = await db.query.salesOrderItems.findMany({
    where: and(
      eq(salesOrderItems.tenantId, tenantId),
      inArray(salesOrderItems.salesOrderId, orderIds),
    ),
  })

  type ItemRow = typeof salesOrderItems.$inferSelect
  const itemsByOrderId = new Map<string, ItemRow[]>()
  for (const it of itemRows) {
    const list = itemsByOrderId.get(it.salesOrderId) || []
    list.push(it)
    itemsByOrderId.set(it.salesOrderId, list)
  }

  const orders = orderRows.map((o) => {
    const items = itemsByOrderId.get(o.id) || []
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      grandTotal: o.grandTotal,
      paidTotal: o.paidTotal,
      subtotal: o.subtotal,
      status: o.status,
      date: o.date,
      notes: o.notes,
      itemCount: items.length,
      items: items.map((it) => ({
        id: it.id,
        productId: it.productId,
        name: it.name,
        qty: Number(it.qty) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        subtotal: Number(it.subtotal) || 0,
      })),
    }
  })

  return c.json({
    ok: true,
    customer: customerInfo,
    orders,
  })
})

// POST /api/v1/store/:slug/checkout
storefrontRoutes.post('/:slug/checkout', async (c) => {
  const slug = c.req.param('slug')

  const tenantId = await resolveTenantId(slug)
  if (!tenantId) {
    return c.json({ ok: false, message: 'Toko tidak ditemukan' }, 404)
  }

  const body = (await c.req.json().catch(() => null)) as {
    customer?: {
      name?: string
      phone?: string
      address?: string
      notes?: string
    }
    orderType?: 'delivery' | 'pickup'
    items?: Array<{
      productId: string
      qty: number
      notes?: string
    }>
  } | null

  const customerName = body?.customer?.name?.trim() || 'Pelanggan Umum'
  const rawPhone = body?.customer?.phone?.trim() ?? ''
  const cleanPhone = rawPhone.replace(/\D/g, '')

  const items = body?.items ?? []
  if (!Array.isArray(items) || items.length === 0) {
    return c.json({ ok: false, message: 'Keranjang belanja tidak boleh kosong' }, 400)
  }

  for (const item of items) {
    if (!item.productId || typeof item.qty !== 'number' || item.qty <= 0) {
      return c.json({ ok: false, message: 'Item pesanan tidak valid' }, 400)
    }
  }

  // Find active branch
  const branch = await db.query.branches.findFirst({
    where: and(
      eq(branches.tenantId, tenantId),
      eq(branches.isActive, true),
    ),
    orderBy: [desc(branches.isDefault)],
  })

  if (!branch) {
    return c.json({ ok: false, message: 'Cabang toko belum tersedia' }, 400)
  }

  // Fetch products
  const productIds = items.map((i) => i.productId)
  const productRows = await db.query.products.findMany({
    where: and(
      eq(products.tenantId, tenantId),
      eq(products.isActive, true),
      isNull(products.deletedAt),
      inArray(products.id, productIds),
    ),
  })

  const productMap = new Map(productRows.map((p) => [p.id, p]))
  for (const item of items) {
    if (!productMap.has(item.productId)) {
      return c.json({ ok: false, message: 'Salah satu produk tidak ditemukan atau sudah tidak aktif' }, 400)
    }
  }

  let grandTotal = 0
  const orderItemRecords: Array<{
    id: string
    tenantId: string
    productId: string
    name: string
    qty: string
    unitPrice: string
    discountTotal: string
    subtotal: string
  }> = []

  for (const item of items) {
    const prod = productMap.get(item.productId)!
    const price = Number(prod.salePrice) || 0
    const sub = price * item.qty
    grandTotal += sub

    orderItemRecords.push({
      id: crypto.randomUUID(),
      tenantId,
      productId: prod.id,
      name: prod.name,
      qty: item.qty.toString(),
      unitPrice: price.toFixed(2),
      discountTotal: '0',
      subtotal: sub.toFixed(2),
    })
  }

  // Find or create customer
  let existingCustomer = null
  if (cleanPhone && cleanPhone.length >= 8) {
    const phoneVariants = new Set([cleanPhone])
    if (cleanPhone.startsWith('62')) phoneVariants.add(`0${cleanPhone.slice(2)}`)
    if (cleanPhone.startsWith('0')) phoneVariants.add(`62${cleanPhone.slice(1)}`)

    existingCustomer = await db.query.customers.findFirst({
      where: and(
        eq(customers.tenantId, tenantId),
        inArray(
          sql`regexp_replace(${customers.phone}, '[^0-9]', '', 'g')`,
          [...phoneVariants],
        ),
      ),
    })
  }

  const now = new Date()
  let customerId = existingCustomer?.id

  if (!existingCustomer) {
    customerId = crypto.randomUUID()
    await db.insert(customers).values({
      id: customerId,
      tenantId,
      branchId: branch.id,
      name: customerName,
      phone: cleanPhone || null,
      address: body?.customer?.address?.trim() ?? null,
      isActive: true,
      version: 1,
      syncStatus: 'synced',
      createdAt: now,
      updatedAt: now,
    })
  } else if (body?.customer?.address?.trim()) {
    await db.update(customers).set({
      address: body.customer.address.trim(),
      updatedAt: now,
    }).where(eq(customers.id, existingCustomer.id))
  }

  // Create sales order
  const orderId = crypto.randomUUID()
  const dateStr = now.toISOString().slice(0, 10).replaceAll('-', '')
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  const orderNumber = `SO-${dateStr}-${randomSuffix}`

  const orderType = body?.orderType === 'pickup' ? 'pickup' : 'delivery'
  const orderTypeLabel = orderType === 'pickup' ? 'Ambil di Toko' : 'Kirim ke Alamat'
  const customerNotes = body?.customer?.notes?.trim()
  const customerAddress = body?.customer?.address?.trim()
  const fullNotes = `[Pesanan Online Storefront - ${orderTypeLabel}]${customerNotes ? ` Catatan: ${customerNotes}` : ''}${customerAddress ? ` | Alamat: ${customerAddress}` : ''}`

  await db.transaction(async (tx) => {
    await tx.insert(salesOrders).values({
      id: orderId,
      tenantId,
      branchId: branch.id,
      customerId,
      orderNumber,
      status: 'unpaid',
      subtotal: grandTotal.toFixed(2),
      discountTotal: '0',
      taxTotal: '0',
      grandTotal: grandTotal.toFixed(2),
      paidTotal: '0',
      date: now.toISOString(),
      notes: fullNotes,
      syncStatus: 'synced',
      version: 1,
      createdAt: now,
      updatedAt: now,
    })

    for (const itemRec of orderItemRecords) {
      await tx.insert(salesOrderItems).values({
        ...itemRec,
        salesOrderId: orderId,
        createdAt: now,
        updatedAt: now,
      })
    }
  })

  // Fetch store settings for WhatsApp message
  const storeSettings = await db.query.settings.findMany({
    where: eq(settings.tenantId, tenantId),
  })
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  })

  const storeName = storeSettings.find((s) => s.key === 'company-name')?.value || tenant?.name || 'Toko'
  const storePhone = storeSettings.find((s) => s.key === 'company-phone')?.value || tenant?.phone || ''

  const formatRupiah = (num: number) => `Rp ${new Intl.NumberFormat('id-ID').format(num)}`
  const itemsText = orderItemRecords
    .map((i) => `• ${i.qty}x ${i.name} (${formatRupiah(Number(i.unitPrice))}) = ${formatRupiah(Number(i.subtotal))}`)
    .join('\n')

  const phoneLine = cleanPhone ? `📱 *No. WhatsApp:* ${cleanPhone}\n` : ''

  const waMessage = `Halo *${storeName}*, saya ingin konfirmasi pesanan dari web store:

📋 *Nomor Pesanan:* ${orderNumber}
👤 *Nama Pemesan:* ${customerName}
${phoneLine}🚚 *Pengambilan:* ${orderTypeLabel}
${customerAddress ? `📍 *Alamat:* ${customerAddress}\n` : ''}${customerNotes ? `📝 *Catatan:* ${customerNotes}\n` : ''}
🛒 *Daftar Pesanan:*
${itemsText}

💰 *Total Pembayaran:* *${formatRupiah(grandTotal)}*

Mohon diproses pesanannya. Terima kasih!`

  const cleanStorePhone = storePhone.replace(/\D/g, '')
  const waTargetPhone = cleanStorePhone.startsWith('0') ? `62${cleanStorePhone.slice(1)}` : cleanStorePhone
  const whatsappUrl = waTargetPhone
    ? `https://wa.me/${waTargetPhone}?text=${encodeURIComponent(waMessage)}`
    : null

  return c.json({
    ok: true,
    order: {
      id: orderId,
      orderNumber,
      grandTotal,
      status: 'unpaid',
      orderType,
      date: now.toISOString(),
    },
    customer: {
      id: customerId,
      name: customerName,
      phone: cleanPhone,
    },
    store: {
      name: storeName,
      phone: storePhone,
    },
    whatsappUrl,
    whatsappMessage: waMessage,
  })
})
