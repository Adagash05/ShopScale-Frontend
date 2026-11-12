// Plain-Node tests for the domain rules: `node --test scripts/domain-verify.mjs`
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_PREFIXES, PUBLIC_PREFIXES, detectMode, sideOf, crossOrigin, safeNext } from '../src/config/domains.js'
import { checkEnv } from './check-env.mjs'

const cfg = { siteUrl: 'https://shopscale.com.ng', appUrl: 'https://app.shopscale.com.ng' }

test('hostname decides the mode', () => {
  assert.equal(detectMode('shopscale.com.ng', cfg), 'public')
  assert.equal(detectMode('www.shopscale.com.ng', cfg), 'public')
  assert.equal(detectMode('app.shopscale.com.ng', cfg), 'app')
  assert.equal(detectMode('localhost', cfg), 'unified')
  assert.equal(detectMode('shopscale.pages.dev', cfg), 'unified')
  assert.equal(detectMode('localhost', {}), 'unified')
  assert.equal(detectMode('whatever', { ...cfg, override: 'app' }), 'app')
})

test('app and public path sets are disjoint (no redirect loops)', () => {
  for (const a of APP_PREFIXES) assert.ok(!PUBLIC_PREFIXES.includes(a), a)
  assert.ok(!APP_PREFIXES.includes('s') && !PUBLIC_PREFIXES.includes('s'))
})

test('every module route and registered page lives in a known section', () => {
  for (const dir of fs.readdirSync(new URL('../src/modules', import.meta.url))) {
    const f = new URL(`../src/modules/${dir}/index.js`, import.meta.url)
    if (!fs.existsSync(f)) continue
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/path:\s*'([^']+)'/g)) assert.equal(sideOf('/' + m[1]), 'app', m[1])
  }
  const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  for (const m of app.matchAll(/<Route path="\/?([a-z-]+)[/"]/g)) {
    const side = sideOf('/' + m[1]); assert.notEqual(side, 'unknown', m[1])
  }
})

test('public host sends app paths to the app host and keeps query + hash', () => {
  assert.equal(crossOrigin('public', '/login', cfg), 'https://app.shopscale.com.ng/login')
  assert.equal(crossOrigin('public', '/more/sales?x=1#top', cfg), 'https://app.shopscale.com.ng/more/sales?x=1#top')
  assert.equal(crossOrigin('public', '/reset-password?token=abc', cfg), 'https://app.shopscale.com.ng/reset-password?token=abc')
  for (const p of ['/', '/features', '/retail', '/restaurant', '/catering', '/pricing', '/about', '/contact', '/faq', '/privacy', '/terms', '/refunds', '/s/my-shop', '/s/my-shop/order/tok', '/nope'])
    assert.equal(crossOrigin('public', p, cfg), null, p)
})

test('app host sends marketing and storefront paths to the public host, never "/" or app paths', () => {
  assert.equal(crossOrigin('app', '/pricing', cfg), 'https://shopscale.com.ng/pricing')
  assert.equal(crossOrigin('app', '/s/my-shop/order/tok?pay=1', cfg), 'https://shopscale.com.ng/s/my-shop/order/tok?pay=1')
  for (const p of ['/', '/login', '/register', '/dashboard', '/sell', '/products/new', '/more/plan', '/onboarding', '/accept-invite?token=x', '/nope'])
    assert.equal(crossOrigin('app', p, cfg), null, p)
})

test('no host redirect can bounce back', () => {
  const all = ['/', ...APP_PREFIXES.map((p) => '/' + p), ...PUBLIC_PREFIXES.map((p) => '/' + p), '/s/a', '/s/a/order/b', '/zzz']
  const asHost = (u) => (u.startsWith(cfg.appUrl) ? 'app' : 'public')
  for (const p of all) for (const mode of ['public', 'app']) {
    const u = crossOrigin(mode, p, cfg)
    if (!u) continue
    const next = crossOrigin(asHost(u), u.replace(/^https:\/\/[^/]+/, ''), cfg)
    assert.equal(next, null, `${mode} ${p}`)
  }
})

test('unified mode never redirects', () => {
  for (const p of ['/', '/login', '/pricing', '/s/a']) assert.equal(crossOrigin('unified', p, cfg), null)
})

test('post-login destination must be a same-origin app path', () => {
  assert.equal(safeNext('/more/sales?range=week'), '/more/sales?range=week')
  assert.equal(safeNext('/dashboard'), '/dashboard')
  for (const bad of ['//evil.com', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', '/login', '/register', '/pricing', '/s/x', '', null, undefined, 5])
    assert.equal(safeNext(bad), null, String(bad))
})

test('production build config guard', () => {
  assert.deepEqual(checkEnv({ VITE_API_BASE_URL: 'https://api.shopscale.com.ng', VITE_PUBLIC_SITE_URL: 'https://shopscale.com.ng', VITE_APP_URL: 'https://app.shopscale.com.ng' }, 'production'), [])
  assert.equal(checkEnv({}, 'production').length, 3)
  assert.ok(checkEnv({ VITE_API_BASE_URL: 'http://localhost:8080', VITE_SITE_MODE: 'unified' }, 'production').length === 1)
  assert.deepEqual(checkEnv({ VITE_API_BASE_URL: 'https://api.x.com', VITE_SITE_MODE: 'unified' }, 'production'), [])
  assert.deepEqual(checkEnv({}, 'development'), [])
  assert.ok(checkEnv({ VITE_API_BASE_URL: 'https://a.b', VITE_SITE_MODE: 'unified', VITE_PAYSTACK_SECRET: 'x' }, 'production').length === 1)
})
