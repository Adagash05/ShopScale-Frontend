// Captures the real Help Centre screenshots from a RUNNING ShopScale app that holds the fictional demo data in docs/HELP_SCREENSHOTS.md.
// It never invents an image: if a page fails to load or a sign-in fails, that shot is skipped and reported.
//
//   BASE_URL=http://localhost:5173 SHOT_EMAIL=owner@example.com SHOT_PASSWORD=... node scripts/capture-help-screenshots.mjs [id ...]
//
// Needs Playwright (`npm i -D playwright && npx playwright install chromium`). Output: public/help/shots/<id>.png
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(here, '../public/help/shots')
const BASE = process.env.BASE_URL || 'http://localhost:5173'
const EMAIL = process.env.SHOT_EMAIL, PASSWORD = process.env.SHOT_PASSWORD

/** id → the app page to open. A shot only exists when the real page renders. `wait` is text that proves the page loaded. */
const SHOTS = {
  'product-form': { path: '/products/new', wait: 'Add product' },
  'store-settings': { path: '/more/store', wait: 'Online store' },
  'online-orders': { path: '/more/store-orders', wait: 'Online orders' },
  'order-detail': { path: '/more/store-orders', wait: 'Online orders', click: 'Confirm order|New', open: true },
  'sell-screen': { path: '/sell', wait: 'Sell' },
  'menu-items': { path: '/more/menu', wait: 'Menu', account: 'restaurant' },
  'restaurant-orders': { path: '/orders', wait: 'Orders', account: 'restaurant' },
  'catering-event-form': { path: '/events/new', wait: 'event', account: 'catering' },
}

if (!EMAIL || !PASSWORD) { console.error('Set SHOT_EMAIL and SHOT_PASSWORD for a demo account. Nothing was captured.'); process.exit(2) }
let chromium
try { ({ chromium } = await import('playwright')) } catch { console.error('Playwright is not installed. Nothing was captured.'); process.exit(2) }

const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SHOTS)
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 420, height: 860 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const done = [], skipped = []
try {
  await page.goto(BASE + '/login'); await page.fill('#email', EMAIL); await page.fill('#password', PASSWORD)
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }), page.click('button.primary')])
  for (const id of want) {
    const s = SHOTS[id]; if (!s) { skipped.push(id + ' (unknown id)'); continue }
    try {
      await page.goto(BASE + s.path); await page.getByText(s.wait, { exact: false }).first().waitFor({ timeout: 15000 })
      if (s.open) { const row = page.locator('main button, main a, main li').filter({ hasText: /#|₦/ }).first(); await row.click({ timeout: 5000 }) }
      await page.waitForTimeout(600)
      await page.screenshot({ path: path.join(out, id + '.png') }); done.push(id)
    } catch (e) { skipped.push(`${id} (${e.message.split('\n')[0]})`) }
  }
} finally { await browser.close() }
console.log('Captured:', done.join(', ') || 'none'); if (skipped.length) console.log('Skipped, not captured:', skipped.join('; '))
