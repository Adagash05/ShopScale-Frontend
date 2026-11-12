// Run: node --test scripts/store-verify.mjs   (logic of the storefront; no browser needed)
import test from 'node:test'
import assert from 'node:assert/strict'
import * as P from '../src/store/presentation.js'

const item = (o) => ({ variantId: o.v, productId: o.p, name: o.n, label: o.l || null, description: '', price: o.price, inStock: o.stock !== false, available: o.av ?? 10, allowDecimal: false, imageUrl: o.img || null, categoryId: o.c || null, categoryName: o.cn || null, createdAt: o.at || null })
const items = [
  item({ v: 'a1', p: 'A', n: 'Ankara shirt', l: 'M', price: '9000', c: 'c1', cn: 'Men', at: '2026-01-02T00:00:00Z', img: '/i/1' }),
  item({ v: 'a2', p: 'A', n: 'Ankara shirt', l: 'S', price: '8500', c: 'c1', cn: 'Men', at: '2026-01-02T00:00:00Z', img: '/i/1' }),
  item({ v: 'b1', p: 'B', n: 'Leather bag', price: '25000', c: 'c2', cn: 'Bags', at: '2026-03-01T00:00:00Z' }),
  item({ v: 'c1', p: 'C', n: 'Sold out cap', price: '3000', stock: false, at: '2026-02-01T00:00:00Z' }),
]

test('variants collapse into one product with a price range, cheapest first', () => {
  const g = P.groupProducts(items)
  assert.equal(g.length, 3)
  const a = g.find((p) => p.id === 'A')
  assert.deepEqual(a.variants.map((v) => v.variantId), ['a2', 'a1'])
  assert.equal(a.minPrice, 8500); assert.equal(a.maxPrice, 9000); assert.equal(a.single, false)
  assert.equal(g.find((p) => p.id === 'C').inStock, false)
})

test('categories come only from the data and carry an image from a product in them', () => {
  const c = P.categoriesOf(P.groupProducts(items))
  assert.deepEqual(c.map((x) => x.name), ['Bags', 'Men'])
  assert.equal(c.find((x) => x.name === 'Men').imageUrl, '/i/1')
  assert.equal(c.find((x) => x.name === 'Bags').imageUrl, null)
})

test('search and category filters', () => {
  const g = P.groupProducts(items)
  assert.deepEqual(P.filterProducts(g, { q: 'leath' }).map((p) => p.id), ['B'])
  assert.deepEqual(P.filterProducts(g, { category: 'c1' }).map((p) => p.id), ['A'])
  assert.deepEqual(P.filterProducts(g, { q: 'zzz' }), [])
  assert.equal(P.filterProducts(g, { inStockOnly: true }).length, 2)
})

test('sorting', () => {
  const g = P.groupProducts(items)
  assert.deepEqual(P.sortProducts(g, 'low').map((p) => p.id), ['C', 'A', 'B'])
  assert.deepEqual(P.sortProducts(g, 'high').map((p) => p.id), ['B', 'A', 'C'])
  assert.deepEqual(P.sortProducts(g, 'new').map((p) => p.id), ['B', 'C', 'A'])
  assert.equal(P.sortProducts(g, 'featured').at(-1).id, 'C')   // sold out last
})

test('cart lines: quantities are capped, vanished or sold-out items are reported, totals are summed', () => {
  const byId = Object.fromEntries(items.map((i) => [i.variantId, i]))
  const r = P.cartLines({ a1: 3, b1: 99, c1: 1, gone: 2 }, byId)
  assert.equal(r.missing, 2)
  assert.equal(r.lines.find((l) => l.id === 'b1').qty, 10)
  assert.equal(r.subtotal, 3 * 9000 + 10 * 25000)
  assert.equal(r.count, 13)
})

test('quantity limits keep the original rules', () => {
  assert.equal(P.maxQty({ allowDecimal: true, available: 2 }), Infinity)
  assert.equal(P.maxQty({ allowDecimal: false, available: 4.9 }), 4)
  assert.equal(P.maxQty({ allowDecimal: false, available: 0 }), Infinity)   // store allows negative stock
  assert.equal(P.clampQty({ allowDecimal: false, available: 3 }, 9), 3)
})

test('announcement and trust points use only what is switched on', () => {
  assert.equal(P.announcement({}), '')
  const a = P.announcement({ delivery: true, deliveryFee: '1500', pickup: true, payOnline: true })
  assert.match(a, /Delivery available \(₦1,500\)/); assert.match(a, /Pickup available/); assert.match(a, /Pay securely online/)
  assert.equal(P.trustPoints({}).length, 0)
  assert.equal(P.trustPoints({ payOnline: true, payLater: true, delivery: true, pickup: true, phone: '1' }).length, 4)
})

test('contact lines list only real details; WhatsApp numbers get the country code', () => {
  assert.deepEqual(P.contactLines({}), [])
  const c = P.contactLines({ phone: '0803 000 0000', whatsapp: '08030000000', email: 'a@b.ng', address: '1 Road' })
  assert.deepEqual(c.map((x) => x.kind), ['phone', 'whatsapp', 'email', 'address'])
  assert.equal(c[0].href, 'tel:08030000000')
  assert.equal(P.whatsappLink({ whatsapp: '0803 000 0000' }, 'Hi there'), 'https://wa.me/2348030000000?text=Hi%20there')
  assert.equal(P.whatsappLink({}), null)
})

