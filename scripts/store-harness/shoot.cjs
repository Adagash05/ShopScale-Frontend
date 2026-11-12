const { chromium } = require('/opt/npm-tools/node_modules/playwright')
const sizes = { mobile: { width: 390, height: 844 }, tablet: { width: 820, height: 1100 }, desktop: { width: 1366, height: 900 } }
const pages = [
  ['retail-home', '/s/ada-fashion'], ['retail-shop', '/s/ada-fashion/shop'], ['retail-product', '/s/ada-fashion/product/p1'], ['retail-cart', '/s/ada-fashion/cart'],
  ['retail-about', '/s/ada-fashion/about'], ['rest-home', '/s/mama-put'], ['rest-shop', '/s/mama-put/shop'], ['empty-home', '/s/new-shop'], ['empty-shop', '/s/new-shop/shop'], ['missing', '/s/nope'],
]
;(async () => {
  const b = await chromium.launch(); const out = []
  for (const [sz, vp] of Object.entries(sizes)) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }); const pg = await ctx.newPage()
    const errors = []; const failed = []
    pg.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) }); pg.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message)); pg.on('requestfailed', (r) => failed.push(r.url()))
    pg.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/s/nope') && !r.url().includes('store/nope')) failed.push(r.status() + ' ' + r.url()) })
    for (const [name, path] of pages) {
      await pg.goto('http://localhost:8080' + path, { waitUntil: 'networkidle' }); await pg.waitForTimeout(250)
      const m = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, imgs: [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).length }))
      out.push({ sz, name, overflow: m.sw > m.iw, brokenImgs: m.imgs })
      if (sz !== 'tablet' || name === 'retail-home') await pg.screenshot({ path: `shots/${sz}-${name}.png`, fullPage: true })
    }
    out.push({ sz, consoleErrors: errors.filter((e) => !/404/.test(e)), failed: failed.filter((f) => !/nope/.test(f)) })
    await ctx.close()
  }
  await b.close(); console.log(JSON.stringify(out, null, 1))
})()
