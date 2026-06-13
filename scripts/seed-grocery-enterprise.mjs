import { config } from 'dotenv'
import { createHash } from 'node:crypto'
import postgres from 'postgres'

config({ path: '.env.local' })
config()

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed grocery enterprise data')
}

const OWNER_EMAIL = process.env.GROCERY_OWNER_EMAIL ?? 'owner@toko-kelontong-besar.test'
const OWNER_PASSWORD = process.env.GROCERY_OWNER_PASSWORD ?? 'kelontong123'
const OWNER_NAME = process.env.GROCERY_OWNER_NAME ?? 'Owner Toko Kelontong Nusantara'

const sql = postgres(databaseUrl, { prepare: false, max: 1 })

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex')
}

function stableUuid(seed) {
  const hex = createHash('sha1').update(seed).digest('hex').slice(0, 32).split('')
  hex[12] = '4'
  hex[16] = ['8', '9', 'a', 'b'][parseInt(hex[16], 16) % 4]
  return `${hex.slice(0, 8).join('')}-${hex.slice(8, 12).join('')}-${hex.slice(12, 16).join('')}-${hex.slice(16, 20).join('')}-${hex.slice(20, 32).join('')}`
}

function numberFromSeed(seed, min, max) {
  const value = parseInt(createHash('md5').update(seed).digest('hex').slice(0, 8), 16)
  return min + (value % (max - min + 1))
}

function money(value) {
  return value.toFixed(2)
}

