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
  console.log('Launching browser for video recording...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1280,720',
    ],
    defaultViewport: {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
    },
  })

  try {
    const page = await browser.newPage()

    // 1. Authenticate via API as demo user
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@kotacom.id', password: 'demo12345' }),
    })
    const authData = await loginRes.json()

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' })
    await page.evaluate((auth) => {
      const activeTenant = {
        id: '5f6909cb-e54f-4041-a0d0-045ad54d2481',
        name: 'Kotacom IT Service & Percetakan Digital',
        code: 'hq',
        plan: 'enterprise-monthly',
        role: 'owner',
      }
      localStorage.setItem(
        'kotacom-auth-store',
        JSON.stringify({
          state: {
            currentUser: auth.user,
            activeTenant,
            token: auth.accessToken,
          },
          version: 0,
        })
      )
      localStorage.setItem('vitpos-initial-sync-done', 'true')
    }, authData)

    console.log('Navigating to Kasir POS...')
    await page.goto(`${BASE_URL}/pos`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 2000))

    let frameCount = 0
    const captureFrame = async (count = 1, delay = 100) => {
      for (let i = 0; i < count; i++) {
        frameCount++
        const frameFile = join(FRAMES_DIR, `frame_${String(frameCount).padStart(4, '0')}.png`)
        await page.screenshot({ path: frameFile, type: 'png' })
        if (delay > 0) await new Promise((r) => setTimeout(r, delay))
      }
    }

    console.log('Recording: Initial scene on POS (products & cart)...')
    await captureFrame(10, 100)

    console.log('Recording: Typing search "LCD"...')
    const searchInput = await page.$('input[placeholder*="Cari"], input[type="search"], input[type="text"]')
    if (searchInput) {
      await searchInput.focus()
      for (const char of 'LCD') {
        await page.keyboard.type(char)
        await captureFrame(2, 70)
      }
    }
    await captureFrame(6, 100)

    console.log('Recording: Clicking first product to add to cart...')
    await page.evaluate(() => {
      const card = document.querySelector('button[class*="product"], div[role="button"], button:has(h3)')
      if (card) card.click()
    })
    await captureFrame(8, 100)

    console.log('Recording: Clearing search to see all spareparts & services...')
    if (searchInput) {
      await searchInput.click({ clickCount: 3 })
      await page.keyboard.press('Backspace')
    }
    await captureFrame(6, 100)

    console.log('Recording: Clicking another product/service...')
    await page.evaluate(() => {
      const cards = document.querySelectorAll('button[class*="product"], button:has(h3)')
      if (cards.length > 2) cards[2].click()
    })
    await captureFrame(8, 100)

    console.log('Recording: Opening Payment dialog...')
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const payButton = buttons.find((b) => b.textContent?.includes('Bayar') || b.textContent?.includes('Checkout'))
      if (payButton) payButton.click()
    })
    await captureFrame(10, 120)

    console.log('Recording: Switching to Service Orders...')
    await page.goto(`${BASE_URL}/service-orders`, { waitUntil: 'networkidle2' })
    await captureFrame(12, 100)

    console.log('Recording: Switching to Sales Reports...')
    await page.goto(`${BASE_URL}/reports/sales`, { waitUntil: 'networkidle2' })
    await captureFrame(12, 100)

    console.log(`Captured ${frameCount} total frames. Running FFmpeg encoding...`)

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

    // Clean up frames
    rmSync(FRAMES_DIR, { recursive: true, force: true })
    console.log('Video recording completed successfully!')
  } catch (err) {
    console.error('Video recording failed:', err)
  } finally {
    await browser.close()
  }
}

run()
