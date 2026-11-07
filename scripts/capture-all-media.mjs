import puppeteer from 'puppeteer-core'
import { mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const CHROME_PATH = '/home/ubuntu/VitPOS/chrome/linux_arm-157.0.8103.38/chrome-linux-arm64/chrome'
const BASE_URL = 'https://vitpos.devk.my.id'
const OUTPUT_DIR = '/home/ubuntu/VitPOS/public/images/landing'
const FRAMES_DIR = '/tmp/vitpos-demo-frames'

mkdirSync(OUTPUT_DIR, { recursive: true })
if (existsSync(FRAMES_DIR)) {
  rmSync(FRAMES_DIR, { recursive: true, force: true })
}
mkdirSync(FRAMES_DIR, { recursive: true })

async function run() {
  console.log('Launching browser...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1440,900',
    ],
  })

  try {
    const page = await browser.newPage()

    // 1. Authenticate via API as demo user
    console.log('Authenticating via API...')
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@kotacom.id', password: 'demo12345' }),
    })
    const authData = await loginRes.json()
    console.log('Auth data received:', authData.ok, authData.user?.name)

    // Set localStorage auth store on the domain
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' })
    await page.evaluate((auth) => {
      const activeTenant = {
        id: '5f6909cb-e54f-4041-a0d0-045ad54d2481',
        name: 'Kotacom IT Service & Percetakan Digital',
        code: 'hq',
        plan: 'enterprise-monthly',
        role: 'owner',
      }

      const storagePayload = {
        state: {
          currentUser: auth.user,
          activeTenant,
          token: auth.accessToken,
        },
        version: 0,
      }
      localStorage.setItem('kotacom-auth-store', JSON.stringify(storagePayload))
      localStorage.setItem('vitpos-initial-sync-done', 'true')
    }, authData)

    // Helper to seed Dexie IndexedDB directly to guarantee immediate rich data
    console.log('Navigating to app to seed Dexie...')
    await page.goto(`${BASE_URL}/pos`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 2000))

    await page.evaluate(async () => {
      // Access IndexedDB directly or via Dexie
      return new Promise((resolve) => {
        const req = indexedDB.open('kotacom-business-suite')
        req.onsuccess = async (e) => {
          const db = e.target.result
          const tenantId = '5f6909cb-e54f-4041-a0d0-045ad54d2481'
          const now = new Date().toISOString()

          // Check if products exist in Dexie
          const tx = db.transaction([
            'products', 'customers', 'serviceOrders', 'salesOrders', 'salesOrderItems', 'payments', 'cash', 'productCategories'
          ], 'readwrite')

          const pStore = tx.objectStore('products')
          const cStore = tx.objectStore('customers')
          const soStore = tx.objectStore('serviceOrders')
          const sStore = tx.objectStore('salesOrders')
          const siStore = tx.objectStore('salesOrderItems')
          const payStore = tx.objectStore('payments')
          const cshStore = tx.objectStore('cash')
          const catStore = tx.objectStore('productCategories')

          const categories = [
            { id: 'c1', tenantId, name: 'Sparepart HP & Tablet', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'c2', tenantId, name: 'Hardware Laptop & PC', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'c3', tenantId, name: 'Bahan Percetakan & Kertas', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'c4', tenantId, name: 'Aksesoris & Retail', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'c5', tenantId, name: 'Jasa Servis & Desain', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
          ]
          categories.forEach((c) => catStore.put(c))

          const products = [
            { id: 'p1', tenantId, name: 'LCD iPhone 11 Pro OLED Original OEM', category: 'Sparepart HP & Tablet', type: 'Produk Fisik', price: 650000, costPrice: 420000, stock: 14, sku: 'SP-LCD-IP11P', barcode: '8990001001', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p2', tenantId, name: 'Baterai Samsung Galaxy A52 (4500mAh)', category: 'Sparepart HP & Tablet', type: 'Produk Fisik', price: 185000, costPrice: 95000, stock: 22, sku: 'SP-BAT-SMA52', barcode: '8990001002', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p3', tenantId, name: 'Flexible Charger Board Type-C Xiaomi Note 10', category: 'Sparepart HP & Tablet', type: 'Produk Fisik', price: 75000, costPrice: 35000, stock: 18, sku: 'SP-FLX-XMN10', barcode: '8990001003', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p4', tenantId, name: 'SSD NVMe M.2 512GB Kingston NV2 Gen 4', category: 'Hardware Laptop & PC', type: 'Produk Fisik', price: 550000, costPrice: 410000, stock: 16, sku: 'HW-SSD-512K', barcode: '8990002001', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p5', tenantId, name: 'RAM DDR4 Sodimm 8GB 3200MHz Samsung', category: 'Hardware Laptop & PC', type: 'Produk Fisik', price: 320000, costPrice: 230000, stock: 12, sku: 'HW-RAM-8GB32', barcode: '8990002002', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p6', tenantId, name: 'Thermal Paste Arctic MX-4 4gr Original', category: 'Hardware Laptop & PC', type: 'Produk Fisik', price: 85000, costPrice: 50000, stock: 30, sku: 'HW-TP-ARCTIC', barcode: '8990002003', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p7', tenantId, name: 'Keyboard Laptop Asus TUF Gaming FX505', category: 'Hardware Laptop & PC', type: 'Produk Fisik', price: 240000, costPrice: 160000, stock: 6, sku: 'HW-KBD-ASUS', barcode: '8990002004', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p8', tenantId, name: 'Kertas Art Paper 260gr A3+ (Rim / 500 Lbr)', category: 'Bahan Percetakan & Kertas', type: 'Produk Fisik', price: 140000, costPrice: 95000, stock: 25, sku: 'BP-AP260-A3', barcode: '8990003001', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p9', tenantId, name: 'Stiker Vinyl Matte A3+ Waterproof (Pack)', category: 'Bahan Percetakan & Kertas', type: 'Produk Fisik', price: 110000, costPrice: 72000, stock: 19, sku: 'BP-STK-VINYL', barcode: '8990003002', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p10', tenantId, name: 'Bahan Banner Flexi Korea 340gr (per m2)', category: 'Bahan Percetakan & Kertas', type: 'Produk Fisik', price: 35000, costPrice: 18000, stock: 120, sku: 'BP-FLX-340', barcode: '8990003003', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p11', tenantId, name: 'Tinta Botol Sublimasi Epson 100ml CMYK', category: 'Bahan Percetakan & Kertas', type: 'Produk Fisik', price: 85000, costPrice: 45000, stock: 36, sku: 'BP-TNT-SUB100', barcode: '8990003004', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p12', tenantId, name: 'Charger GaN 65W Dual Type-C + USB Baseus', category: 'Aksesoris & Retail', type: 'Produk Fisik', price: 195000, costPrice: 115000, stock: 15, sku: 'ACC-GAN-65W', barcode: '8990004001', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p13', tenantId, name: 'Kabel Fast Charging Braided Type-C to C 100W', category: 'Aksesoris & Retail', type: 'Produk Fisik', price: 45000, costPrice: 18000, stock: 45, sku: 'ACC-KBL-100W', barcode: '8990004002', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p14', tenantId, name: 'Tempered Glass 9D Full Cover All Type', category: 'Aksesoris & Retail', type: 'Produk Fisik', price: 35000, costPrice: 10000, stock: 60, sku: 'ACC-TG-9D', barcode: '8990004003', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p15', tenantId, name: 'Jasa Pasang LCD & TrueTone Kalibrasi', category: 'Jasa Servis & Desain', type: 'Jasa', price: 150000, costPrice: 0, stock: 0, sku: 'SRV-JS-LCD', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p16', tenantId, name: 'Jasa Cleaning Fan + Repaste Laptop Arctic MX-4', category: 'Jasa Servis & Desain', type: 'Jasa', price: 100000, costPrice: 15000, stock: 0, sku: 'SRV-JS-CLEAN', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p17', tenantId, name: 'Jasa Install Ulang Windows 11 + Software & Driver', category: 'Jasa Servis & Desain', type: 'Jasa', price: 100000, costPrice: 0, stock: 0, sku: 'SRV-JS-OS', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'p18', tenantId, name: 'Jasa Cetak Spanduk Outdoor Finishing Plong (m2)', category: 'Jasa Servis & Desain', type: 'Jasa', price: 35000, costPrice: 18000, stock: 0, sku: 'SRV-JS-BANNER', status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
          ]
          products.forEach((p) => pStore.put(p))

          const customers = [
            { id: 'c1', tenantId, name: 'Budi Santoso (Toko Berkah)', phone: '0812-3456-7890', city: 'Surabaya', address: 'Ruko Manyar Jaya Blok B4', receivable: 0, orders: 12, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'c2', tenantId, name: 'Ibu Maya (CV Graha Media)', phone: '0813-9988-7766', city: 'Sidoarjo', address: 'Kawasan Industri Rungkut', receivable: 0, orders: 8, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'c3', tenantId, name: 'Rian Pratama', phone: '0857-1234-5678', city: 'Surabaya', address: 'Jl. Gubeng Kertajaya VIII', receivable: 0, orders: 3, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'c4', tenantId, name: 'Dimas Wahyudi', phone: '0896-7788-9900', city: 'Surabaya', address: 'Asrama Mahasiswa ITS Sukolilo', receivable: 0, orders: 5, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'c5', tenantId, name: 'Bu Siti Aminah (Sekolah Harapan)', phone: '0821-5566-7788', city: 'Gresik', address: 'Jl. Raya Kebomas', receivable: 310000, orders: 4, status: 'Piutang', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'c6', tenantId, name: 'Kevin Sanjaya', phone: '0878-1122-3344', city: 'Surabaya', address: 'Perumahan Dharmahusada Indah', receivable: 0, orders: 7, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: now },
          ]
          customers.forEach((c) => cStore.put(c))

          const serviceOrders = [
            {
              id: 's1',
              tenantId,
              code: 'SRV-202611-001',
              customerId: 'c3',
              customerName: 'Rian Pratama',
              description: 'iPhone 11 Pro - Layar blank hitam bergaris setelah jatuh, getar & notifikasi masih bunyi. Ganti LCD OLED OEM + TrueTone',
              date: '04 November 2026',
              cost: 650000,
              paidTotal: 650000,
              status: 'Selesai',
              hasWarranty: true,
              warrantyValue: 30,
              warrantyUnit: 'hari',
              items: [
                { productId: 'p1', name: 'LCD iPhone 11 Pro OLED Original OEM', qty: 1, price: 500000, costPrice: 420000, subtotal: 500000 },
                { productId: 'p15', name: 'Jasa Pasang LCD & TrueTone', qty: 1, price: 150000, costPrice: 0, subtotal: 150000 },
              ],
              timeline: [
                { id: 't1', status: 'Diterima', date: '04/11/2026', note: 'Unit diterima teknisi Doni' },
                { id: 't2', status: 'Dikerjakan', date: '05/11/2026', note: 'Pemasangan LCD & kalibrasi TrueTone' },
                { id: 't3', status: 'Selesai', date: '06/11/2026', note: 'QC passed, unit siap diambil garansi 30 hari' },
              ],
              syncStatus: 'synced',
              version: 1,
              updatedAt: now,
            },
            {
              id: 's2',
              tenantId,
              code: 'SRV-202611-002',
              customerId: 'c2',
              customerName: 'Ibu Maya (CV Graha Media)',
              description: 'MacBook Pro 13" 2020 - Kipas bising abnormal, thermal paste kering & suhu capai 94C saat render. Repaste Arctic MX-4',
              date: '05 November 2026',
              cost: 350000,
              paidTotal: 150000,
              status: 'Dikerjakan',
              hasWarranty: true,
              warrantyValue: 30,
              warrantyUnit: 'hari',
              items: [
                { productId: 'p6', name: 'Thermal Paste Arctic MX-4', qty: 1, price: 85000, costPrice: 50000, subtotal: 85000 },
                { productId: 'p16', name: 'Jasa Cleaning Heatsink + Repaste', qty: 1, price: 265000, costPrice: 0, subtotal: 265000 },
              ],
              timeline: [
                { id: 't1', status: 'Diterima', date: '05/11/2026', note: 'DP Rp 150.000 QRIS' },
                { id: 't2', status: 'Dikerjakan', date: '06/11/2026', note: 'Cleaning kipas dan stress test suhu' },
              ],
              syncStatus: 'synced',
              version: 1,
              updatedAt: now,
            },
            {
              id: 's3',
              tenantId,
              code: 'SRV-202611-003',
              customerId: 'c4',
              customerName: 'Dimas Wahyudi',
              description: 'ASUS TUF Gaming F15 - Minta upgrade SSD NVMe M.2 512GB & clone Windows 11 + instalasi game drive',
              date: '05 November 2026',
              cost: 650000,
              paidTotal: 650000,
              status: 'Diambil',
              hasWarranty: true,
              warrantyValue: 90,
              warrantyUnit: 'hari',
              items: [
                { productId: 'p4', name: 'SSD NVMe M.2 512GB Kingston NV2', qty: 1, price: 550000, costPrice: 410000, subtotal: 550000 },
                { productId: 'p17', name: 'Jasa Pasang & Clone Windows 11', qty: 1, price: 100000, costPrice: 0, subtotal: 100000 },
              ],
              timeline: [
                { id: 't1', status: 'Diterima', date: '05/11/2026', note: 'Unit masuk' },
                { id: 't2', status: 'Selesai', date: '06/11/2026', note: 'Benchmark read 3500MB/s normal' },
                { id: 't3', status: 'Diambil', date: '07/11/2026', note: 'Diambil pelanggan lunas garansi 90 hari' },
              ],
              syncStatus: 'synced',
              version: 1,
              updatedAt: now,
            },
            {
              id: 's4',
              tenantId,
              code: 'SRV-202611-004',
              customerId: 'c5',
              customerName: 'Bu Siti Aminah (Sekolah Harapan)',
              description: 'Printer Epson L3210 - Indikator tinta dan kertas kedip serempak (General Error), waste ink pad penuh',
              date: '06 November 2026',
              cost: 175000,
              paidTotal: 0,
              status: 'Dikerjakan',
              hasWarranty: true,
              warrantyValue: 14,
              warrantyUnit: 'hari',
              items: [
                { productId: 'p11', name: 'Bantalan Waste Ink Pad + Reset Chip', qty: 1, price: 75000, costPrice: 35000, subtotal: 75000 },
                { productId: 'p16', name: 'Jasa Cleaning Head & Reset Counter', qty: 1, price: 100000, costPrice: 0, subtotal: 100000 },
              ],
              timeline: [
                { id: 't1', status: 'Diterima', date: '06/11/2026', note: 'Unit diantar kurir' },
                { id: 't2', status: 'Dikerjakan', date: '07/11/2026', note: 'Reset software dan sedot pembuangan' },
              ],
              syncStatus: 'synced',
              version: 1,
              updatedAt: now,
            },
            {
              id: 's5',
              tenantId,
              code: 'SRV-202611-005',
              customerId: 'c1',
              customerName: 'Budi Santoso (Toko Berkah)',
              description: 'Cetak Spanduk HUT Toko Berkah 4x1.5m bahan Flexi Korea 340gr resolusi tinggi mata ayam keliling',
              date: '06 November 2026',
              cost: 210000,
              paidTotal: 210000,
              status: 'Diambil',
              items: [
                { productId: 'p10', name: 'Flexi Korea 340gr (6 m2)', qty: 6, price: 35000, costPrice: 18000, subtotal: 210000 },
              ],
              timeline: [
                { id: 't1', status: 'Diterima', date: '06/11/2026', note: 'File siap cetak' },
                { id: 't2', status: 'Selesai', date: '06/11/2026', note: 'Cetak selesai & mata ayam rapi' },
                { id: 't3', status: 'Diambil', date: '07/11/2026', note: 'Diambil dan lunas' },
              ],
              syncStatus: 'synced',
              version: 1,
              updatedAt: now,
            },
            {
              id: 's6',
              tenantId,
              code: 'SRV-202611-006',
              customerId: 'c6',
              customerName: 'Kevin Sanjaya',
              description: 'Samsung Galaxy A52 - Baterai cepat habis drop dari 80% ke 0%, backdoor renggang terdorong baterai kembung',
              date: '07 November 2026',
              cost: 280000,
              paidTotal: 0,
              status: 'Diterima',
              items: [
                { productId: 'p2', name: 'Baterai Samsung Galaxy A52', qty: 1, price: 185000, costPrice: 95000, subtotal: 185000 },
                { productId: 'p15', name: 'Jasa Pasang & Lem Backdoor T-7000', qty: 1, price: 95000, costPrice: 0, subtotal: 95000 },
              ],
              timeline: [
                { id: 't1', status: 'Diterima', date: '07/11/2026', note: 'Unit masuk di counter' },
              ],
              syncStatus: 'synced',
              version: 1,
              updatedAt: now,
            },
            {
              id: 's7',
              tenantId,
              code: 'SRV-202611-007',
              customerId: 'c4',
              customerName: 'Dimas Wahyudi',
              description: 'Lenovo ThinkPad T480 - Mati total tidak ada indikator charging sama sekali, dugaan short kapasitor power rail 19V',
              date: '07 November 2026',
              cost: 450000,
              paidTotal: 0,
              status: 'Dikerjakan',
              items: [
                { productId: 'p15', name: 'Jasa Servis Motherboard & Ganti IC Mosfet', qty: 1, price: 450000, costPrice: 50000, subtotal: 450000 },
              ],
              timeline: [
                { id: 't1', status: 'Diterima', date: '07/11/2026', note: 'Unit masuk' },
                { id: 't2', status: 'Dikerjakan', date: '07/11/2026', note: 'Kapasitor PC401 diganti' },
              ],
              syncStatus: 'synced',
              version: 1,
              updatedAt: now,
            },
          ]
          serviceOrders.forEach((so) => soStore.put(so))

          const salesOrders = [
            {
              id: 'o1',
              tenantId,
              code: 'TRX-202611-001',
              customerId: 'c6',
              customerName: 'Kevin Sanjaya',
              date: '7 November 2026',
              subtotal: 240000,
              discountTotal: 0,
              taxTotal: 0,
              grandTotal: 240000,
              paidTotal: 240000,
              status: 'Lunas',
              items: [
                { id: 'si1', tenantId, salesOrderId: 'o1', productId: 'p12', name: 'Charger GaN 65W Dual Type-C + USB Baseus', qty: 1, unitPrice: 195000, subtotal: 195000 },
                { id: 'si2', tenantId, salesOrderId: 'o1', productId: 'p13', name: 'Kabel Fast Charging Braided Type-C to C 100W', qty: 1, unitPrice: 45000, subtotal: 45000 },
              ],
              syncStatus: 'synced',
              version: 1,
              updatedAt: now,
            },
            {
              id: 'o2',
              tenantId,
              code: 'TRX-202611-002',
              customerId: 'c2',
              customerName: 'Ibu Maya (CV Graha Media)',
              date: '6 November 2026',
              subtotal: 630000,
              discountTotal: 0,
              taxTotal: 0,
              grandTotal: 630000,
              paidTotal: 630000,
              status: 'Lunas',
              items: [
                { id: 'si3', tenantId, salesOrderId: 'o2', productId: 'p10', name: 'Bahan Banner Flexi Korea 340gr (10 m2)', qty: 10, unitPrice: 35000, subtotal: 350000 },
                { id: 'si4', tenantId, salesOrderId: 'o2', productId: 'p8', name: 'Kertas Art Paper 260gr A3+ (2 Rim)', qty: 2, unitPrice: 140000, subtotal: 280000 },
              ],
              syncStatus: 'synced',
              version: 1,
              updatedAt: now,
            },
            {
              id: 'o3',
              tenantId,
              code: 'TRX-202611-003',
              customerId: 'c3',
              customerName: 'Rian Pratama',
              date: '6 November 2026',
              subtotal: 650000,
              discountTotal: 0,
              taxTotal: 0,
              grandTotal: 650000,
              paidTotal: 650000,
              status: 'Lunas',
              items: [
                { id: 'si5', tenantId, salesOrderId: 'o3', productId: 'p1', name: 'LCD iPhone 11 Pro OLED Original OEM + Jasa', qty: 1, unitPrice: 650000, subtotal: 650000 },
              ],
              syncStatus: 'synced',
              version: 1,
              updatedAt: now,
            },
            {
              id: 'o4',
              tenantId,
              code: 'TRX-202611-004',
              customerId: 'c4',
              customerName: 'Dimas Wahyudi',
              date: '5 November 2026',
              subtotal: 870000,
              discountTotal: 0,
              taxTotal: 0,
              grandTotal: 870000,
              paidTotal: 870000,
              status: 'Lunas',
              items: [
                { id: 'si6', tenantId, salesOrderId: 'o4', productId: 'p4', name: 'SSD NVMe M.2 512GB Kingston NV2', qty: 1, unitPrice: 550000, subtotal: 550000 },
                { id: 'si7', tenantId, salesOrderId: 'o4', productId: 'p5', name: 'RAM DDR4 Sodimm 8GB 3200MHz Samsung', qty: 1, unitPrice: 320000, subtotal: 320000 },
              ],
              syncStatus: 'synced',
              version: 1,
              updatedAt: now,
            },
            {
              id: 'o5',
              tenantId,
              code: 'TRX-202611-005',
              customerId: 'c1',
              customerName: 'Budi Santoso (Toko Berkah)',
              date: '5 November 2026',
              subtotal: 280000,
              discountTotal: 0,
              taxTotal: 0,
              grandTotal: 280000,
              paidTotal: 280000,
              status: 'Lunas',
              items: [
                { id: 'si8', tenantId, salesOrderId: 'o5', productId: 'p10', name: 'Spanduk 4x1.5m Flexi Korea 340gr', qty: 6, unitPrice: 35000, subtotal: 210000 },
                { id: 'si9', tenantId, salesOrderId: 'o5', productId: 'p14', name: 'Tempered Glass 9D Full Cover', qty: 2, unitPrice: 35000, subtotal: 70000 },
              ],
              syncStatus: 'synced',
              version: 1,
              updatedAt: now,
            },
            {
              id: 'o6',
              tenantId,
              code: 'TRX-202611-006',
              customerId: 'c5',
              customerName: 'Bu Siti Aminah (Sekolah Harapan)',
              date: '4 November 2026',
              subtotal: 310000,
              discountTotal: 0,
              taxTotal: 0,
              grandTotal: 310000,
              paidTotal: 0,
              status: 'Belum Bayar',
              items: [
                { id: 'si10', tenantId, salesOrderId: 'o6', productId: 'p8', name: 'Kertas Art Paper 260gr A3+ (1 Rim)', qty: 1, unitPrice: 140000, subtotal: 140000 },
                { id: 'si11', tenantId, salesOrderId: 'o6', productId: 'p11', name: 'Tinta Botol Sublimasi Epson 100ml CMYK (2 Botol)', qty: 2, unitPrice: 85000, subtotal: 170000 },
              ],
              syncStatus: 'synced',
              version: 1,
              updatedAt: now,
            },
          ]
          salesOrders.forEach((o) => {
            sStore.put(o)
            o.items.forEach((item) => siStore.put(item))
          })

          const payments = [
            { id: 'pay1', tenantId, ref: 'PAY-202611-001', salesOrderId: 'o1', source: 'POS', method: 'tunai', amount: 240000, date: '7 November 2026', status: 'Berhasil', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'pay2', tenantId, ref: 'PAY-202611-002', salesOrderId: 'o2', source: 'POS', method: 'qris', amount: 630000, date: '6 November 2026', status: 'Berhasil', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'pay3', tenantId, ref: 'PAY-202611-003', salesOrderId: 'o3', source: 'Service', method: 'transfer', amount: 650000, date: '6 November 2026', status: 'Berhasil', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'pay4', tenantId, ref: 'PAY-202611-004', salesOrderId: 'o4', source: 'POS', method: 'qris', amount: 870000, date: '5 November 2026', status: 'Berhasil', syncStatus: 'synced', version: 1, updatedAt: now },
            { id: 'pay5', tenantId, ref: 'PAY-202611-005', salesOrderId: 'o5', source: 'POS', method: 'tunai', amount: 280000, date: '5 November 2026', status: 'Berhasil', syncStatus: 'synced', version: 1, updatedAt: now },
          ]
          payments.forEach((p) => payStore.put(p))

          const cash = [
            { id: 'csh1', tenantId, ref: 'KAS-202611-001', date: '3 November 2026', account: 'Kas Toko', category: 'Modal Awal Kasir', income: 1500000, expense: 0, status: 'Tercatat' },
            { id: 'csh2', tenantId, ref: 'KAS-202611-002', date: '4 November 2026', account: 'Kas Toko', category: 'Belanja Sparepart Glodok', income: 0, expense: 1850000, status: 'Tercatat' },
            { id: 'csh3', tenantId, ref: 'KAS-202611-003', date: '5 November 2026', account: 'Kas Toko', category: 'Listrik & Wifi Ruko', income: 0, expense: 450000, status: 'Tercatat' },
            { id: 'csh4', tenantId, ref: 'KAS-202611-004', date: '6 November 2026', account: 'Bank BCA', category: 'Pendapatan Kasir & Servis', income: 2670000, expense: 0, status: 'Tercatat' },
            { id: 'csh5', tenantId, ref: 'KAS-202611-005', date: '7 November 2026', account: 'Kas Toko', category: 'Penjualan Harian', income: 1140000, expense: 0, status: 'Tercatat' },
          ]
          cash.forEach((k) => cshStore.put(k))

          tx.oncomplete = () => {
            console.log('Dexie seeded with full rich data!')
            resolve(true)
          }
          tx.onerror = () => resolve(false)
        }
      })
    })

    console.log('Dexie seeded successfully!')

    // -------------------------------------------------------------
    // PART 1: CAPTURE DESKTOP SCREENSHOTS (1440 x 900, Retina 2x)
    // -------------------------------------------------------------
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })

    async function captureDesktop(path, filename, waitTime = 2500, preAction = null) {
      console.log(`[Desktop] Capturing ${path} -> ${filename}...`)
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle2' })
      await new Promise((r) => setTimeout(r, waitTime))
      if (preAction) {
        await preAction(page)
        await new Promise((r) => setTimeout(r, 1000))
      }
      const outPath = join(OUTPUT_DIR, filename)
      await page.screenshot({ path: outPath, type: 'png' })
      console.log(`Saved ${outPath}`)
    }

    // 1. Kasir POS Desktop (add an item so the cart is actively loaded with realistic data)
    await captureDesktop('/pos', 'pos-desktop.png', 2500, async (p) => {
      try {
        // Click on the first product card to put it in cart
        const productBtn = await p.$('button[class*="product-card"], button:has(h3), div[role="button"]:has(span)')
        if (productBtn) await productBtn.click()
      } catch {}
    })

    // Also mirror to legacy name
    execSync(`cp ${join(OUTPUT_DIR, 'pos-desktop.png')} ${join(OUTPUT_DIR, 'pos-screen.png')}`)

    // 2. Service Orders Desktop
    await captureDesktop('/service-orders', 'service-orders-desktop.png', 2500)
    execSync(`cp ${join(OUTPUT_DIR, 'service-orders-desktop.png')} ${join(OUTPUT_DIR, 'service-orders.png')}`)

    // 3. Sales Reports Desktop
    await captureDesktop('/reports/sales', 'sales-reports-desktop.png', 2500)
    execSync(`cp ${join(OUTPUT_DIR, 'sales-reports-desktop.png')} ${join(OUTPUT_DIR, 'sales-reports.png')}`)

    // 4. Products & Spareparts Desktop
    await captureDesktop('/products', 'products-inventory-desktop.png', 2500)
    execSync(`cp ${join(OUTPUT_DIR, 'products-inventory-desktop.png')} ${join(OUTPUT_DIR, 'products-inventory.png')}`)

    // 5. Profit & Loss Desktop
    await captureDesktop('/reports/profit-loss', 'profit-loss-desktop.png', 2500)
    execSync(`cp ${join(OUTPUT_DIR, 'profit-loss-desktop.png')} ${join(OUTPUT_DIR, 'profit-loss.png')}`)

    // 6. Public Storefront Desktop
    await captureDesktop('/store/kotacom', 'storefront-desktop.png', 2500)
    execSync(`cp ${join(OUTPUT_DIR, 'storefront-desktop.png')} ${join(OUTPUT_DIR, 'storefront.png')}`)

    // -------------------------------------------------------------
    // PART 2: CAPTURE MOBILE / HP SCREENSHOTS (390 x 844, Retina 2x)
    // -------------------------------------------------------------
    console.log('Switching to mobile viewport...')
    await page.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    })

    async function captureMobile(path, filename, waitTime = 2500) {
      console.log(`[Mobile] Capturing ${path} -> ${filename}...`)
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle2' })
      await new Promise((r) => setTimeout(r, waitTime))
      const outPath = join(OUTPUT_DIR, filename)
      await page.screenshot({ path: outPath, type: 'png' })
      console.log(`Saved ${outPath}`)
    }

    await captureMobile('/pos', 'pos-mobile.png', 2500)
    await captureMobile('/service-orders', 'service-orders-mobile.png', 2500)
    await captureMobile('/reports/sales', 'sales-reports-mobile.png', 2500)
    await captureMobile('/products', 'products-inventory-mobile.png', 2500)
    await captureMobile('/reports/profit-loss', 'profit-loss-mobile.png', 2500)
    await captureMobile('/store/kotacom', 'storefront-mobile.png', 2500)

    // -------------------------------------------------------------
    // PART 3: RECORD INTERACTIVE LIVE WALKTHROUGH
    // -------------------------------------------------------------
    console.log('Preparing interactive walkthrough recording...')
    await page.setViewport({ width: 1200, height: 750, deviceScaleFactor: 1 })
    await page.goto(`${BASE_URL}/pos`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 2000))

    let frameCount = 0
    const captureFrame = async () => {
      frameCount++
      const frameFile = join(FRAMES_DIR, `frame_${String(frameCount).padStart(4, '0')}.png`)
      await page.screenshot({ path: frameFile, type: 'png' })
    }

    console.log('Recording interactive actions...')
    // Initial hold
    for (let i = 0; i < 6; i++) {
      await captureFrame()
      await new Promise((r) => setTimeout(r, 100))
    }

    // Step 1: Type in search input
    const searchInput = await page.$('input[placeholder*="Cari"], input[type="search"]')
    if (searchInput) {
      await searchInput.focus()
      for (const char of 'LCD') {
        await page.keyboard.type(char)
        await captureFrame()
        await new Promise((r) => setTimeout(r, 80))
      }
    }

    // Wait for filtered list
    for (let i = 0; i < 4; i++) {
      await captureFrame()
      await new Promise((r) => setTimeout(r, 100))
    }

    // Step 2: Click on the product card
    const firstProduct = await page.$('button[class*="product-card"], button:has(h3), div[role="button"]')
    if (firstProduct) {
      await firstProduct.click()
      for (let i = 0; i < 6; i++) {
        await captureFrame()
        await new Promise((r) => setTimeout(r, 100))
      }
    }

    // Clear search to show more products
    if (searchInput) {
      await searchInput.click({ clickCount: 3 })
      await page.keyboard.press('Backspace')
      for (let i = 0; i < 4; i++) {
        await captureFrame()
        await new Promise((r) => setTimeout(r, 100))
      }
    }

    // Step 3: Click another item (e.g. second product)
    const productButtons = await page.$$('button[class*="product-card"], button:has(h3), div[role="button"]')
    if (productButtons.length > 2) {
      await productButtons[2].click()
      for (let i = 0; i < 6; i++) {
        await captureFrame()
        await new Promise((r) => setTimeout(r, 100))
      }
    }

    // Step 4: Click 'Bayar' button
    const payBtn = await page.$('button:has-text("Bayar"), button:has-text("Checkout"), button:has-text("Proses")')
    if (payBtn) {
      await payBtn.click()
      for (let i = 0; i < 8; i++) {
        await captureFrame()
        await new Promise((r) => setTimeout(r, 120))
      }
    }

    // Step 5: Navigate to Service Orders
    await page.goto(`${BASE_URL}/service-orders`, { waitUntil: 'networkidle2' })
    for (let i = 0; i < 10; i++) {
      await captureFrame()
      await new Promise((r) => setTimeout(r, 120))
    }

    // Step 6: Navigate to Sales Reports
    await page.goto(`${BASE_URL}/reports/sales`, { waitUntil: 'networkidle2' })
    for (let i = 0; i < 10; i++) {
      await captureFrame()
      await new Promise((r) => setTimeout(r, 120))
    }

    console.log(`Captured ${frameCount} frames. Encoding video with FFmpeg...`)

    // Encode MP4
    const mp4Path = join(OUTPUT_DIR, 'demo-walkthrough.mp4')
    execSync(
      `ffmpeg -y -r 10 -i ${FRAMES_DIR}/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -preset fast -crf 26 -movflags +faststart ${mp4Path}`,
      { stdio: 'inherit' }
    )
    console.log(`Generated MP4: ${mp4Path}`)

    // Encode WebM
    const webmPath = join(OUTPUT_DIR, 'demo-walkthrough.webm')
    execSync(
      `ffmpeg -y -r 10 -i ${FRAMES_DIR}/frame_%04d.png -c:v libvpx-vp9 -b:v 800k -crf 32 ${webmPath}`,
      { stdio: 'inherit' }
    )
    console.log(`Generated WebM: ${webmPath}`)

    // Encode Animated GIF
    const gifPath = join(OUTPUT_DIR, 'demo-walkthrough.gif')
    execSync(
      `ffmpeg -y -r 8 -i ${FRAMES_DIR}/frame_%04d.png -vf "fps=8,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" ${gifPath}`,
      { stdio: 'inherit' }
    )
    console.log(`Generated GIF: ${gifPath}`)

    // Cleanup temp frames
    rmSync(FRAMES_DIR, { recursive: true, force: true })
    console.log('All media captured and encoded successfully!')
  } catch (err) {
    console.error('Capture failed:', err)
  } finally {
    await browser.close()
  }
}

run()