const categoryBlueprints = [
  { name: 'Beras & Sembako', items: ['Beras Ramos', 'Beras Premium', 'Gula Pasir', 'Garam Halus', 'Tepung Terigu', 'Tepung Tapioka', 'Minyak Goreng Pouch', 'Minyak Goreng Botol'] },
  { name: 'Mie & Pasta', items: ['Mie Instan Goreng', 'Mie Instan Kuah', 'Bihun Jagung', 'Spaghetti', 'Makaroni', 'Soun', 'Mie Telur', 'Kwetiau Kering'] },
  { name: 'Minuman Sachet', items: ['Kopi Sachet', 'Teh Celup', 'Susu Kental Manis', 'Cokelat Sachet', 'Minuman Jahe', 'Minuman Isotonik Bubuk', 'Minuman Energi Sachet', 'Krimer Bubuk'] },
  { name: 'Biskuit & Snack', items: ['Biskuit Marie', 'Wafer Cokelat', 'Keripik Singkong', 'Keripik Kentang', 'Kacang Kulit', 'Kacang Atom', 'Permen Mint', 'Snack Jagung'] },
  { name: 'Saus & Bumbu', items: ['Kecap Manis', 'Saus Sambal', 'Saus Tomat', 'Kaldu Bubuk', 'Bumbu Penyedap', 'Merica Bubuk', 'Ketumbar Bubuk', 'Santanku'] },
  { name: 'Susu & Sarapan', items: ['Sereal Jagung', 'Oat Instan', 'Susu UHT Cokelat', 'Susu UHT Plain', 'Susu Bubuk Balita', 'Susu Bubuk Dewasa', 'Roti Tawar Mini', 'Selai Cokelat'] },
  { name: 'Air Mineral & Minuman Botol', items: ['Air Mineral 600ml', 'Air Mineral 1500ml', 'Teh Botol', 'Minuman Soda', 'Jus Kotak', 'Minuman Kopi Botol', 'Minuman Teh Kotak', 'Minuman Yogurt'] },
  { name: 'Rokok & Dewasa', items: ['Rokok Filter 12', 'Rokok Kretek 12', 'Rokok Mild 16', 'Linting Tembakau', 'Korek Gas Mini', 'Korek Kayu', 'Asbak Mini', 'Filter Rokok'] },
  { name: 'Perawatan Pribadi', items: ['Sabun Mandi Batang', 'Sabun Mandi Cair', 'Shampo Sachet', 'Pasta Gigi', 'Sikat Gigi', 'Deodoran Roll On', 'Tisu Wajah', 'Tisu Toilet'] },
  { name: 'Kebersihan Rumah', items: ['Sabun Cuci Piring', 'Deterjen Bubuk', 'Deterjen Cair', 'Pewangi Pakaian', 'Pembersih Lantai', 'Pembersih Kaca', 'Kapur Barus', 'Spons Cuci'] },
  { name: 'Ibu & Bayi', items: ['Popok Bayi S', 'Popok Bayi M', 'Minyak Telon', 'Bedak Bayi', 'Tisu Basah Bayi', 'Bubur Bayi Instan', 'Sabun Bayi', 'Lotion Bayi'] },
  { name: 'Frozen & Protein', items: ['Sosis Ayam', 'Nugget Ayam', 'Bakso Frozen', 'Fishball', 'Telur Ayam Pack', 'Kornet Kaleng', 'Sarden Kaleng', 'Abon Sapi'] },
  { name: 'ATK Rumah Tangga', items: ['Pulpen Biru', 'Buku Tulis', 'Spidol Permanen', 'Lakban Bening', 'Kertas HVS A4', 'Amplop Cokelat', 'Penghapus', 'Pensil 2B'] },
  { name: 'Gas & Dapur', items: ['Gas Kaleng', 'Gas 3KG Aksesoris', 'Aluminium Foil', 'Plastik Klip', 'Sedotan', 'Tusuk Gigi', 'Kantong Plastik', 'Sarung Tangan Plastik'] },
  { name: 'Buah Kaleng & Camilan Premium', items: ['Jamur Kaleng', 'Jagung Manis Kaleng', 'Leci Kaleng', 'Biskuit Butter', 'Cokelat Batang', 'Granola Bar', 'Kerupuk Udang', 'Kacang Mede Panggang'] },
  { name: 'Rempah & Herbal', items: ['Kayu Manis', 'Cengkeh', 'Jinten Bubuk', 'Kapulaga', 'Asam Jawa', 'Gula Merah', 'Kunyit Bubuk', 'Jahe Merah Instan'] },
  { name: 'Perlengkapan Sekali Pakai', items: ['Masker Medis', 'Sarung Tangan Karet', 'Cup Plastik', 'Sendok Plastik', 'Piring Kertas', 'Tisu Makan', 'Plastik Sampah', 'Karet Gelang'] },
  { name: 'Pet Food', items: ['Makanan Kucing Dry', 'Makanan Kucing Wet', 'Pasir Kucing', 'Makanan Ikan Cupang', 'Snack Kucing', 'Vitamin Hewan', 'Shampo Hewan', 'Pasir Wangi'] },
  { name: 'Elektronik Ringan', items: ['Baterai AA', 'Baterai AAA', 'Lampu LED 9W', 'Lampu LED 12W', 'Charger USB', 'Kabel Data', 'Stop Kontak', 'Adaptor Colokan'] },
  { name: 'Seasonal & Parcel', items: ['Sirup Merah', 'Sirup Orange', 'Biskuit Kaleng Lebaran', 'Kurma Box', 'Parsel Mini', 'Parsel Keluarga', 'Plastik Parcel', 'Pita Parcel'] },
  { name: 'Jasa Titipan', items: ['Top Up Pulsa', 'Token Listrik', 'Voucher Game', 'Bayar Tagihan', 'Isi Ulang Galon', 'Print Dokumen', 'Fotokopi', 'Transfer Bank'] },
  { name: 'Bumbu Segar Kemasan', items: ['Bawang Goreng', 'Cabe Bubuk', 'Bumbu Rendang', 'Bumbu Soto', 'Bumbu Ayam Goreng', 'Bumbu Nasi Goreng', 'Terasi Sachet', 'Sambal Kemasan'] },
  { name: 'Roti & Kue Kering', items: ['Roti Sobek', 'Donat Mini', 'Brownies Pack', 'Bolu Gulung', 'Pie Susu', 'Kue Semprit', 'Nastar Mini', 'Lidah Kucing'] },
  { name: 'Kopi & Teh Premium', items: ['Kopi Arabika Ground', 'Kopi Robusta Ground', 'Teh Hijau', 'Teh Melati', 'Gula Aren Bubuk', 'Drip Coffee', 'Kopi Tubruk', 'Teh Tarik Sachet'] },
  { name: 'Laundry & Setrika', items: ['Pelicin Setrika', 'Kanji Pakaian', 'Pemutih Pakaian', 'Penghilang Noda', 'Parfum Laundry', 'Sabun Colet', 'Kantong Laundry', 'Hanger Plastik'] },
]

