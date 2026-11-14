// Plain-Node tests for ShopScale Partners (routing, referral capture, calculator): `node --test scripts/partners-verify.mjs`
import test from 'node:test'
import assert from 'node:assert/strict'
import { sideOf, crossOrigin, safeNext } from '../src/config/domains.js'
import { codeFromSearch, capture, current, registrationFields, reportClick, visitorId, REF_KEY } from '../src/partners/referral.js'
import { estimate, paidPlans } from '../src/partners/calc.js'

const cfg = { siteUrl: 'https://shopscale.com.ng', appUrl: 'https://app.shopscale.com.ng' }
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m } }
const DAY = 86400000

test('/partners is public, everything under it and /admin belong to the app', () => {
  assert.equal(sideOf('/partners'), 'public')
  assert.equal(sideOf('/partners/'), 'public')
  assert.equal(sideOf('/partners?ref=x'), 'public')
  for (const p of ['/partners/apply', '/partners/login', '/partners/dashboard', '/partners/withdrawals', '/admin/partners', '/admin/partners/withdrawals']) assert.equal(sideOf(p), 'app', p)
})

test('public host keeps the landing page and forwards the portal to the app host', () => {
  assert.equal(crossOrigin('public', '/partners', cfg), null)
  assert.equal(crossOrigin('public', '/partners/apply', cfg), 'https://app.shopscale.com.ng/partners/apply')
  assert.equal(crossOrigin('public', '/admin/partners', cfg), 'https://app.shopscale.com.ng/admin/partners')
  assert.equal(crossOrigin('public', '/register?ref=ABCD2345', cfg), 'https://app.shopscale.com.ng/register?ref=ABCD2345')
})

test('app host forwards the landing page to the public host and serves the portal itself', () => {
  assert.equal(crossOrigin('app', '/partners', cfg), 'https://shopscale.com.ng/partners')
  assert.equal(crossOrigin('app', '/partners/dashboard', cfg), null)
  assert.equal(crossOrigin('app', '/admin/partners/withdrawals', cfg), null)
  assert.equal(crossOrigin('unified', '/partners', cfg), null)
})

test('partner and admin pages are valid post-login destinations; open redirects are not', () => {
  assert.equal(safeNext('/partners/dashboard'), '/partners/dashboard')
  assert.equal(safeNext('/admin/partners'), '/admin/partners')
  assert.equal(safeNext('//evil.example'), null)
  assert.equal(safeNext('https://evil.example/partners'), null)
})

test('referral codes are read strictly from ?ref=', () => {
  assert.equal(codeFromSearch('?ref=abcd2345'), 'ABCD2345')
  assert.equal(codeFromSearch('?utm=1&ref=ZZZZ9999&x=2'), 'ZZZZ9999')
  for (const bad of ['', '?ref=', '?ref=ab', '?ref=has space', '?ref=<script>', '?ref=' + 'A'.repeat(25), '?other=ABCD2345']) assert.equal(codeFromSearch(bad), null, bad)
})

test('last referral wins and is remembered for the window only', () => {
  const s = mem(); const t0 = 1_700_000_000_000
  assert.equal(capture('?ref=AAAA1111', { storage: s, now: t0 }).code, 'AAAA1111')
  assert.equal(capture('?ref=BBBB2222', { storage: s, now: t0 + DAY }).code, 'BBBB2222')
  assert.equal(current({ storage: s, now: t0 + 2 * DAY }).code, 'BBBB2222')
  assert.equal(current({ storage: s, now: t0 + DAY + 29 * DAY }).code, 'BBBB2222')
  assert.equal(current({ storage: s, now: t0 + DAY + 31 * DAY }), null)
  assert.equal(s.getItem(REF_KEY), null, 'an expired referral is dropped')
})

test('a page without ?ref= never overwrites a remembered referral', () => {
  const s = mem(); const t0 = Date.now()
  capture('?ref=AAAA1111', { storage: s, now: t0 })
  assert.equal(capture('?utm_source=x', { storage: s, now: t0 + 1000 }), null)
  assert.equal(current({ storage: s, now: t0 + 2000 }).code, 'AAAA1111')
})

test('register request carries the code and a stable visitor id, and nothing for ordinary sign-ups', () => {
  const s = mem(); const t0 = Date.now()
  assert.deepEqual(registrationFields({ storage: s, now: t0 }), {})
  capture('?ref=AAAA1111', { storage: s, now: t0 })
  const f = registrationFields({ storage: s, now: t0 + 5 })
  assert.equal(f.referralCode, 'AAAA1111'); assert.equal(f.visitorId, visitorId(s)); assert.ok(f.visitorId.length >= 8 && f.visitorId.length <= 64)
  assert.deepEqual(registrationFields({ storage: s, now: t0 + 31 * DAY }), {}, 'expired')
})

