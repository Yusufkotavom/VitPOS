import { config } from 'dotenv'
import { createHash } from 'node:crypto'
import postgres from 'postgres'

config({ path: '.env.local' })
config()

const BAIM_PASSWORD = process.env.BAIM_PASSWORD || 'baim123'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed Baim data')
}

const ids = {
  userId: '11111111-1111-4111-8111-111111111111',
  tenantId: '22222222-2222-4222-8222-222222222222',
  branchId: '33333333-3333-4333-8333-333333333333',
  warehouseId: '44444444-4444-4444-8444-444444444444',
  categoryId: '55555555-5555-4555-8555-555555555555',
  productId: '66666666-6666-4666-8666-666666666666',
  customerId: '77777777-7777-4777-8777-777777777777',
  salesOrderId: '88888888-8888-4888-8888-888888888888',
  salesOrderItemId: '99999999-9999-4999-8999-999999999999',
  paymentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  stockMovementId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
}

const sql = postgres(databaseUrl, { prepare: false, max: 1 })

try {
  const passwordHash = createHash('sha256').update(BAIM_PASSWORD).digest('hex')

  await sql.begin(async (tx) => {
    await tx`
      insert into users (id, email, name, password_hash)
      values (${ids.userId}, 'baim@kotacom.id', 'Baim Yusuf', ${passwordHash})
      on conflict (id) do update set email = excluded.email, name = excluded.name, password_hash = ${passwordHash}
    `

    await tx`
      insert into tenants (id, name, legal_name, phone, email, address, plan_code, is_active)
      values (${ids.tenantId}, 'Toko Baim Jaya', 'Toko Baim Jaya', '081234567890', 'baim@kotacom.id', 'Surabaya', 'pro', true)
      on conflict (id) do update set name = excluded.name, legal_name = excluded.legal_name, phone = excluded.phone, email = excluded.email, address = excluded.address, plan_code = excluded.plan_code, is_active = excluded.is_active
    `

    await tx`
      insert into branches (id, tenant_id, name, address, phone, is_default, is_active)
      values (${ids.branchId}, ${ids.tenantId}, 'Cabang Utama', 'Surabaya', '081234567890', true, true)
      on conflict (id) do update set tenant_id = excluded.tenant_id, name = excluded.name, address = excluded.address, phone = excluded.phone, is_default = excluded.is_default, is_active = excluded.is_active
    `

    await tx`
      insert into warehouses (id, tenant_id, branch_id, name, is_default, is_active)
      values (${ids.warehouseId}, ${ids.tenantId}, ${ids.branchId}, 'Gudang Utama', true, true)
      on conflict (id) do update set tenant_id = excluded.tenant_id, branch_id = excluded.branch_id, name = excluded.name, is_default = excluded.is_default, is_active = excluded.is_active
    `

    await tx`
      insert into tenant_members (tenant_id, user_id, role, is_active)
      select ${ids.tenantId}, ${ids.userId}, 'owner', true
      where not exists (
        select 1 from tenant_members where tenant_id = ${ids.tenantId} and user_id = ${ids.userId}
      )
    `

    await tx`
      insert into product_categories (id, tenant_id, name, is_active)
      values (${ids.categoryId}, ${ids.tenantId}, 'Aksesoris', true)
      on conflict (id) do update set tenant_id = excluded.tenant_id, name = excluded.name, is_active = excluded.is_active
    `

    await tx`
      insert into products (id, tenant_id, branch_id, category_id, name, sku, type, sale_price, wholesale_price, cost_price, minimum_stock, is_active, sync_status, version)
      values (${ids.productId}, ${ids.tenantId}, ${ids.branchId}, ${ids.categoryId}, 'Kabel Type-C Fast Charging', 'KABEL-TYPE-C-001', 'physical', 45000, 40000, 25000, 10, true, 'synced', 1)
      on conflict (id) do update set tenant_id = excluded.tenant_id, branch_id = excluded.branch_id, category_id = excluded.category_id, name = excluded.name, sku = excluded.sku, type = excluded.type, sale_price = excluded.sale_price, wholesale_price = excluded.wholesale_price, cost_price = excluded.cost_price, minimum_stock = excluded.minimum_stock, is_active = excluded.is_active, sync_status = excluded.sync_status, version = excluded.version
    `

    await tx`
      insert into customers (id, tenant_id, branch_id, name, phone, email, address, notes, is_active, sync_status, version)
      values (${ids.customerId}, ${ids.tenantId}, ${ids.branchId}, 'Budi Santoso', '081234567890', 'budi@example.com', 'Surabaya', 'Pelanggan prioritas', true, 'synced', 1)
      on conflict (id) do update set tenant_id = excluded.tenant_id, branch_id = excluded.branch_id, name = excluded.name, phone = excluded.phone, email = excluded.email, address = excluded.address, notes = excluded.notes, is_active = excluded.is_active, sync_status = excluded.sync_status, version = excluded.version
    `

    await tx`
      insert into sales_orders (id, tenant_id, branch_id, customer_id, order_number, status, subtotal, discount_total, tax_total, grand_total, paid_total, notes, sync_status, version)
      values (${ids.salesOrderId}, ${ids.tenantId}, ${ids.branchId}, ${ids.customerId}, 'INV-240608-001', 'paid', 450000, 0, 0, 450000, 450000, 'Seed transaksi Baim', 'synced', 1)
      on conflict (id) do update set tenant_id = excluded.tenant_id, branch_id = excluded.branch_id, customer_id = excluded.customer_id, order_number = excluded.order_number, status = excluded.status, subtotal = excluded.subtotal, discount_total = excluded.discount_total, tax_total = excluded.tax_total, grand_total = excluded.grand_total, paid_total = excluded.paid_total, notes = excluded.notes, sync_status = excluded.sync_status, version = excluded.version
    `

    await tx`
      insert into sales_order_items (id, tenant_id, sales_order_id, product_id, name, qty, unit_price, discount_total, subtotal)
      values (${ids.salesOrderItemId}, ${ids.tenantId}, ${ids.salesOrderId}, ${ids.productId}, 'Kabel Type-C Fast Charging', 10, 45000, 0, 450000)
      on conflict (id) do update set tenant_id = excluded.tenant_id, sales_order_id = excluded.sales_order_id, product_id = excluded.product_id, name = excluded.name, qty = excluded.qty, unit_price = excluded.unit_price, discount_total = excluded.discount_total, subtotal = excluded.subtotal
    `

    await tx`
      insert into payments (id, tenant_id, branch_id, sales_order_id, payment_number, method, amount, reference_number, status, sync_status)
      values (${ids.paymentId}, ${ids.tenantId}, ${ids.branchId}, ${ids.salesOrderId}, 'PAY-001', 'cash', 450000, 'BAIM-PAY-001', 'success', 'synced')
      on conflict (id) do update set tenant_id = excluded.tenant_id, branch_id = excluded.branch_id, sales_order_id = excluded.sales_order_id, payment_number = excluded.payment_number, method = excluded.method, amount = excluded.amount, reference_number = excluded.reference_number, status = excluded.status, sync_status = excluded.sync_status
    `

    await tx`
      insert into stock_movements (id, tenant_id, branch_id, warehouse_id, product_id, type, qty, reference_type, reference_id, notes, sync_status)
      values (${ids.stockMovementId}, ${ids.tenantId}, ${ids.branchId}, ${ids.warehouseId}, ${ids.productId}, 'sale', -10, 'sales_order', ${ids.salesOrderId}, 'Keluar untuk transaksi Baim', 'synced')
      on conflict (id) do update set tenant_id = excluded.tenant_id, branch_id = excluded.branch_id, warehouse_id = excluded.warehouse_id, product_id = excluded.product_id, type = excluded.type, qty = excluded.qty, reference_type = excluded.reference_type, reference_id = excluded.reference_id, notes = excluded.notes, sync_status = excluded.sync_status
    `
  })

  console.log('Seeded Baim runtime data successfully.')
} finally {
  await sql.end()
}