const brands = ['Nusantara', 'Makmur', 'Berkah', 'Jaya', 'Rasa', 'Segar', 'Prima', 'Lestari', 'Sukses', 'Bintang']
const cities = ['Jakarta', 'Bandung', 'Surabaya', 'Semarang', 'Yogyakarta', 'Malang', 'Solo', 'Bogor', 'Depok', 'Bekasi']
const paymentMethods = [
  ['Tunai', 'Cash Drawer', 'cash'],
  ['QRIS', 'Bank Indonesia', 'qris'],
  ['Transfer BCA', 'BCA', 'transfer'],
  ['Transfer Mandiri', 'Mandiri', 'transfer'],
  ['Kartu Debit', 'EDC BNI', 'card'],
  ['GoPay', 'Gojek', 'ewallet'],
  ['OVO', 'OVO', 'ewallet'],
  ['Piutang', 'Internal', 'receivable'],
]
const cashCategories = [
  ['Penjualan Tunai', 'income'],
  ['Pendapatan Lain', 'income'],
  ['Setoran Modal', 'income'],
  ['Pembelian Barang', 'expense'],
  ['Biaya Operasional', 'expense'],
  ['Gaji Harian', 'expense'],
  ['Transport Supplier', 'expense'],
  ['Kas Kecil', 'expense'],
]

function makeProductCatalog(tenantId, branchId) {
  const categories = []
  const products = []

  categoryBlueprints.forEach((category, categoryIndex) => {
    const categoryId = stableUuid(`grocery-category-${category.name}`)
    categories.push({
      id: categoryId,
      tenantId,
      name: category.name,
      isActive: true,
      syncStatus: 'synced',
      version: 1,
    })

    category.items.forEach((baseName, itemIndex) => {
      const variantCount = categoryIndex < 5 ? 2 : 1
      for (let variant = 1; variant <= variantCount; variant += 1) {
        const name = variantCount === 1 ? `${baseName} ${brands[(categoryIndex + itemIndex) % brands.length]}` : `${baseName} ${variant === 1 ? 'Regular' : 'Ekonomis'} ${brands[(categoryIndex + itemIndex + variant) % brands.length]}`
        const productId = stableUuid(`grocery-product-${category.name}-${baseName}-${variant}`)
        const seed = `${category.name}-${baseName}-${variant}`
        const cost = numberFromSeed(`${seed}-cost`, 2500, 95000)
        const margin = numberFromSeed(`${seed}-margin`, 8, 35)
        const sale = Math.round(cost * (1 + margin / 100) / 100) * 100
        const stock = numberFromSeed(`${seed}-stock`, 10, 240)
        const minimum = numberFromSeed(`${seed}-min`, 3, 18)
        const isService = category.name === 'Jasa Titipan'

        products.push({
          id: productId,
          tenantId,
          branchId,
          categoryId,
          name,
          sku: `SKU-${String(products.length + 1).padStart(4, '0')}`,
          barcode: `899${String(products.length + 1).padStart(10, '0')}`,
          type: isService ? 'service' : 'physical',
          salePrice: money(sale),
          wholesalePrice: isService ? null : money(Math.max(cost, Math.round(sale * 0.94 / 100) * 100)),
          costPrice: money(cost),
          wholesaleTiers: isService ? null : [{ minQty: 6, price: Math.max(cost, Math.round(sale * 0.95 / 100) * 100) }, { minQty: 12, price: Math.max(cost, Math.round(sale * 0.92 / 100) * 100) }],
          minimumStock: minimum,
          manageStock: !isService,
          imageUrl: null,
          icon: isService ? 'MonitorSmartphone' : 'Package',
          isActive: true,
          syncStatus: 'synced',
          version: 1,
          stock,
        })
      }
    })
  })

  return { categories, products }
}

function makeSuppliers(tenantId) {
  return Array.from({ length: 110 }, (_, index) => ({
    id: stableUuid(`grocery-supplier-${index + 1}`),
    tenantId,
    name: `Supplier ${brands[index % brands.length]} ${index + 1}`,
    phone: `0819${String(10000000 + index).slice(0, 8)}`,
    city: cities[index % cities.length],
    payable: money(0),
    orders: 0,
    isActive: true,
    syncStatus: 'synced',
    version: 1,
  }))
}

