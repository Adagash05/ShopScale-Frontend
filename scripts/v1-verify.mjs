// V1 scope checks that need no browser: node scripts/v1-verify.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { isHiddenRoute, HIDDEN_ROUTES } from '../src/config/scope.js'
import { SECTIONS, v1Nav, sectionTabs, sectionFor } from '../src/config/sections.js'

const all = { can: () => true, hasFeature: () => true }
const cashier = new Set(['PRODUCTS_VIEW', 'SALES_CREATE', 'CUSTOMERS_VIEW'])

test('the eight V1 sections are in the approved order', () => {
  assert.deepEqual(SECTIONS.map((s) => s.label), ['Home', 'Sales', 'Products & Stock', 'Money', 'Customers & Suppliers', 'Online Store', 'Reports', 'Settings'])
})
test('owner sees all eight sections', () => { assert.equal(v1Nav(all).length, 8) })
test('a cashier never sees Home, Money, Online Store or Reports (Settings stays for Notifications and Help)', () => {
  const nav = v1Nav({ can: (p) => cashier.has(p), hasFeature: () => true }).map((n) => n.label)
  assert.deepEqual(nav, ['Sales', 'Products & Stock', 'Customers & Suppliers', 'Settings'])
  const tabs = sectionTabs(SECTIONS.find((s) => s.id === 'settings'), { can: (p) => cashier.has(p), hasFeature: () => true }).map((t) => t.label)
  assert.deepEqual(tabs, ['Notifications', 'Help'])
})
test('kitchen-only staff see nothing but Settings (Notifications, Help)', () => { assert.deepEqual(v1Nav({ can: (p) => p === 'KITCHEN_VIEW', hasFeature: () => true }).map((n) => n.label), ['Settings']) })
test('plan features hide tabs', () => {
  const store = SECTIONS.find((s) => s.id === 'store')
  const tabs = sectionTabs(store, { can: () => true, hasFeature: (f) => f !== 'STOREFRONT' }).map((t) => t.label)
  assert.deepEqual(tabs, ['Store settings'])
})
test('hidden routes are hidden, and their children', () => {
  for (const r of ['/kitchen', '/events/5', '/more/branches', '/orders']) assert.ok(isHiddenRoute(r, true), r)
  for (const r of ['/sell', '/products', '/more/store', '/more/sales', '/customers/1']) assert.ok(!isHiddenRoute(r, true), r)
})
test('invoices are reachable from Sales for people who may view them, and hidden from those who may not', () => {
  const sales = SECTIONS.find((s) => s.id === 'sales')
  assert.ok(sectionTabs(sales, { can: () => true, hasFeature: () => true }).some((t) => t.to === '/more/invoices'))
  assert.ok(!sectionTabs(sales, { can: (p) => p !== 'CUSTOMER_INVOICES_VIEW', hasFeature: () => true }).some((t) => t.to === '/more/invoices'))
  assert.ok(!isHiddenRoute('/more/invoices/new', true))
})
test('switching the scope off restores every route', () => { for (const r of HIDDEN_ROUTES) assert.ok(!isHiddenRoute('/' + r, false)) })
test('no V1 section links to a hidden route', () => {
  for (const s of SECTIONS) for (const t of s.tabs) assert.ok(!isHiddenRoute(t.to, true), t.to)
})
test('sectionFor maps detail pages to their section', () => {
  assert.equal(sectionFor('/customers/abc').id, 'people'); assert.equal(sectionFor('/more/stock').id, 'products'); assert.equal(sectionFor('/nowhere'), null)
})
