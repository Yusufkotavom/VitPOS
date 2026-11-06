import { config } from 'dotenv'
import { describe, expect, it } from 'vitest'

config({ path: '.env.local' })
config()

import { createApp } from '../../app.js'
import { db } from '../../lib/db.js'
import { branches, products, settings, tenants } from '../../../../../src/db/schema/index.js'

describe('Storefront Public API & Checkout', () => {
  const app = createApp()

  it('handles storefront checkout and creates sales order', async () => {
    const tenantId = crypto.randomUUID()
    const branchId = crypto.randomUUID()
    const productId = crypto.randomUUID()
    const slug = `toko-${crypto.randomUUID().slice(0, 8)}`
    const now = new Date()

    // Seed tenant, branch, settings, and product
    await db.insert(tenants).values({
      id: tenantId,
      name: 'Toko Keren',
      phone: '081299998888',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(branches).values({
      id: branchId,
      tenantId,
      name: 'Cabang Utama',
      isDefault: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(settings).values({
      id: crypto.randomUUID(),
      tenantId,
      key: 'store-slug',
      area: 'storefront',
      value: slug,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(settings).values({
      id: crypto.randomUUID(),
      tenantId,
      key: 'company-name',
      area: 'company',
      value: 'Toko Keren Official',
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(settings).values({
      id: crypto.randomUUID(),
      tenantId,
      key: 'company-phone',
      area: 'company',
      value: '081299998888',
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(products).values({
      id: productId,
      tenantId,
      branchId,
      name: 'Kopi Susu Gula Aren',
      salePrice: '18000.00',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    // 1. Fetch store info
    const storeRes = await app.request(`/api/v1/store/${slug}`)
    expect(storeRes.status).toBe(200)
    const storeData = await storeRes.json()
    expect(storeData.ok).toBe(true)
    expect(storeData.store.name).toBe('Toko Keren Official')

    // 2. Perform checkout
    const checkoutRes = await app.request(`/api/v1/store/${slug}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          name: 'Budi Santoso',
          phone: '081234567890',
          address: 'Jl. Melati No. 45',
          notes: 'Less sugar ya',
        },
        orderType: 'delivery',
        items: [
          {
            productId,
            qty: 2,
          },
        ],
      }),
    })

    expect(checkoutRes.status).toBe(200)
    const checkoutData = await checkoutRes.json()
    expect(checkoutData.ok).toBe(true)
    expect(checkoutData.order.grandTotal).toBe(36000)
    expect(checkoutData.order.status).toBe('unpaid')
    expect(checkoutData.order.orderNumber).toMatch(/^SO-\d{8}-[A-Z0-9]{4}$/)
    expect(checkoutData.whatsappUrl).toContain('https://wa.me/6281299998888?text=')
    expect(checkoutData.whatsappMessage).toContain('Budi Santoso')
    expect(checkoutData.whatsappMessage).toContain('Kopi Susu Gula Aren')
    expect(checkoutData.whatsappMessage).toContain('Rp 36.000')

    // 3. Track orders by phone
    const trackRes = await app.request(`/api/v1/store/${slug}/track?phone=081234567890`)
    expect(trackRes.status).toBe(200)
    const trackData = await trackRes.json()
    expect(trackData.ok).toBe(true)
    expect(trackData.orders.length).toBeGreaterThanOrEqual(1)
    expect(trackData.orders[0].grandTotal).toBe('36000.00')
  })
})