function makeCustomers(tenantId, branchId) {
  return Array.from({ length: 120 }, (_, index) => ({
    id: stableUuid(`grocery-customer-${index + 1}`),
    tenantId,
    branchId,
    name: `Pelanggan ${index + 1}`,
    phone: `0821${String(10000000 + index).slice(0, 8)}`,
    email: `pelanggan${index + 1}@contoh.test`,
    address: `Jl. Contoh No. ${index + 1}`,
    notes: index % 10 === 0 ? 'Pelanggan grosir' : null,
    isActive: true,
    syncStatus: 'synced',
    version: 1,
  }))
}

function pickMany(items, start, count) {
  return Array.from({ length: count }, (_, offset) => items[(start + offset) % items.length])
}

function valueForColumn(row, column) {
  if (Object.prototype.hasOwnProperty.call(row, column)) return row[column]
  const camel = column.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  return row[camel]
}

async function upsertRows(tx, table, columns, rows, conflictColumn = 'id') {
  const chunkSize = 100
  const updateColumns = columns.filter((column) => column !== conflictColumn)

  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize)
    const values = []
    const placeholders = chunk.map((row, rowIndex) => {
      const rowPlaceholders = columns.map((column, columnIndex) => {
        values.push(valueForColumn(row, column))
        return `$${rowIndex * columns.length + columnIndex + 1}`
      })
      return `(${rowPlaceholders.join(', ')})`
    })

    await tx.unsafe(
      `insert into ${table} (${columns.join(', ')}) values ${placeholders.join(', ')} on conflict (${conflictColumn}) do update set ${updateColumns.map((column) => `${column} = excluded.${column}`).join(', ')}`,
      values,
    )
  }
}

