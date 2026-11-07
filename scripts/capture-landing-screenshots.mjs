import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'fs'
import { join } from 'path'

const CHROME_PATH = '/home/ubuntu/VitPOS/chrome/linux_arm-157.0.8103.38/chrome-linux-arm64/chrome'
const BASE_URL = 'https://vitpos.devk.my.id'
const OUTPUT_DIR = '/home/ubuntu/VitPOS/public/images/landing'

mkdirSync(OUTPUT_DIR, { recursive: true })

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
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2, // HiDPI Retina quality for crisp screenshots
    },
  })

  try {
    const page = await browser.newPage()

    // 1. Login API to get token & user & memberships
    console.log('Authenticating via API...')
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@kotacom.id', password: 'change-me-admin-123' }),
    })
    const authData = await loginRes.json()
    console.log('Auth data received:', authData.ok)

    // Set localStorage auth store on the domain
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' })
    await page.evaluate((auth) => {
      const activeTenant = auth.memberships?.[0] ? {
        id: auth.memberships[0].tenantId,
        name: auth.memberships[0].tenantName || 'Kotacom HQ',
        code: 'hq',
        plan: auth.memberships[0].tenantPlan || 'enterprise-monthly',
        role: auth.memberships[0].role || 'owner',
      } : {
        id: '5f6909cb-e54f-4041-a0d0-045ad54d2481',
        name: 'Kotacom HQ',
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
    }, authData)

    console.log('Navigating to pages and capturing screenshots...')

    // Helper for capture
    async function capture(path, filename, waitTime = 2500) {
      console.log(`Capturing ${path} -> ${filename}...`)
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle2' })
      await new Promise((r) => setTimeout(r, waitTime))
      const outPath = join(OUTPUT_DIR, filename)
      await page.screenshot({ path: outPath, type: 'png' })
      console.log(`Saved ${outPath}`)
    }

    // 1. Kasir POS
    await capture('/pos', 'pos-screen.png', 3000)

    // 2. Service Orders
    await capture('/service-orders', 'service-orders.png', 3000)

    // 3. Sales Reports (Penjualan & Service)
    await capture('/reports/sales', 'sales-reports.png', 3000)

    // 4. Products & Sparepart Inventory
    await capture('/products', 'products-inventory.png', 3000)

    // 5. Profit & Loss / Keuangan
    await capture('/reports/profit-loss', 'profit-loss.png', 3000)

    // 6. Public Storefront Catalog
    await capture('/store/kotacom', 'storefront.png', 3000)

    console.log('All screenshots captured successfully!')
  } catch (err) {
    console.error('Error during capture:', err)
  } finally {
    await browser.close()
  }
}

run()
