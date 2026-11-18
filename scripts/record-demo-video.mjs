// Records the one-minute demonstration video: a REAL screen recording of your running local ShopScale, signed in to the fictional
// demo business Aminu Stores (seed it first). Nothing is animated or mocked. The only addition is a short text label shown at the
// top of the screen to say what is being demonstrated.
//
//   node scripts/record-demo-video.mjs
// Output: public/demo/shopscale-demo.webm (plays in every modern browser, so it is what the site uses). Optional MP4 for sharing:
//   ffmpeg -i public/demo/shopscale-demo.webm -c:v libx264 -pix_fmt yuv420p public/demo/shopscale-demo.mp4
// Environment: APP_URL (default http://localhost:5173), DEMO_PASSWORD. Refuses to run against a non-local app.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ACCOUNTS, APP_URL, DEMO_PASSWORD } from './demo/demo-config.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(here, '../public/demo')
const host = new URL(APP_URL).hostname
if (!['localhost', '127.0.0.1', '[::1]'].includes(host) && process.env.DEMO_ALLOW_REMOTE !== '1') { console.error(`Refusing to record from ${host}: use your LOCAL app with demo data.`); process.exit(2) }
if (/shopscale\.com\.ng$/i.test(host)) { console.error('Refusing to record from a real ShopScale host.'); process.exit(2) }
let chromium
try { ({ chromium } = await import('playwright')) } catch { console.error('Playwright is not installed. Run: npm i -D playwright  and then  npx playwright install chromium'); process.exit(2) }

const acc = ACCOUNTS.retail
const tmp = fs.mkdtempSync(path.join(OUT_DIR, '.rec-'))
fs.mkdirSync(OUT_DIR, { recursive: true })
const size = { width: 420, height: 860 }
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: size, recordVideo: { dir: tmp, size }, locale: 'en-NG', timezoneId: 'Africa/Lagos' })
const page = await ctx.newPage()

const label = (text) => page.evaluate((t) => {
  let el = document.getElementById('__demo_label')
  if (!el) { el = document.createElement('div'); el.id = '__demo_label'; el.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:99999;background:rgba(15,23,42,.92);color:#fff;font:600 14px system-ui;padding:8px 14px;border-radius:999px;max-width:92vw;text-align:center;pointer-events:none'; document.body.appendChild(el) }
  el.textContent = t
}, text)
const scene = async (text, fn, hold = 4000) => { await label(text); await fn?.(); await page.waitForTimeout(hold) }
const go = async (p) => { await page.goto(APP_URL + p, { waitUntil: 'domcontentloaded' }); await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {}) }
const tap = (text) => page.getByText(text, { exact: false }).first().click({ timeout: 8000 })

let failed = null
try {
  await go('/login')
  await scene('Sign in to your business', async () => { await page.fill('#email', acc.email); await page.waitForTimeout(500); await page.fill('#password', DEMO_PASSWORD) }, 2500)
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }), page.click('button.primary')])
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  await scene('Your dashboard shows how the business is doing', null, 6000)
  await go('/products'); await scene('Products and stock, all in one place', null, 5000)
  await go('/sell'); await scene('Sell in person: tap products to add them', async () => { await tap('Mama Gold Rice 50kg'); await page.waitForTimeout(900); await tap('Peak Milk Tin 400g'); await page.waitForTimeout(900); await tap('Sugar 1kg') }, 5500)
  await go('/more/store'); await scene('Open your online store with one switch', null, 5000)
  await go('/s/' + acc.slug); await scene('Customers browse and order from your store link', async () => { await tap('Add to cart'); await page.waitForTimeout(900); await tap('Add to cart'); await page.waitForTimeout(900); await tap('View cart') }, 7000)
  await go('/more/store-orders'); await scene('Orders arrive in ShopScale', null, 4500)
  await scene('Open an order, confirm it and complete it', async () => { await page.locator('main .list-item').first().click({ timeout: 8000 }) }, 5500)
  await go('/more/money'); await scene('Know where your money is', null, 5000)
  await go('/dashboard'); await scene('ShopScale: run your whole business in one place', null, 4000)
} catch (e) { failed = e }
const video = page.video()
await ctx.close(); await browser.close()
const rec = await video.path()
if (failed) { console.error('Recording stopped early: ' + failed.message.split('\n')[0] + '\nNo video was saved. Fix the cause (is the demo data seeded and the app running?) and run again.'); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(1) }
fs.copyFileSync(rec, path.join(OUT_DIR, 'shopscale-demo.webm'))
fs.rmSync(tmp, { recursive: true, force: true })
console.log('Saved public/demo/shopscale-demo.webm. WATCH IT before you publish it: it must show only demo data and be about a minute long.')