try {
  const passwordHash = hashPassword(OWNER_PASSWORD)
  const now = new Date()
  const tenantId = stableUuid('grocery-tenant')
  const userId = stableUuid('grocery-user-owner')
  const branchId = stableUuid('grocery-branch-main')
  const warehouseId = stableUuid('grocery-warehouse-main')
  const shiftId = stableUuid('grocery-shift-main')

  const { categories, products } = makeProductCatalog(tenantId, branchId)
  const suppliers = makeSuppliers(tenantId)
  const customers = makeCustomers(tenantId, branchId)

  const salesOrders = []
  const salesOrderItems = []
  const payments = []
  const stockMovements = []
  const purchases = []
  const purchaseItems = []
  const returns = []
  const returnItems = []
  const cashRows = []
  const serviceOrders = []

  for (let i = 0; i < 160; i += 1) {
    const customer = customers[i % customers.length]
    const selectedProducts = pickMany(products.filter((item) => item.type === 'physical'), i * 3, 3)
    const orderId = stableUuid(`grocery-sales-order-${i + 1}`)
    const orderDate = new Date(Date.UTC(2026, 0, 1 + (i % 170), 8 + (i % 10), i % 60))
    let subtotal = 0

    selectedProducts.forEach((product, itemIndex) => {
      const qty = numberFromSeed(`${orderId}-qty-${itemIndex}`, 1, 8)
      const unitPrice = Number(product.salePrice)
      const lineSubtotal = qty * unitPrice
      subtotal += lineSubtotal
      salesOrderItems.push({
        id: stableUuid(`${orderId}-item-${itemIndex + 1}`),
        tenantId,
        salesOrderId: orderId,
        productId: product.id,
        name: product.name,
        qty: String(qty),
        unitPrice: money(unitPrice),
        discountTotal: money(0),
        subtotal: money(lineSubtotal),
      })
      stockMovements.push({
        id: stableUuid(`${orderId}-stock-sale-${itemIndex + 1}`),
        tenantId,
        branchId,
        warehouseId,
        productId: product.id,
        type: 'sale',
        qty: String(-qty),
        referenceType: 'sales_order',
        referenceId: orderId,
        notes: `Penjualan ${i + 1}`,
        syncStatus: 'synced',
      })
    })

    const paidRatio = i % 5 === 0 ? 0 : i % 3 === 0 ? 0.5 : 1
    const paidTotal = Math.round(subtotal * paidRatio)
    const status = paidTotal === 0 ? 'unpaid' : paidTotal >= subtotal ? 'paid' : 'partial'

    salesOrders.push({
      id: orderId,
      tenantId,
      branchId,
      customerId: customer.id,
      orderNumber: `INV-26${String(i + 1).padStart(4, '0')}`,
      status,
      subtotal: money(subtotal),
      discountTotal: money(0),
      taxTotal: money(0),
      grandTotal: money(subtotal),
      paidTotal: money(paidTotal),
      notes: `Transaksi sample ${i + 1}`,
      syncStatus: 'synced',
      version: 1,
      createdAt: orderDate,
      updatedAt: orderDate,
    })

    if (paidTotal > 0) {
      payments.push({
        id: stableUuid(`${orderId}-payment`),
        tenantId,
        branchId,
        salesOrderId: orderId,
        serviceOrderId: null,
        purchaseId: null,
        paymentNumber: `PAY-SO-${String(i + 1).padStart(4, '0')}`,
        source: 'sales_order',
        method: i % 4 === 0 ? 'qris' : i % 4 === 1 ? 'cash' : i % 4 === 2 ? 'transfer' : 'card',
        amount: money(paidTotal),
        referenceNumber: `REF-SO-${i + 1}`,
        status: 'success',
        syncStatus: 'synced',
        createdAt: orderDate,
        updatedAt: orderDate,
      })
    }

    cashRows.push({
      id: stableUuid(`${orderId}-cash`),
      tenantId,
      branchId,
      ref: `CASH-SO-${String(i + 1).padStart(4, '0')}`,
      date: orderDate,
      categoryId: stableUuid('cash-category-sales'),
      income: money(paidTotal),
      expense: money(0),
      status: 'posted',
      syncStatus: 'synced',
      createdAt: orderDate,
      updatedAt: orderDate,
    })
  }

  for (let i = 0; i < 90; i += 1) {
    const supplier = suppliers[i % suppliers.length]
    const selectedProducts = pickMany(products.filter((item) => item.type === 'physical'), i * 2, 4)
    const purchaseId = stableUuid(`grocery-purchase-${i + 1}`)
    const purchaseDate = new Date(Date.UTC(2026, 0, 1 + (i % 150), 6 + (i % 8), i % 60))
    let subtotal = 0

    selectedProducts.forEach((product, itemIndex) => {
      const qty = numberFromSeed(`${purchaseId}-qty-${itemIndex}`, 6, 24)
      const unitPrice = Number(product.costPrice ?? product.salePrice)
      const lineSubtotal = qty * unitPrice
      subtotal += lineSubtotal
      purchaseItems.push({
        id: stableUuid(`${purchaseId}-item-${itemIndex + 1}`),
        tenantId,
        purchaseId,
        productId: product.id,
        name: product.name,
        qty: String(qty),
        unitPrice: money(unitPrice),
        subtotal: money(lineSubtotal),
      })
      stockMovements.push({
        id: stableUuid(`${purchaseId}-stock-purchase-${itemIndex + 1}`),
        tenantId,
        branchId,
        warehouseId,
        productId: product.id,
        type: 'purchase',
        qty: String(qty),
        referenceType: 'purchase',
        referenceId: purchaseId,
        notes: `Pembelian ${i + 1}`,
        syncStatus: 'synced',
      })
    })

    purchases.push({
      id: purchaseId,
      tenantId,
      branchId,
      supplierId: supplier.id,
      code: `PO-26${String(i + 1).padStart(4, '0')}`,
      date: purchaseDate,
      subtotal: money(subtotal),
      grandTotal: money(subtotal),
      status: i % 5 === 0 ? 'draft' : i % 3 === 0 ? 'shipped' : 'received',
      syncStatus: 'synced',
      version: 1,
      createdAt: purchaseDate,
      updatedAt: purchaseDate,
    })

    cashRows.push({
      id: stableUuid(`${purchaseId}-cash`),
      tenantId,
      branchId,
      ref: `CASH-PO-${String(i + 1).padStart(4, '0')}`,
      date: purchaseDate,
      categoryId: stableUuid('cash-category-purchase'),
      income: money(0),
      expense: money(subtotal),
      status: 'posted',
      syncStatus: 'synced',
      createdAt: purchaseDate,
      updatedAt: purchaseDate,
    })
  }

  for (let i = 0; i < 36; i += 1) {
    const sourceOrder = salesOrders[i]
    const sourceItem = salesOrderItems.find((item) => item.salesOrderId === sourceOrder.id)
    if (!sourceItem) continue
    const returnId = stableUuid(`grocery-return-${i + 1}`)
    const qty = numberFromSeed(`${returnId}-qty`, 1, 2)
    const total = qty * Number(sourceItem.unitPrice)
    const returnDate = new Date(Date.UTC(2026, 2, 1 + i, 10, 0))

    returns.push({
      id: returnId,
      tenantId,
      branchId,
      code: `RET-26${String(i + 1).padStart(4, '0')}`,
      type: 'sale',
      referenceCode: sourceOrder.orderNumber,
      date: returnDate,
      total: money(total),
      status: i % 4 === 0 ? 'processing' : 'completed',
      syncStatus: 'synced',
      version: 1,
      createdAt: returnDate,
      updatedAt: returnDate,
    })

    returnItems.push({
      id: stableUuid(`${returnId}-item`),
      tenantId,
      returnId,
      productId: sourceItem.productId,
      name: sourceItem.name,
      qty: String(qty),
      unitPrice: sourceItem.unitPrice,
      subtotal: money(total),
    })

    stockMovements.push({
      id: stableUuid(`${returnId}-stock`),
      tenantId,
      branchId,
      warehouseId,
      productId: sourceItem.productId,
      type: 'return',
      qty: String(qty),
      referenceType: 'return',
      referenceId: returnId,
      notes: `Retur penjualan ${i + 1}`,
      syncStatus: 'synced',
    })
  }

  for (let i = 0; i < 24; i += 1) {
    const customer = customers[i % customers.length]
    const serviceId = stableUuid(`grocery-service-${i + 1}`)
    const serviceDate = new Date(Date.UTC(2026, 3, 1 + i, 9, 30))
    const cost = numberFromSeed(`${serviceId}-cost`, 15000, 85000)
    const paid = i % 3 === 0 ? cost / 2 : cost
    serviceOrders.push({
      id: serviceId,
      tenantId,
      branchId,
      customerId: customer.id,
      code: `SV-26${String(i + 1).padStart(4, '0')}`,
      customerName: customer.name,
      description: `Jasa titipan ${i + 1}`,
      date: serviceDate,
      cost: money(cost),
      paidTotal: money(paid),
      items: [],
      timeline: [{ label: 'Diterima', at: serviceDate.toISOString() }],
      status: i % 5 === 0 ? 'received' : i % 4 === 0 ? 'in_progress' : 'completed',
      syncStatus: 'synced',
      version: 1,
      createdAt: serviceDate,
      updatedAt: serviceDate,
    })
  }

  const paymentMethodRows = paymentMethods.map(([name, provider, type], index) => ({
    id: stableUuid(`payment-method-${name}`),
    tenantId,
    name,
    provider,
    type,
    accountNumber: null,
    accountName: null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }))

  const cashCategoryRows = cashCategories.map(([name, type], index) => ({
    id: index === 0 ? stableUuid('cash-category-sales') : index === 3 ? stableUuid('cash-category-purchase') : stableUuid(`cash-category-${name}`),
    tenantId,
    name,
    type,
    isActive: true,
    syncStatus: 'synced',
    version: 1,
    createdAt: now,
    updatedAt: now,
  }))

  const settingsRows = [
    ['business_vertical', 'System', 'retail_grocery'],
    ['business_mode', 'System', 'enterprise'],
    ['company_name', 'Profil Usaha', 'Toko Kelontong Nusantara'],
    ['city', 'Profil Usaha', 'Surabaya'],
    ['default_branch_name', 'System', 'Cabang Utama'],
  ].map(([key, area, value]) => ({
    id: stableUuid(`setting-${key}`),
    tenantId,
    key,
    area,
    value,
    status: 'active',
    syncStatus: 'synced',
    createdAt: now,
    updatedAt: now,
  }))

  await sql.begin(async (tx) => {
    await tx`
      insert into users (id, email, name, password_hash, role, created_at, updated_at)
      values (${userId}, ${OWNER_EMAIL}, ${OWNER_NAME}, ${passwordHash}, 'user', ${now}, ${now})
      on conflict (email) do update set name = excluded.name, password_hash = excluded.password_hash, updated_at = excluded.updated_at
    `

    await tx`
      insert into tenants (id, name, legal_name, phone, email, address, plan_code, billing_period, subscription_status, storage_limit_mb, max_branches, is_active, created_at, updated_at)
      values (${tenantId}, 'Toko Kelontong Nusantara', 'PT Toko Kelontong Nusantara', '031-5551000', ${OWNER_EMAIL}, 'Jl. Raya Grosir No. 88, Surabaya', 'enterprise-monthly', 'monthly', 'active', 10240, 99, true, ${now}, ${now})
      on conflict (id) do update set name = excluded.name, legal_name = excluded.legal_name, phone = excluded.phone, email = excluded.email, address = excluded.address, plan_code = excluded.plan_code, billing_period = excluded.billing_period, subscription_status = excluded.subscription_status, storage_limit_mb = excluded.storage_limit_mb, max_branches = excluded.max_branches, is_active = excluded.is_active, updated_at = excluded.updated_at
    `

    await tx`
      insert into branches (id, tenant_id, name, address, phone, is_default, is_active, created_at, updated_at)
      values (${branchId}, ${tenantId}, 'Cabang Utama', 'Surabaya', '031-5551001', true, true, ${now}, ${now})
      on conflict (id) do update set tenant_id = excluded.tenant_id, name = excluded.name, address = excluded.address, phone = excluded.phone, is_default = excluded.is_default, is_active = excluded.is_active, updated_at = excluded.updated_at
    `

    await tx`
      insert into warehouses (id, tenant_id, branch_id, name, is_default, is_active, created_at, updated_at)
      values (${warehouseId}, ${tenantId}, ${branchId}, 'Gudang Utama', true, true, ${now}, ${now})
      on conflict (id) do update set tenant_id = excluded.tenant_id, branch_id = excluded.branch_id, name = excluded.name, is_default = excluded.is_default, is_active = excluded.is_active, updated_at = excluded.updated_at
    `

    await tx`
      insert into tenant_members (id, tenant_id, user_id, role, is_active, created_at, updated_at)
      values (${stableUuid('grocery-member-owner')}, ${tenantId}, ${userId}, 'owner', true, ${now}, ${now})
      on conflict (id) do update set role = excluded.role, is_active = excluded.is_active, updated_at = excluded.updated_at
    `

    await tx`
      insert into shifts (id, tenant_id, branch_id, cashier_name, start_time, start_cash, status, sync_status, created_at, updated_at)
      values (${shiftId}, ${tenantId}, ${branchId}, 'Kasir Pagi', ${now}, '1500000.00', 'open', 'synced', ${now}, ${now})
      on conflict (id) do update set cashier_name = excluded.cashier_name, start_time = excluded.start_time, start_cash = excluded.start_cash, status = excluded.status, sync_status = excluded.sync_status, updated_at = excluded.updated_at
    `

    await upsertRows(tx, 'product_categories', ['id', 'tenant_id', 'name', 'is_active', 'sync_status', 'version'], categories.map((row) => ({
      id: row.id, tenant_id: row.tenantId, name: row.name, is_active: row.isActive, sync_status: row.syncStatus, version: row.version,
    })))

    await upsertRows(tx, 'products', ['id', 'tenant_id', 'branch_id', 'category_id', 'name', 'sku', 'barcode', 'type', 'sale_price', 'wholesale_price', 'cost_price', 'wholesale_tiers', 'minimum_stock', 'manage_stock', 'image_url', 'icon', 'is_active', 'sync_status', 'version'], products.map((row) => ({
      id: row.id, tenant_id: row.tenantId, branch_id: row.branchId, category_id: row.categoryId, name: row.name, sku: row.sku, barcode: row.barcode, type: row.type, sale_price: row.salePrice, wholesale_price: row.wholesalePrice, cost_price: row.costPrice, wholesale_tiers: row.wholesaleTiers ? JSON.stringify(row.wholesaleTiers) : null, minimum_stock: row.minimumStock, manage_stock: row.manageStock, image_url: row.imageUrl, icon: row.icon, is_active: row.isActive, sync_status: row.syncStatus, version: row.version,
    })))

    await upsertRows(tx, 'suppliers', ['id', 'tenant_id', 'name', 'phone', 'city', 'payable', 'orders', 'is_active', 'sync_status', 'version'], suppliers.map((row) => ({
      id: row.id, tenant_id: row.tenantId, name: row.name, phone: row.phone, city: row.city, payable: row.payable, orders: row.orders, is_active: row.isActive, sync_status: row.syncStatus, version: row.version,
    })))

    await upsertRows(tx, 'customers', ['id', 'tenant_id', 'branch_id', 'name', 'phone', 'email', 'address', 'notes', 'is_active', 'sync_status', 'version'], customers.map((row) => ({
      id: row.id, tenant_id: row.tenantId, branch_id: row.branchId, name: row.name, phone: row.phone, email: row.email, address: row.address, notes: row.notes, is_active: row.isActive, sync_status: row.syncStatus, version: row.version,
    })))

    await upsertRows(tx, 'payment_methods', ['id', 'tenant_id', 'name', 'provider', 'type', 'account_number', 'account_name', 'status', 'created_at', 'updated_at'], paymentMethodRows)
    await upsertRows(tx, 'cash_categories', ['id', 'tenant_id', 'name', 'type', 'is_active', 'sync_status', 'version', 'created_at', 'updated_at'], cashCategoryRows)
    await upsertRows(tx, 'settings', ['id', 'tenant_id', 'key', 'area', 'value', 'status', 'sync_status', 'created_at', 'updated_at'], settingsRows)
    await upsertRows(tx, 'sales_orders', ['id', 'tenant_id', 'branch_id', 'customer_id', 'order_number', 'status', 'subtotal', 'discount_total', 'tax_total', 'grand_total', 'paid_total', 'notes', 'sync_status', 'version', 'created_at', 'updated_at'], salesOrders)
    await upsertRows(tx, 'sales_order_items', ['id', 'tenant_id', 'sales_order_id', 'product_id', 'name', 'qty', 'unit_price', 'discount_total', 'subtotal', 'created_at', 'updated_at'], salesOrderItems.map((row) => ({ ...row, created_at: now, updated_at: now })))
    await upsertRows(tx, 'payments', ['id', 'tenant_id', 'branch_id', 'sales_order_id', 'service_order_id', 'purchase_id', 'payment_number', 'source', 'method', 'amount', 'reference_number', 'status', 'sync_status', 'created_at', 'updated_at'], payments)
    await upsertRows(tx, 'stock_movements', ['id', 'tenant_id', 'branch_id', 'warehouse_id', 'product_id', 'type', 'qty', 'reference_type', 'reference_id', 'notes', 'sync_status', 'created_at', 'updated_at'], stockMovements.map((row) => ({ ...row, created_at: now, updated_at: now })))
    await upsertRows(tx, 'purchases', ['id', 'tenant_id', 'branch_id', 'supplier_id', 'code', 'date', 'subtotal', 'grand_total', 'status', 'sync_status', 'version', 'created_at', 'updated_at'], purchases)
    await upsertRows(tx, 'purchase_items', ['id', 'tenant_id', 'purchase_id', 'product_id', 'name', 'qty', 'unit_price', 'subtotal', 'created_at', 'updated_at'], purchaseItems.map((row) => ({ ...row, created_at: now, updated_at: now })))
    await upsertRows(tx, 'returns', ['id', 'tenant_id', 'branch_id', 'code', 'type', 'reference_code', 'date', 'total', 'status', 'sync_status', 'version', 'created_at', 'updated_at'], returns)
    await upsertRows(tx, 'return_items', ['id', 'tenant_id', 'return_id', 'product_id', 'name', 'qty', 'unit_price', 'subtotal', 'created_at', 'updated_at'], returnItems.map((row) => ({ ...row, created_at: now, updated_at: now })))
    await upsertRows(tx, 'cash', ['id', 'tenant_id', 'branch_id', 'ref', 'date', 'category_id', 'income', 'expense', 'status', 'sync_status', 'created_at', 'updated_at'], cashRows)
    await upsertRows(tx, 'service_orders', ['id', 'tenant_id', 'branch_id', 'customer_id', 'code', 'customer_name', 'description', 'date', 'cost', 'paid_total', 'items', 'timeline', 'status', 'sync_status', 'version', 'created_at', 'updated_at'], serviceOrders)
  })

  console.log('✅ Grocery enterprise seed completed')
  console.log(`👤 Login: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`)
  console.log(`📦 Products: ${products.length}`)
  console.log(`🗂 Categories: ${categories.length}`)
  console.log(`🏭 Suppliers: ${suppliers.length}`)
  console.log(`🧾 Customers: ${customers.length}`)
  console.log(`🛒 Sales orders: ${salesOrders.length}`)
  console.log(`🚚 Purchases: ${purchases.length}`)
  console.log(`↩ Returns: ${returns.length}`)
  console.log(`🛠 Service orders: ${serviceOrders.length}`)
} catch (err) {
  console.error('❌ Grocery seed failed:', err)
  process.exit(1)
} finally {
  await sql.end()
}