test('industry presentation: food and catering use the menu layout, retail the grid, unknown falls back', () => {
  assert.equal(P.presentation('RESTAURANT').layout, 'menu')
  assert.equal(P.presentation('CATERING').shop, 'Packages')
  assert.equal(P.presentation('RETAIL').layout, 'grid')
  assert.equal(P.presentation('LIVESTOCK').shop, 'Listings')
  assert.equal(P.presentation('SOMETHING').layout, 'grid')
  assert.equal(P.presentation(undefined).key, 'general')
})

test('FAQ answers reflect the real payment and delivery settings', () => {
  const f = P.faqFor({ name: 'Ada Store', payOnline: false, payLater: true, delivery: false, pickup: true }, P.presentation('RETAIL'))
  const text = JSON.stringify(f)
  assert.doesNotMatch(text, /Paystack\)/)          // no online payment promised
  assert.match(text, /collect your order/)
  assert.doesNotMatch(text, /Do you deliver\?.*delivery \(/)
})

test('orders placed on this device are remembered, newest first, without duplicates', () => {
  const mem = new Map(); const st = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) }
  P.rememberOrder(st, 's', 't1', 1); P.rememberOrder(st, 's', 't2', 2); P.rememberOrder(st, 's', 't1', 3)
  assert.deepEqual(P.readOrders(st, 's').map((o) => o.token), ['t1', 't2'])
  assert.deepEqual(P.readOrders(st, 'other'), [])
})

// ---- extras: options, sale prices, specs, social links, hours ----
import { cartKey, parseKey, optionsError, optionsExtra, specsList, discountLabel, socialLinks, hoursLines } from '../src/store/presentation.js'

const groups = [
  { id: 'g1', name: 'Protein', required: true, maxSelect: 1, options: [{ id: 'o1', name: 'Chicken', priceDelta: 1500 }, { id: 'o2', name: 'Beef', priceDelta: 1800 }] },
  { id: 'g2', name: 'Sides', required: false, maxSelect: 2, options: [{ id: 'o3', name: 'Plantain', priceDelta: 500 }, { id: 'o4', name: 'Salad', priceDelta: 700 }, { id: 'o5', name: 'Egg', priceDelta: 300 }] },
]
test('cart keys: same choices share a line regardless of order, parse round-trips', () => {
  assert.equal(cartKey('v1'), 'v1')
  assert.equal(cartKey('v1', ['o4', 'o3']), cartKey('v1', ['o3', 'o4']))
  assert.deepEqual(parseKey(cartKey('v1', ['o4', 'o3'])), { variantId: 'v1', optionIds: ['o3', 'o4'] })
  assert.deepEqual(parseKey('v1'), { variantId: 'v1', optionIds: [] })
})
test('optionsError enforces required groups and limits', () => {
  assert.match(optionsError(groups, []), /Protein/)
  assert.equal(optionsError(groups, ['o1']), '')
  assert.match(optionsError(groups, ['o1', 'o3', 'o4', 'o5']), /at most 2/)
  assert.equal(optionsExtra(groups, ['o2', 'o3']), 2300)
})
test('cartLines prices options per unit and drops entries whose option vanished', () => {
  const item = { variantId: 'v1', productId: 'p1', name: 'Jollof', price: 3000, inStock: true, available: 10, allowDecimal: false, optionGroups: groups }
  const cart = { [cartKey('v1', ['o1', 'o3'])]: 2, [cartKey('v1', ['gone'])]: 1, v1: 1 }
  const r = P.cartLines(cart, { v1: item })
  assert.equal(r.lines.length, 1)
  assert.equal(r.lines[0].unit, 5000)
  assert.equal(r.subtotal, 10000)
  assert.equal(r.missing, 2) // the vanished option, and the plain line that lacks the required Protein
})
test('sale price only when original is higher than the selling price', () => {
  const items = [
    { variantId: 'a', productId: 'p', name: 'X', label: 'S', price: 800, compareAtPrice: 1000, inStock: true, available: 3 },
    { variantId: 'b', productId: 'p', name: 'X', label: 'M', price: 900, compareAtPrice: 900, inStock: true, available: 3 },
  ]
  const [p] = P.groupProducts(items)
  assert.equal(p.onSale, true)
  assert.equal(p.compareAt, 1000)
  assert.equal(discountLabel(800, 1000), '20% off')
  assert.equal(discountLabel(900, 900), '')
  assert.equal(P.groupProducts([{ ...items[1] }])[0].onSale, false)
})
test('gallery merges main photo first without duplicates; specs parse', () => {
  const [p] = P.groupProducts([{ variantId: 'a', productId: 'p', name: 'X', price: 1, inStock: true, available: 1, imageUrl: 'm.jpg', images: ['m.jpg', 'g1.jpg'], specs: 'Material: Cotton\nBad line\nFit: Slim: relaxed' }])
  assert.deepEqual(p.images, ['m.jpg', 'g1.jpg'])
  assert.deepEqual(p.specs, [['Material', 'Cotton'], ['Fit', 'Slim: relaxed']])
  assert.deepEqual(specsList(null), [])
})
test('socialLinks shows only https links that exist; hours split into lines', () => {
  assert.deepEqual(socialLinks({ instagramUrl: 'https://instagram.com/a', facebookUrl: 'javascript:alert(1)', xUrl: null }), [{ label: 'Instagram', href: 'https://instagram.com/a' }])
  assert.deepEqual(socialLinks({}), [])
  assert.deepEqual(hoursLines({ openingHours: 'Mon-Fri 9-5\n\n Sat 10-2 ' }), ['Mon-Fri 9-5', 'Sat 10-2'])
  assert.deepEqual(hoursLines({}), [])
})