test('tampered storage is ignored', () => {
  const s = mem(); s.setItem(REF_KEY, '{"code":"<b>","at":1}'); assert.equal(current({ storage: s }), null)
  s.setItem(REF_KEY, 'not json'); assert.equal(current({ storage: s }), null)
  assert.equal(current({ storage: null }), null)
  assert.equal(capture('?ref=AAAA1111', { storage: null }).code, 'AAAA1111')
})

test('a click is reported once; a failure is retried next time', async () => {
  const s = mem(); const t0 = Date.now(); const calls = []
  capture('?ref=AAAA1111&utm_source=youtube', { storage: s, now: t0 })
  assert.equal(await reportClick(async () => { throw new Error('offline') }, { storage: s, now: t0 }), false)
  assert.equal(await reportClick(async (p, b) => { calls.push([p, b]) }, { storage: s, now: t0 }), true)
  assert.equal(await reportClick(async () => { calls.push('again') }, { storage: s, now: t0 }), false)
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], '/public/partners/click'); assert.equal(calls[0][1].code, 'AAAA1111'); assert.equal(calls[0][1].source, 'youtube')
  // opening the same link again does not re-report; a different partner's link does
  capture('?ref=AAAA1111', { storage: s, now: t0 + 1 }); assert.equal(current({ storage: s, now: t0 + 2 }).clicked, true)
  capture('?ref=CCCC3333', { storage: s, now: t0 + 3 }); assert.equal(current({ storage: s, now: t0 + 4 }).clicked, false)
})

test('calculator matches the directive examples and the real plan prices', () => {
  const prog = { commissionRate: 0.3, commissionMonths: 12 }
  const plan = (m, a) => ({ monthlyPrice: m, annualPrice: a })
  assert.equal(estimate({ plan: plan(4999, 49990), cycle: 'MONTHLY', customers: 1, programme: prog }).perPayment, 1499.7)
  assert.equal(estimate({ plan: plan(11999, 119990), cycle: 'MONTHLY', customers: 1, programme: prog }).perPayment, 3599.7)
  assert.equal(estimate({ plan: plan(19999, 199990), cycle: 'MONTHLY', customers: 1, programme: prog }).perPayment, 5999.7)
  const m = estimate({ plan: plan(4999, 49990), cycle: 'MONTHLY', customers: 10, programme: prog })
  assert.equal(m.perCustomer, 17996.4); assert.equal(m.total, 179964); assert.equal(m.payments, 12)
  const a = estimate({ plan: plan(4999, 49990), cycle: 'ANNUAL', customers: 2, programme: prog })
  assert.equal(a.perCustomer, 14997); assert.equal(a.total, 29994); assert.equal(a.payments, 1)
})

test('calculator follows admin-changed terms and never goes negative', () => {
  const plan = { monthlyPrice: 10000, annualPrice: 100000 }
  assert.equal(estimate({ plan, cycle: 'MONTHLY', customers: 1, programme: { commissionRate: 0.2, commissionMonths: 6 } }).perCustomer, 12000)
  assert.equal(estimate({ plan, cycle: 'ANNUAL', customers: 1, programme: { commissionRate: 0.2, commissionMonths: 6 } }).perCustomer, 10000, 'half of the year is inside a 6-month window')
  assert.equal(estimate({ plan, cycle: 'MONTHLY', customers: -5, programme: { commissionRate: 0.3, commissionMonths: 12 } }).total, 0)
  assert.equal(estimate({ plan: null, cycle: 'MONTHLY', customers: 3, programme: { commissionRate: 0.3, commissionMonths: 12 } }).total, 0)
  assert.equal(estimate({ plan, cycle: 'MONTHLY', customers: 3, programme: { commissionRate: 0, commissionMonths: 12 } }).total, 0)
})

test('only paid plans are offered in the calculator', () => {
  const plans = [{ code: 'FREE', monthlyPrice: 0, annualPrice: 0 }, { code: 'ESSENTIAL', monthlyPrice: 4999, annualPrice: 49990 }]
  assert.deepEqual(paidPlans(plans).map((p) => p.code), ['ESSENTIAL'])
  assert.deepEqual(paidPlans(null), [])
})
