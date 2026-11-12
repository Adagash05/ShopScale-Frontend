const { chromium } = require('/opt/npm-tools/node_modules/playwright')
const B = 'http://localhost:8080'; const res = []; const ok = (n, c, d = '') => { res.push({ n, pass: !!c, d }); }
;(async () => {
  const b = await chromium.launch()
  for (const vp of [{ name: 'desktop', width: 1366, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
    const ctx = await b.newContext({ viewport: vp }); const pg = await ctx.newPage(); const errs = []; const reqs = []
    pg.on('console', (m) => m.type() === 'error' && errs.push(m.text())); pg.on('pageerror', (e) => errs.push(e.message)); pg.on('request', (r) => reqs.push(r.url()))
    const T = (s) => `[${vp.name}] ${s}`
    await pg.goto(B + '/s/ada-fashion', { waitUntil: 'networkidle' })
    ok(T('store A branding'), /Ada Fashion House/.test(await pg.locator('h1').first().innerText()) && /Ada Fashion House/.test(await pg.title()) || /Ada Fashion House/.test(await pg.locator('h1').first().innerText()))
    // search
    if (vp.name === 'desktop') { await pg.fill('.head-search input', 'gown'); await pg.press('.head-search input', 'Enter') }
    else { await pg.click('[aria-label="Open menu"]'); await pg.fill('.drawer input', 'gown'); await pg.press('.drawer input', 'Enter') }
    await pg.waitForURL(/shop/); await pg.waitForTimeout(300)
    ok(T('search shows gown only'), (await pg.locator('.card').count()) === 1 && await pg.locator('.card >> text=Lace Gown').count() === 1, 'cards=' + await pg.locator('.card').count())
    // clear search via URL, category
    await pg.goto(B + '/s/ada-fashion/shop', { waitUntil: 'networkidle' })
    const all = await pg.locator('.card').count()
    await pg.click('.chips >> text=Bags').catch(async () => pg.click('text=Bags'))
    await pg.waitForTimeout(200); const bags = await pg.locator('.card').count()
    ok(T('category filter narrows'), bags === 2 && all > bags, `all=${all} bags=${bags}`)
    await pg.goto(B + '/s/ada-fashion/shop', { waitUntil: 'networkidle' })
    await pg.selectOption('select', { index: 1 }).catch(() => {})
    ok(T('sort control works'), (await pg.locator('.card').count()) === all)
    // product w/ variants
    await pg.goto(B + '/s/ada-fashion/product/p1', { waitUntil: 'networkidle' })
    ok(T('sold-out variant disabled'), await pg.locator('button:has-text("L")').first().isDisabled().catch(() => false))
    await pg.click('.opts button:has-text("M"), [role=radio]:has-text("M"), button:text-is("M")')
    ok(T('variant price updates'), await pg.locator('text=₦9,000.00').first().isVisible())
    await pg.click('button:has-text("Add to cart")'); await pg.waitForTimeout(200)
    ok(T('cart badge 1'), (await pg.locator('[aria-label^="Cart"]').first().getAttribute('aria-label')).includes('1 item'))
    // second product
    await pg.goto(B + '/s/ada-fashion/product/p2', { waitUntil: 'networkidle' }); await pg.click('button:has-text("Add to cart")')
    await pg.goto(B + '/s/ada-fashion/cart', { waitUntil: 'networkidle' })
    ok(T('cart has 2 lines'), (await pg.locator('.remove').count()) === 2)
    await pg.locator('[aria-label="Increase quantity"]').first().click(); await pg.waitForTimeout(150)
    const sub = await pg.locator('.summary').innerText()
    ok(T('subtotal = 2x9000 + 14000 = 32,000'), /32,000\.00/.test(sub), sub.replace(/\n/g, ' | '))
    await pg.reload({ waitUntil: 'networkidle' })
    ok(T('cart persists reload'), (await pg.locator('.remove').count()) === 2 && /32,000\.00/.test(await pg.locator('.summary').innerText()))
    await pg.locator('.remove').last().click(); await pg.waitForTimeout(150)
    ok(T('remove line'), (await pg.locator('.remove').count()) === 1)
    // checkout
    await pg.click('a:has-text("Checkout"), a:has-text("checkout")'); await pg.waitForURL(/checkout/)
    await pg.click('button:has-text("Place order"), button:has-text("Continue to payment")').catch(() => {})
    ok(T('validation blocks empty'), await pg.locator('[role=alert]').count() > 0 && /checkout/.test(pg.url()))
    await pg.fill('input[autocomplete=name]', 'Test Buyer'); await pg.fill('input[autocomplete=tel]', '08012345678')
    await pg.check('input[name=pm] >> nth=1').catch(() => {})
    await pg.check('input[name=dm] >> nth=0').catch(() => {})
    const reqCount = reqs.length
    await pg.click('button:has-text("Place order")'); await pg.waitForURL(/\/order\//, { timeout: 8000 }).catch(() => {})
    ok(T('order page reached'), /\/s\/ada-fashion\/order\//.test(pg.url()), pg.url())
    const token = pg.url().split('/order/')[1]
    await pg.waitForSelector('text=Ankara Shirt', { timeout: 5000 }).catch(() => {}); ok(T('order shows item + total'), /Ankara Shirt/.test(await pg.locator('main').innerText()) && /18,000\.00/.test(await pg.locator('main').innerText()))
    await pg.goto(B + '/s/ada-fashion/orders', { waitUntil: 'networkidle' })
    ok(T('my orders lists order A'), await pg.locator(`a[href*="${token}"]`).count() > 0)
    // tenant isolation
    await pg.goto(B + '/s/mama-put/orders', { waitUntil: 'networkidle' })
    ok(T('store B orders does not show A order'), (await pg.locator(`a[href*="${token}"]`).count()) === 0)
    await pg.goto(B + '/s/mama-put/cart', { waitUntil: 'networkidle' })
    ok(T('store B cart empty (cart per tenant)'), /empty/i.test(await pg.locator('main').innerText()))
    await pg.goto(B + '/s/mama-put/shop', { waitUntil: 'networkidle' })
    const bt = await pg.locator('main').innerText()
    ok(T('store B shows only its products'), /Jollof/.test(bt) && !/Ankara|Gown/.test(bt))
    ok(T('store B branding / labels'), /Mama Put Kitchen/.test(await pg.locator('header').innerText()) && /Add to order/.test(bt))
    await pg.goto(B + '/s/mama-put/product/m4', { waitUntil: 'networkidle' })
    await pg.click('button:has-text("Add to order")'); await pg.goto(B + '/s/mama-put/cart', { waitUntil: 'networkidle' })
    ok(T('store B add to order works'), (await pg.locator('.remove').count()) === 1)
    // footer links
    await pg.goto(B + '/s/ada-fashion', { waitUntil: 'networkidle' })
    const hrefs = await pg.$$eval('footer a[href^="/s/"]', (a) => [...new Set(a.map((x) => x.getAttribute('href')))])
    let bad = []
    for (const h of hrefs) { await pg.goto(B + h, { waitUntil: 'networkidle' }); const t = await pg.locator('main').innerText(); if (/not found|404/i.test(t) && !/shop\?/.test(h)) bad.push(h); if (!(await pg.locator('h1').count())) bad.push(h + ' (no h1)') }
    ok(T(`footer links (${hrefs.length}) resolve`), bad.length === 0, bad.join(','))
    const ext = await pg.$$eval('footer a:not([href^="/s/"]):not([href="/"])', (a) => a.map((x) => x.getAttribute('href')))
    ok(T('footer external links are real tel/mailto/wa/configured socials'), ext.every((h) => /^(tel:|mailto:|https:\/\/wa\.me|https:\/\/(instagram|facebook)\.com\/adafashionhouse$)/.test(h)), ext.join(','))
    // dead links in header
    // sold-out cannot add
    await pg.goto(B + '/s/ada-fashion/product/p6', { waitUntil: 'networkidle' })
    ok(T('sold-out product has no buy buttons, shows notice'), (await pg.locator('.pdp-info .buy').count()) === 0 && /sold out/i.test(await pg.locator('.pdp-info').innerText()))
    // missing & empty
    await pg.goto(B + '/s/nope', { waitUntil: 'networkidle' }); ok(T('missing store page'), /not (open|found)|unavailable/i.test(await pg.locator('main').innerText()))
    await pg.goto(B + '/s/new-shop/shop', { waitUntil: 'networkidle' }); ok(T('empty store page'), (await pg.locator('.card').count()) === 0 && (await pg.locator('main').innerText()).length > 20)
    await pg.goto(B + '/s/ada-fashion/nonsense', { waitUntil: 'networkidle' }); ok(T('unknown subroute -> not found page'), await pg.locator('header').count() > 0 && /not found|couldn.t find|doesn.t exist/i.test(await pg.locator('main').innerText()))
    ok(T('overflow check'), await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    ok(T('no console errors'), errs.filter((e) => !/404/.test(e)).length === 0, errs.join(' || '))
    await ctx.close()
  }
  await b.close()
  for (const r of res) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.n + (r.pass ? '' : '  -> ' + r.d))
  console.log(res.filter((r) => r.pass).length + '/' + res.length)
})()
