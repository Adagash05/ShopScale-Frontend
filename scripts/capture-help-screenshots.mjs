// Captures the Help Centre screenshots from the REAL, RUNNING ShopScale app, signed in to the fictional demo businesses made by
// scripts/demo/seed-demo.mjs. What to capture comes from src/help/shots.js, the same file the Help Centre reads, so a picture
// and the article that shows it can never disagree. It never draws or edits an image: if a page does not load, that shot is
// skipped and reported, and no file is written for it.
//
//   node scripts/capture-help-screenshots.mjs                 capture everything
//   node scripts/capture-help-screenshots.mjs --only=dashboard,product-form
//   node scripts/capture-help-screenshots.mjs --list          show what would be captured
//   node scripts/capture-help-screenshots.mjs --headed        watch the browser while it works
//
// Environment: APP_URL (default http://localhost:5173), DEMO_PASSWORD. Refuses to run against a non-local app.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SHOTS } from '../src/help/shots.js'
import { isHiddenRoute } from '../src/config/scope.js'
import { ACCOUNTS, APP_URL, DEMO_PASSWORD } from './demo/demo-config.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(here, '../public/help/shots')
const argv = process.argv.slice(2)
const only = (argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean)
const list = argv.includes('--list'), headed = argv.includes('--headed')
const VIEWPORTS = { desktop: { width: 960, height: 720 }, mobile: { width: 420, height: 860 } }

const host = new URL(APP_URL).hostname
if (!['localhost', '127.0.0.1', '[::1]'].includes(host) && process.env.DEMO_ALLOW_REMOTE !== '1') { console.error(`Refusing to capture from ${host}: screenshots must come from your LOCAL app with demo data.`); process.exit(2) }
if (/shopscale\.com\.ng$/i.test(host)) { console.error('Refusing to capture from a real ShopScale host.'); process.exit(2) }

// The V1 product hides the restaurant, bakery, catering, branch and transfer screens, so they are not captured unless --include-hidden is given.
const includeHidden = argv.includes('--include-hidden')
const firstGoto = (s) => (s.steps.find((x) => x.goto) || {}).goto || ''
const inV1 = (s) => includeHidden || (!['restaurant', 'bakery', 'catering'].includes(s.account) && !isHiddenRoute(firstGoto(s).replace('{slug}', '')))
const chosen = SHOTS.filter((s) => inV1(s) && (!only.length || only.includes(s.id)))
if (list) { for (const s of chosen) console.log(`${s.id.padEnd(24)} ${(s.account || 'public').padEnd(10)} ${(s.viewport || 'desktop').padEnd(8)} ${s.steps.map((x) => Object.keys(x)[0] + ':' + Object.values(x)[0]).join(' > ')}`); process.exit(0) }

let chromium
try { ({ chromium } = await import('playwright')) } catch { console.error('Playwright is not installed. Run: npm i -D playwright  and then  npx playwright install chromium'); process.exit(2) }
fs.mkdirSync(OUT, { recursive: true })

const done = [], skipped = [], warnings = []
const slug = (p) => p.replace('{slug}', ACCOUNTS.retail.slug)

async function run(page, steps) {
  for (const st of steps) {
    if (st.goto) { await page.goto(APP_URL + slug(st.goto), { waitUntil: 'domcontentloaded' }); await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {}) }
    else if (st.waitText) await page.getByText(st.waitText, { exact: false }).first().waitFor({ timeout: 15000 })
    else if (st.click) { await page.getByText(st.click, { exact: false }).first().click({ timeout: 8000 }); await page.waitForTimeout(400) }
    else if (st.clickCss) { await page.locator(st.clickCss).first().click({ timeout: 8000 }); await page.waitForTimeout(400) }
    else if (st.fill) await page.locator(st.fill).first().fill(st.value, { timeout: 8000 })
    else if (st.scroll) { await page.getByText(st.scroll, { exact: false }).first().scrollIntoViewIfNeeded({ timeout: 8000 }); await page.waitForTimeout(300) }
    else if (st.wait) await page.waitForTimeout(st.wait)
  }
}

async function signIn(page, acc) {
  await page.goto(APP_URL + '/login', { waitUntil: 'domcontentloaded' })
  await page.fill('#email', acc.email); await page.fill('#password', DEMO_PASSWORD)
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }), page.click('button.primary')])
}

const browser = await chromium.launch({ headless: !headed })
try {
  const keyOf = (s) => `${s.account || 'public'}|${s.viewport || 'desktop'}`
  const groups = [...new Set(chosen.map(keyOf))]
  for (const g of groups) {
    const [acct, vp] = g.split('|')
    const members = chosen.filter((x) => keyOf(x) === g)
    const ctx = await browser.newContext({ viewport: VIEWPORTS[vp], deviceScaleFactor: 2, locale: 'en-NG', timezoneId: 'Africa/Lagos' })
    const page = await ctx.newPage()
    try { if (acct !== 'public') await signIn(page, ACCOUNTS[acct]) } catch (e) {
      for (const s of members) skipped.push(`${s.id} (could not sign in as ${ACCOUNTS[acct].email}: run the seed first. ${e.message.split('\n')[0]})`)
      await ctx.close(); continue
    }
    for (const s of members) {
      try {
        await run(page, s.steps)
        if (acct !== 'public' && new URL(page.url()).pathname.startsWith('/login')) throw new Error('the session ended and the app asked to sign in')
        const file = path.join(OUT, s.id + '.png'), sidecar = path.join(OUT, s.id + '.json')
        let box = null
        if (s.highlight) {
          const loc = s.highlight.css ? page.locator(s.highlight.css).first() : page.getByText(s.highlight.text, { exact: false }).first()
          await loc.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {})
          const b = await loc.boundingBox().catch(() => null)
          const v = page.viewportSize()
          if (b && b.width > 4 && b.height > 4) box = { x: Math.max(0, b.x - 4), y: Math.max(0, b.y - 4), w: Math.min(v.width, b.width + 8), h: b.height + 8 }
          else warnings.push(`${s.id}: could not find the highlight target ${JSON.stringify(s.highlight)}; saved without an outline`)
        }
        await page.screenshot({ path: file })
        if (box) fs.writeFileSync(sidecar, JSON.stringify({ vw: page.viewportSize().width, vh: page.viewportSize().height, box }))
        else fs.rmSync(sidecar, { force: true })
        done.push(s.id)
      } catch (e) { skipped.push(`${s.id} (${e.message.split('\n')[0]})`) }
    }
    await ctx.close()
  }
} finally { await browser.close() }
console.log(`\nCaptured ${done.length}: ${done.join(', ') || 'none'}`)
if (skipped.length) console.log(`\nNOT captured (${skipped.length}). No file was written for these:\n - ${skipped.join('\n - ')}`)
if (warnings.length) console.log(`\nWarnings (${warnings.length}):\n - ${warnings.join('\n - ')}`)
console.log('\nNext: node scripts/verify-help-screenshots.mjs, then LOOK at every picture before you commit it.')
process.exit(skipped.length ? 1 : 0)
