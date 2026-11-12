import test from 'node:test'
import assert from 'node:assert/strict'

function env(id, { dnt = false, consent } = {}) {
  const store = new Map(consent ? [['shopscale.analytics.consent', consent]] : [])
  const scripts = []
  globalThis.window = { dataLayer: undefined }
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) }
  Object.defineProperty(globalThis, 'navigator', { value: { doNotTrack: dnt ? '1' : '0' }, configurable: true })
  globalThis.document = { createElement: () => ({}), head: { appendChild: (s) => scripts.push(s.src) } }
  return { store, scripts }
}
async function fresh(id) {
  // The module reads import.meta.env at import time; give each case its own copy.
  const src = (await import('node:fs')).readFileSync(new URL('../src/analytics/analytics.js', import.meta.url), 'utf8')
  const patched = src.replace("import.meta.env?.VITE_GA_MEASUREMENT_ID", JSON.stringify(id))
  const url = 'data:text/javascript;base64,' + Buffer.from(patched).toString('base64') + '#' + Math.random()
  return import(url)
}
const events = () => (window.dataLayer || []).filter((a) => a[0] === 'event').map((a) => [a[1], a[2]])

test('no measurement id: everything is a silent no-op', async () => {
  const e = env()
  const ga = await fresh('')
  ga.initAnalytics(); ga.setConsent('granted')
  assert.equal(ga.track('login'), false); assert.equal(ga.pageView('/x'), false)
  assert.equal(ga.analyticsConfigured(), false); assert.equal(e.scripts.length, 0); assert.equal(window.dataLayer, undefined)
})
test('invalid id is treated as absent', async () => { env(); const ga = await fresh('abc'); assert.equal(ga.analyticsConfigured(), false) })
test('nothing loads or sends before consent', async () => {
  const e = env(); const ga = await fresh('G-TEST12345')
  ga.initAnalytics(); assert.equal(ga.getConsent(), null)
  assert.equal(ga.track('login'), false); assert.equal(ga.pageView('/dashboard'), false)
  assert.equal(e.scripts.length, 0); assert.equal(window.dataLayer, undefined)
})
test('declining keeps the tag off', async () => {
  const e = env(); const ga = await fresh('G-TEST12345')
  ga.setConsent('denied'); assert.equal(ga.track('login'), false); assert.equal(e.scripts.length, 0)
})
test('Do Not Track counts as no', async () => { env('', { dnt: true }); const ga = await fresh('G-TEST12345'); assert.equal(ga.getConsent(), 'denied') })
test('after consent the official gtag script loads once and events flow', async () => {
  const e = env(); const ga = await fresh('G-TEST12345')
  ga.setConsent('granted'); ga.setConsent('granted')
  assert.deepEqual(e.scripts, ['https://www.googletagmanager.com/gtag/js?id=G-TEST12345'])
  assert.equal(ga.track('login', { method: 'email' }), true)
  assert.deepEqual(events().at(-1), ['login', { method: 'email' }])
  const cfg = window.dataLayer.find((a) => a[0] === 'config'); assert.equal(cfg[2].send_page_view, false)
})
test('consent remembered from an earlier visit loads the tag at start-up', async () => {
  const e = env('', { consent: 'granted' }); const ga = await fresh('G-TEST12345'); ga.initAnalytics(); assert.equal(e.scripts.length, 1)
})
test('page views: once per change, ids/queries stripped, storefront never', async () => {
  env(); const ga = await fresh('G-TEST12345'); ga.setConsent('granted')
  assert.equal(ga.pageView('/products/6f1c2a3e-1111-2222-3333-444455556666/edit?x=1'), true)
  assert.equal(ga.pageView('/products/6f1c2a3e-1111-2222-3333-444455556666/edit'), false)   // re-render
  assert.equal(events().at(-1)[1].page_path, '/products/:id/edit')
  assert.equal(ga.pageView('/s/my-shop'), false); assert.equal(ga.pageView('/s/my-shop/order/abcdef'), false)
  assert.equal(ga.pageView('/more/plan'), true)
})
test('identical events inside the window are dropped (StrictMode / re-render)', async () => {
  env(); const ga = await fresh('G-TEST12345'); ga.setConsent('granted')
  assert.equal(ga.track('view_pricing', { source: 'app' }), true); assert.equal(ga.track('view_pricing', { source: 'app' }), false)
})
test('purchase is sent once per transaction, even across reloads', async () => {
  const e = env(); let ga = await fresh('G-TEST12345'); ga.setConsent('granted')
  const p = { transaction_id: 'SSB-1', currency: 'NGN', value: 11999 }
  assert.equal(ga.trackOnce('purchase:SSB-1', 'purchase', p), true)
  assert.equal(ga.trackOnce('purchase:SSB-1', 'purchase', p), false)
  ga = await fresh('G-TEST12345'); ga.initAnalytics()      // simulated reload, same storage
  assert.equal(ga.trackOnce('purchase:SSB-1', 'purchase', p), false)
  assert.equal(events().filter((x) => x[0] === 'purchase').length, 1)
})
test('PII and unknown fields never reach GA', async () => {
  env(); const ga = await fresh('G-TEST12345'); ga.setConsent('granted')
  ga.track('sale_complete', { item_count: 2, email: 'a@b.com', customerName: 'Ada', phone: '08012345678', method: 'ada@example.com', source: '08012345678', item_name: 'ok',
    items: [{ item_id: 'P', price: 5, customer: 'x', note: 'secret' }] })
  const sent = events().at(-1)[1]
  assert.deepEqual(sent, { item_count: 2, item_name: 'ok', items: [{ item_id: 'P', price: 5 }] })
})
test('a failing gtag never throws into the app', async () => {
  env(); const ga = await fresh('G-TEST12345'); ga.setConsent('granted'); window.gtag = () => { throw new Error('boom') }
  assert.doesNotThrow(() => ga.track('login')); assert.equal(ga.track('login2'), false)
})
