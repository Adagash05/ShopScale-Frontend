#!/usr/bin/env node
// Seeds FICTIONAL demonstration businesses into a LOCAL ShopScale backend, using only the backend's own REST API
// (so every rule, limit, stock movement and ledger entry is the real one). Safe to run again: it only adds what is missing.
//
//   node scripts/demo/seed-demo.mjs                 seed all four demo businesses
//   node scripts/demo/seed-demo.mjs --only=retail   retail | restaurant | bakery | catering (comma separated)
//   node scripts/demo/seed-demo.mjs --dry-run       print what would be created, change nothing
//
// Environment: API_BASE_URL (default http://localhost:8080), DEMO_PASSWORD. Refuses to run against a non-local backend.
import { ACCOUNTS, API_BASE_URL, DEMO_PASSWORD, assertLocalBackend } from './demo-config.mjs'

const argv = process.argv.slice(2)
const DRY = argv.includes('--dry-run')
const only = (argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean)
const failures = []
const log = (m) => console.log(m)

// ---------------------------------------------------------------- HTTP
async function http(method, path, token, body) {
  const res = await fetch(API_BASE_URL + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const e = new Error(`${method} ${path} -> ${res.status} ${(data && data.message) || String(text).slice(0, 220)}`)
    e.status = res.status
    throw e
  }
  return data
}

/** Signs in (creating the account and business the first time) and returns an API client that re-signs-in if the 15-minute token expires. */
async function session(acc) {
  let token
  const login = async () => {
    const a = await http('POST', '/api/auth/login', null, { email: acc.email, password: DEMO_PASSWORD })
    token = a.accessToken
    return a
  }
  let auth
  try { auth = await login() } catch (e) {
    if (e.status !== 401) throw e
    auth = await http('POST', '/api/auth/register', null, { email: acc.email, password: DEMO_PASSWORD, fullName: acc.fullName, phone: acc.phone })
    token = auth.accessToken
    log('  created demo account ' + acc.email)
  }
  if (!auth.business) {
    auth = await http('POST', '/api/businesses', token, {
      name: acc.businessName, businessType: acc.type, subtype: acc.subtype, slug: acc.slug, currency: 'NGN', timezone: 'Africa/Lagos',
      description: acc.description, phone: acc.phone, email: acc.email, address: acc.address,
    })
    token = auth.accessToken
    log('  created business ' + acc.businessName)
  }
  const call = async (method, path, body) => {
    try { return await http(method, path, token, body) } catch (e) {
      if (e.status !== 401) throw e
      await login()
      return http(method, path, token, body)
    }
  }
  return { get: (p) => call('GET', p), post: (p, b) => call('POST', p, b ?? {}), put: (p, b) => call('PUT', p, b) }
}

async function step(name, fn) {
  try { const r = await fn(); log(`  ok   ${name}`); return r } catch (e) { failures.push(`${name}: ${e.message}`); log(`  FAIL ${name}: ${e.message}`) }
}

const content = (page) => (page && page.content) || (Array.isArray(page) ? page : [])
const money = (n) => Math.round(n * 100) / 100
const day = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10) }

// ---------------------------------------------------------------- reusable pieces
async function ensureCategories(api, names) {
  const have = new Map((await api.get('/api/categories')).map((c) => [c.name.toLowerCase(), c.id]))
  for (const n of names) if (!have.has(n.toLowerCase())) have.set(n.toLowerCase(), (await api.post('/api/categories', { name: n })).id)
  return have
}

/** items: { name, cat, price, cost, qty, low, unit, kind, description, decimal } -> Map(name -> { productId, variantId }) */
async function ensureProducts(api, items, cats) {
  const have = new Map(content(await api.get('/api/products?size=200')).map((p) => [p.name.toLowerCase(), p]))
  const out = new Map()
  for (const it of items) {
    let p = have.get(it.name.toLowerCase())
    if (!p) {
      p = await api.post('/api/products', {
        name: it.name, description: it.description, categoryId: it.cat ? cats.get(it.cat.toLowerCase()) : undefined, kind: it.kind,
        variants: [{ price: it.price, cost: it.cost, quantity: it.qty ?? 0, lowStockThreshold: it.low, unit: it.unit, allowDecimal: !!it.decimal }],
      })
    }
    out.set(it.name, { productId: p.id, variantId: p.variants[0].id })
  }
  return out
}

async function ensureNamed(api, listPath, createPath, rows) {
  const have = new Map(content(await api.get(listPath)).map((r) => [r.name.toLowerCase(), r]))
  const out = new Map()
  for (const r of rows) out.set(r.name, have.get(r.name.toLowerCase()) || (await api.post(createPath, r)))
  return out
}

/** Turns the online store on and sets sensible, honest defaults. Paystack is NOT connected: online card payment needs your own test keys. */
async function openStore(api, title, description, phone, whatsapp) {
  await api.put('/api/store/settings', {
    enabled: true, title, description, phone, whatsapp, pickupEnabled: true, deliveryEnabled: true, deliveryFee: 1500,
    deliveryNote: 'Delivery within the city. We call you to confirm.', payLaterEnabled: true,
  })
}

/** Places orders exactly as a customer would, through the public storefront API. */
async function placeStoreOrders(api, slug, orders, byName) {
  const placed = []
  for (const o of orders) {
    const r = await http('POST', `/api/public/store/${slug}/orders`, null, {
      items: o.items.map(([name, qty]) => ({ variantId: byName.get(name).variantId, quantity: qty })),
      customerName: o.customer, phone: o.phone, email: o.email, deliveryMethod: o.method, address: o.address, note: o.note, paymentMode: 'PAY_LATER',
    })
    placed.push(r)
  }
  return placed
}

// ---------------------------------------------------------------- RETAIL: Aminu Stores
const RETAIL_CATS = ['Rice and grains', 'Beverages', 'Cooking essentials', 'Snacks and biscuits', 'Household', 'Personal care']
const RETAIL_ITEMS = [
  { name: 'Mama Gold Rice 50kg', cat: 'Rice and grains', price: 78000, cost: 71000, qty: 14, low: 4, unit: 'bag' },
  { name: 'Local Rice 25kg', cat: 'Rice and grains', price: 38500, cost: 34500, qty: 20, low: 5, unit: 'bag' },
  { name: 'Beans (Brown) per kg', cat: 'Rice and grains', price: 2300, cost: 1900, qty: 80, low: 20, unit: 'kg', decimal: true },
  { name: 'Garri (White) per kg', cat: 'Rice and grains', price: 1100, cost: 800, qty: 120, low: 25, unit: 'kg', decimal: true },
  { name: 'Spaghetti 500g', cat: 'Rice and grains', price: 1200, cost: 950, qty: 150, low: 30, unit: 'pack' },
  { name: 'Indomie Noodles Carton (40)', cat: 'Rice and grains', price: 9800, cost: 8900, qty: 3, low: 5, unit: 'carton' },
  { name: 'Coca-Cola 50cl (Crate of 12)', cat: 'Beverages', price: 4200, cost: 3600, qty: 16, low: 5, unit: 'crate' },
  { name: 'Bottled Water 75cl (Pack of 12)', cat: 'Beverages', price: 1800, cost: 1350, qty: 40, low: 10, unit: 'pack' },
  { name: 'Peak Milk Tin 400g', cat: 'Beverages', price: 3600, cost: 3150, qty: 36, low: 10, unit: 'piece' },
  { name: 'Milo 500g', cat: 'Beverages', price: 4300, cost: 3800, qty: 25, low: 8, unit: 'piece' },
  { name: 'Groundnut Oil 5 litres', cat: 'Cooking essentials', price: 14500, cost: 12800, qty: 18, low: 5, unit: 'piece' },
  { name: 'Palm Oil 5 litres', cat: 'Cooking essentials', price: 11500, cost: 9900, qty: 0, low: 5, unit: 'piece' },
  { name: 'Tomato Paste 70g (Pack of 10)', cat: 'Cooking essentials', price: 1500, cost: 1150, qty: 60, low: 15, unit: 'pack' },
  { name: 'Maggi Cubes (Pack of 100)', cat: 'Cooking essentials', price: 3300, cost: 2800, qty: 30, low: 8, unit: 'pack' },
  { name: 'Salt 1kg', cat: 'Cooking essentials', price: 450, cost: 300, qty: 90, low: 20, unit: 'piece' },
  { name: 'Sugar 1kg', cat: 'Cooking essentials', price: 1900, cost: 1650, qty: 55, low: 15, unit: 'piece' },
  { name: 'Digestive Biscuits', cat: 'Snacks and biscuits', price: 700, cost: 520, qty: 100, low: 20, unit: 'pack' },
  { name: 'Plantain Chips', cat: 'Snacks and biscuits', price: 500, cost: 320, qty: 70, low: 15, unit: 'pack' },
  { name: 'Detergent Powder 900g', cat: 'Household', price: 2200, cost: 1750, qty: 45, low: 10, unit: 'pack' },
  { name: 'Toilet Roll (Pack of 10)', cat: 'Household', price: 3000, cost: 2400, qty: 28, low: 8, unit: 'pack' },
  { name: 'Bathing Soap (Pack of 6)', cat: 'Personal care', price: 2400, cost: 1900, qty: 32, low: 8, unit: 'pack' },
  { name: 'Toothpaste 120g', cat: 'Personal care', price: 1100, cost: 800, qty: 4, low: 10, unit: 'piece' },
]
const RETAIL_CUSTOMERS = [
  { name: 'Mrs Ifeoma Nwosu', phone: '08000010001', address: 'Block 4, Unity Estate, Ikeja', notes: 'Buys monthly provisions' },
  { name: 'Alhaji Musa Lawal', phone: '08000010002', address: 'Market Road, Kano', notes: 'Wholesale buyer' },
  { name: 'Blessing Okoro', phone: '08000010003', address: 'Rumuola, Port Harcourt' },
  { name: 'Tunde Bakare', phone: '08000010004', address: 'Bodija, Ibadan' },
  { name: 'Hajiya Zainab Yusuf', phone: '08000010005', address: 'Gwarinpa, Abuja' },
]
const RETAIL_SUPPLIERS = [
  { name: 'Lagos Grains Wholesale Ltd', phone: '08000020001', address: 'Mile 12 Market, Lagos', notes: 'Rice, beans, garri' },
  { name: 'Prime Beverages Distribution', phone: '08000020002', address: 'Apapa, Lagos', notes: 'Soft drinks and water' },
  { name: 'HomeCare Supplies Nigeria', phone: '08000020003', address: 'Ikeja Industrial Estate' },
]

async function seedRetail(api, acc) {
  const cats = await step('categories', () => ensureCategories(api, RETAIL_CATS))
  const products = await step('products', () => ensureProducts(api, RETAIL_ITEMS, cats))
  if (!products) return
  const customers = await step('customers', () => ensureNamed(api, '/api/customers?size=100', '/api/customers', RETAIL_CUSTOMERS))
  const suppliers = await step('suppliers', () => ensureNamed(api, '/api/suppliers?size=100', '/api/suppliers', RETAIL_SUPPLIERS))
  const v = (n) => products.get(n).variantId

  if (suppliers && !(await api.get('/api/purchases?size=1')).totalElements) await step('purchases', async () => {
    const s = (n) => suppliers.get(n).id
    await api.post('/api/purchases', { supplierId: s('Lagos Grains Wholesale Ltd'), reference: 'INV-GR-1042', paymentMethod: 'TRANSFER', amountPaid: 600000,
      note: 'Monthly restock', items: [{ variantId: v('Mama Gold Rice 50kg'), quantity: 10, unitCost: 71000 }, { variantId: v('Local Rice 25kg'), quantity: 6, unitCost: 34500 }] })
    await api.post('/api/purchases', { supplierId: s('Prime Beverages Distribution'), reference: 'PBD-7781', paymentMethod: 'CASH', amountPaid: 70200,
      items: [{ variantId: v('Coca-Cola 50cl (Crate of 12)'), quantity: 12, unitCost: 3600 }, { variantId: v('Bottled Water 75cl (Pack of 12)'), quantity: 20, unitCost: 1350 }] })
    await api.post('/api/purchases', { supplierId: s('HomeCare Supplies Nigeria'), reference: 'HC-220', paymentMethod: 'TRANSFER', amountPaid: 60000,
      items: [{ variantId: v('Detergent Powder 900g'), quantity: 24, unitCost: 1750 }, { variantId: v('Toilet Roll (Pack of 10)'), quantity: 12, unitCost: 2400 }] })
  })

  if (customers && !content(await api.get('/api/sales?range=last30&size=1')).length) await step('sales', async () => {
    const c = (n) => customers.get(n).id
    const sale = (lines, pay, customer, note) => api.post('/api/sales', { items: lines.map(([n, q]) => ({ variantId: v(n), quantity: q })),
      payments: pay, customerId: customer, note })
    await sale([['Mama Gold Rice 50kg', 1], ['Groundnut Oil 5 litres', 1]], [{ method: 'TRANSFER', amount: 92500 }])
    await sale([['Beans (Brown) per kg', 5], ['Garri (White) per kg', 10], ['Salt 1kg', 2]], [{ method: 'CASH', amount: 23400 }])
    await sale([['Coca-Cola 50cl (Crate of 12)', 2], ['Bottled Water 75cl (Pack of 12)', 3]], [{ method: 'CASH', amount: 13800 }])
    await sale([['Peak Milk Tin 400g', 6], ['Milo 500g', 2], ['Sugar 1kg', 3]], [{ method: 'CARD', amount: 35900 }], c('Mrs Ifeoma Nwosu'))
    await sale([['Local Rice 25kg', 4], ['Tomato Paste 70g (Pack of 10)', 6]], [{ method: 'TRANSFER', amount: 100000 }], c('Alhaji Musa Lawal'), 'Part payment, balance on delivery')
    await sale([['Indomie Noodles Carton (40)', 2], ['Maggi Cubes (Pack of 100)', 2]], [{ method: 'CASH', amount: 10000 }], c('Blessing Okoro'), 'Pays the balance on Friday')
    await sale([['Detergent Powder 900g', 3], ['Bathing Soap (Pack of 6)', 2], ['Toothpaste 120g', 2]], [{ method: 'CASH', amount: 13600 }])
    await sale([['Digestive Biscuits', 6], ['Plantain Chips', 8]], [{ method: 'CASH', amount: 8200 }])
  })

  if (!content(await api.get('/api/expenses?range=last30&size=1').then((r) => r.page)).length) await step('expenses', async () => {
    const e = (category, amount, ago, description, paymentMethod = 'CASH') => api.post('/api/expenses', { category, amount, expenseDate: day(-ago), description, paymentMethod })
    await e('Rent', 150000, 12, 'Shop rent for the month', 'TRANSFER')
    await e('Transport', 18000, 9, 'Delivery van fuel')
    await e('Electricity', 32500, 7, 'Prepaid meter top-up', 'TRANSFER')
    await e('Salaries', 120000, 5, 'Shop assistant wages', 'TRANSFER')
    await e('Packaging', 9500, 3, 'Nylon bags and labels')
    await e('Internet', 12000, 2, 'Monthly data plan', 'CARD')
  })

  await step('branch and stock transfer', async () => {
    const have = await api.get('/api/branches')
    let second = have.find((b) => b.name === 'Aminu Stores, Ikeja Branch')
    if (!second) second = await api.post('/api/branches', { name: 'Aminu Stores, Ikeja Branch', address: '12 Allen Avenue, Ikeja', phone: '08000000011' })
    const main = (await api.get('/api/branches')).find((b) => b.main)
    if (!(await api.get('/api/transfers')).totalElements && main) {
      await api.post('/api/transfers', { fromBranchId: main.id, toBranchId: second.id, note: 'Opening stock for the new branch',
        items: [{ variantId: v('Local Rice 25kg'), quantity: 4 }, { variantId: v('Bottled Water 75cl (Pack of 12)'), quantity: 10 }, { variantId: v('Sugar 1kg'), quantity: 12 }] })
    }
  })

  await step('team invitations (no email is required to be configured)', async () => {
    const have = new Set((await api.get('/api/team/invitations')).map((i) => i.email))
    const members = (await api.get('/api/team/members')).map((m) => m.email)
    for (const [fullName, email, role] of [['Kemi Salami', 'kemi.cashier@demo.shopscale.test', 'SALES_STAFF'], ['Ibrahim Danjuma', 'ibrahim.stock@demo.shopscale.test', 'INVENTORY_STAFF']]) {
      if (!have.has(email) && !members.includes(email)) await api.post('/api/team/invitations', { fullName, email, role })
    }
  })

  await step('online store, products and customer orders', async () => {
    await openStore(api, 'Aminu Stores', 'Quality groceries and household goods, delivered or ready for pickup.', '08000000001', '2348000000001')
    const orders = content(await api.get('/api/store/orders'))
    if (orders.length) return
    const placed = await placeStoreOrders(api, acc.slug, [
      { customer: 'Chioma Eze', phone: '08000030001', email: 'chioma@demo.shopscale.test', method: 'PICKUP', note: 'I will pick up at 5pm', items: [['Local Rice 25kg', 1], ['Groundnut Oil 5 litres', 1]] },
      { customer: 'Segun Adebayo', phone: '08000030002', method: 'DELIVERY', address: '5 Adeniyi Jones Avenue, Ikeja', items: [['Mama Gold Rice 50kg', 1], ['Tomato Paste 70g (Pack of 10)', 2], ['Salt 1kg', 3]] },
      { customer: 'Halima Garba', phone: '08000030003', method: 'PICKUP', items: [['Milo 500g', 2], ['Peak Milk Tin 400g', 4]] },
      { customer: 'Emeka Obi', phone: '08000030004', method: 'DELIVERY', address: '17 Admiralty Way, Lekki', items: [['Coca-Cola 50cl (Crate of 12)', 1], ['Bottled Water 75cl (Pack of 12)', 2]] },
      { customer: 'Rita Johnson', phone: '08000030005', method: 'PICKUP', items: [['Detergent Powder 900g', 2], ['Toilet Roll (Pack of 10)', 1]] },
    ], products)
    // Leave a spread of statuses so the Online orders screen looks like a business in use: new, confirmed, ready, completed.
    const list = content(await api.get('/api/store/orders'))
    const byNum = (i) => list.find((o) => o.token === placed[i].token)
    const o1 = byNum(1), o2 = byNum(2), o3 = byNum(3)
    if (o1) await api.post(`/api/store/orders/${o1.id}/status/CONFIRMED`)
    if (o2) { await api.post(`/api/store/orders/${o2.id}/status/CONFIRMED`); await api.post(`/api/store/orders/${o2.id}/status/READY`) }
    if (o3) { await api.post(`/api/store/orders/${o3.id}/status/CONFIRMED`); await api.post(`/api/store/orders/${o3.id}/status/READY`); await api.post(`/api/store/orders/${o3.id}/complete`, { method: 'CASH' }) }
  })
}

// ---------------------------------------------------------------- RESTAURANT: Royal Kitchen Restaurant
const MENU = [
  { name: 'Jollof Rice and Chicken', cat: 'Rice dishes', kind: 'MENU', price: 4500, cost: 1900, qty: 0 },
  { name: 'Fried Rice and Turkey', cat: 'Rice dishes', kind: 'MENU', price: 5200, cost: 2300, qty: 0 },
  { name: 'Pounded Yam and Egusi Soup', cat: 'Swallow and soups', kind: 'MENU', price: 5500, cost: 2400, qty: 0 },
  { name: 'Amala and Ewedu with Gbegiri', cat: 'Swallow and soups', kind: 'MENU', price: 4000, cost: 1700, qty: 0 },
  { name: 'Pepper Soup (Goat Meat)', cat: 'Swallow and soups', kind: 'MENU', price: 4800, cost: 2200, qty: 0 },
  { name: 'Grilled Fish and Plantain', cat: 'Grills', kind: 'MENU', price: 6500, cost: 3100, qty: 0 },
  { name: 'Suya Platter', cat: 'Grills', kind: 'MENU', price: 5000, cost: 2300, qty: 0 },
  { name: 'Chapman', cat: 'Drinks', kind: 'MENU', price: 1800, cost: 600, qty: 0 },
  { name: 'Zobo (Bottle)', cat: 'Drinks', kind: 'MENU', price: 1200, cost: 400, qty: 0 },
  { name: 'Bottled Water', cat: 'Drinks', kind: 'MENU', price: 500, cost: 250, qty: 0 },
  { name: 'Long-grain Rice (kg)', kind: 'INGREDIENT', price: 0, cost: 1500, qty: 60, low: 15, unit: 'kg', decimal: true },
  { name: 'Chicken (kg)', kind: 'INGREDIENT', price: 0, cost: 3200, qty: 25, low: 8, unit: 'kg', decimal: true },
  { name: 'Tomatoes (kg)', kind: 'INGREDIENT', price: 0, cost: 1200, qty: 18, low: 6, unit: 'kg', decimal: true },
]
async function seedRestaurant(api, acc) {
  const cats = await step('menu categories', () => ensureCategories(api, ['Rice dishes', 'Swallow and soups', 'Grills', 'Drinks']))
  const items = await step('menu items and ingredients', () => ensureProducts(api, MENU, cats))
  if (!items) return
  const tables = await step('tables', async () => {
    const have = new Map((await api.get('/api/restaurant/tables')).map((t) => [t.name, t]))
    for (const [name, seats] of [['Table 1', 2], ['Table 2', 4], ['Table 3', 4], ['Table 4', 6], ['Patio 1', 4]]) if (!have.has(name)) have.set(name, await api.post('/api/restaurant/tables', { name, seats }))
    return have
  })
  await step('menu options (modifier groups)', async () => {
    if ((await api.get('/api/restaurant/modifier-groups')).length) return
    const g = await api.post('/api/restaurant/modifier-groups', { name: 'Extras', required: false, maxSelect: 3 })
    await api.post(`/api/restaurant/modifier-groups/${g.id}/modifiers`, { name: 'Extra chicken', priceDelta: 1500 })
    await api.post(`/api/restaurant/modifier-groups/${g.id}/modifiers`, { name: 'Fried plantain', priceDelta: 700 })
    await api.put(`/api/restaurant/products/${items.get('Jollof Rice and Chicken').productId}/modifier-groups`, [g.id])
  })
  if (!tables || (await api.get('/api/restaurant/orders')).length) return
  await step('restaurant and kitchen orders', async () => {
    const it = (n, q = 1, note) => ({ variantId: items.get(n).variantId, quantity: q, note })
    const t = (n) => tables.get(n).id
    const o1 = await api.post('/api/restaurant/orders', { orderType: 'DINE_IN', tableId: t('Table 2'), customerName: 'Walk-in', items: [it('Jollof Rice and Chicken', 2), it('Chapman', 2)] })
    const o2 = await api.post('/api/restaurant/orders', { orderType: 'DINE_IN', tableId: t('Table 4'), items: [it('Pounded Yam and Egusi Soup', 2), it('Zobo (Bottle)', 2), it('Suya Platter', 1, 'Extra pepper')] })
    const o3 = await api.post('/api/restaurant/orders', { orderType: 'TAKEAWAY', customerName: 'Mr Adewale', items: [it('Fried Rice and Turkey', 3), it('Bottled Water', 3)] })
    const o4 = await api.post('/api/restaurant/orders', { orderType: 'DELIVERY', customerName: 'Mrs Odunayo', note: '3 Palm Avenue, Surulere', items: [it('Grilled Fish and Plantain', 1), it('Amala and Ewedu with Gbegiri', 1)] })
    const o5 = await api.post('/api/restaurant/orders', { orderType: 'DINE_IN', tableId: t('Table 1'), items: [it('Pepper Soup (Goat Meat)', 2)] })
    // Spread the kitchen board: o1 being made, o2 ready, o5 served and paid, others waiting.
    for (const i of o1.items) await api.post(`/api/restaurant/items/${i.id}/status?status=PREPARING`)
    for (const i of o2.items) { await api.post(`/api/restaurant/items/${i.id}/status?status=PREPARING`); await api.post(`/api/restaurant/items/${i.id}/status?status=READY`) }
    for (const s of ['PREPARING', 'READY', 'SERVED']) for (const i of o5.items) await api.post(`/api/restaurant/items/${i.id}/status?status=${s}`)
    await api.post(`/api/restaurant/orders/${o5.id}/pay`, { payments: [{ method: 'CARD', amount: 9600 }] })
    void o3; void o4
  })
}

// ---------------------------------------------------------------- BAKERY: Golden Crust Bakery
const BAKERY = [
  { name: 'Sliced Bread (Family)', cat: 'Bread', kind: 'FINISHED', price: 1800, cost: 900, qty: 24, low: 8, unit: 'piece' },
  { name: 'Agege Bread', cat: 'Bread', kind: 'FINISHED', price: 1200, cost: 600, qty: 30, low: 10, unit: 'piece' },
  { name: 'Chocolate Cake (8 inch)', cat: 'Cakes', kind: 'FINISHED', price: 18500, cost: 9200, qty: 5, low: 2, unit: 'piece' },
  { name: 'Vanilla Cupcakes (Box of 6)', cat: 'Cakes', kind: 'FINISHED', price: 4500, cost: 2100, qty: 14, low: 5, unit: 'pack' },
  { name: 'Meat Pie', cat: 'Pastries', kind: 'FINISHED', price: 1000, cost: 480, qty: 40, low: 12, unit: 'piece' },
  { name: 'Doughnut', cat: 'Pastries', kind: 'FINISHED', price: 500, cost: 210, qty: 36, low: 12, unit: 'piece' },
  { name: 'Flour (50kg bag)', kind: 'INGREDIENT', price: 0, cost: 52000, qty: 4, low: 2, unit: 'bag' },
  { name: 'Sugar (kg)', kind: 'INGREDIENT', price: 0, cost: 1650, qty: 20, low: 6, unit: 'kg', decimal: true },
  { name: 'Butter (kg)', kind: 'INGREDIENT', price: 0, cost: 6200, qty: 3, low: 4, unit: 'kg', decimal: true },
]
async function seedBakery(api, acc) {
  const cats = await step('categories', () => ensureCategories(api, ['Bread', 'Cakes', 'Pastries']))
  const items = await step('bakery products and ingredients', () => ensureProducts(api, BAKERY, cats))
  if (!items) return
  await step('recipe and production run', async () => {
    const id = items.get('Sliced Bread (Family)').variantId
    if (await api.get(`/api/recipes/${id}`)) return   // 204 (no body) when the item has no recipe yet
    await api.put(`/api/recipes/${id}`, { yieldQuantity: 20, mode: 'PRODUCTION', notes: 'One batch makes 20 loaves',
      lines: [{ ingredientVariantId: items.get('Flour (50kg bag)').variantId, quantity: 0.25 }, { ingredientVariantId: items.get('Sugar (kg)').variantId, quantity: 0.5 }] })
    await api.post('/api/production/runs', { variantId: id, quantity: 20, note: 'Morning batch' })
  })
  if (!content(await api.get('/api/sales?range=last30&size=1')).length) await step('sales', async () => {
    const v = (n) => items.get(n).variantId
    await api.post('/api/sales', { items: [{ variantId: v('Sliced Bread (Family)'), quantity: 6 }, { variantId: v('Meat Pie'), quantity: 10 }], payments: [{ method: 'CASH', amount: 20800 }] })
    await api.post('/api/sales', { items: [{ variantId: v('Chocolate Cake (8 inch)'), quantity: 1 }, { variantId: v('Vanilla Cupcakes (Box of 6)'), quantity: 2 }], payments: [{ method: 'TRANSFER', amount: 27500 }] })
    await api.post('/api/sales', { items: [{ variantId: v('Doughnut'), quantity: 12 }, { variantId: v('Agege Bread'), quantity: 5 }], payments: [{ method: 'CASH', amount: 12000 }] })
  })
  await step('online store and orders', async () => {
    await openStore(api, 'Golden Crust Bakery', 'Fresh bread, cakes and pastries baked every morning.', '08000000003', '2348000000003')
    if (content(await api.get('/api/store/orders')).length) return
    await placeStoreOrders(api, acc.slug, [
      { customer: 'Mrs Bisi Coker', phone: '08000040001', method: 'PICKUP', note: 'Please write "Happy Birthday Tolu"', items: [['Chocolate Cake (8 inch)', 1]] },
      { customer: 'Mr Yakubu Dan', phone: '08000040002', method: 'DELIVERY', address: '9 Wuse Zone 5, Abuja', items: [['Sliced Bread (Family)', 4], ['Meat Pie', 12]] },
    ], items)
  })
}

// ---------------------------------------------------------------- CATERING: Fresh Harvest Foods
const CATERING_ITEMS = [
  { name: 'Rice (kg)', kind: 'INGREDIENT', price: 0, cost: 1500, qty: 200, low: 40, unit: 'kg', decimal: true },
  { name: 'Chicken (kg)', kind: 'INGREDIENT', price: 0, cost: 3200, qty: 120, low: 30, unit: 'kg', decimal: true },
  { name: 'Vegetable Oil (litre)', kind: 'INGREDIENT', price: 0, cost: 2100, qty: 60, low: 15, unit: 'litre', decimal: true },
  { name: 'Small Chops Tray', cat: 'Small chops', kind: 'FINISHED', price: 25000, cost: 12000, qty: 8, low: 3, unit: 'tray' },
]
async function seedCatering(api) {
  const cats = await step('categories', () => ensureCategories(api, ['Small chops']))
  const items = await step('ingredients and products', () => ensureProducts(api, CATERING_ITEMS, cats))
  if (!items) return
  const customers = await step('customers', () => ensureNamed(api, '/api/customers?size=100', '/api/customers', [
    { name: 'Mrs Adaeze Okonkwo', phone: '08000050001', notes: 'Wedding client' },
    { name: 'GreenTech Solutions Ltd', phone: '08000050002', notes: 'Corporate client' },
    { name: 'Pastor Emmanuel Bassey', phone: '08000050003', notes: 'Church anniversary' },
  ]))
  const pkgs = await step('packages and services', async () => {
    const have = new Map((await api.get('/api/catering/packages?all=true')).map((p) => [p.name, p]))
    const mk = async (body) => { if (!have.has(body.name)) have.set(body.name, await api.post('/api/catering/packages', body)); return have.get(body.name) }
    await mk({ name: 'Classic Wedding Package', description: 'Full reception buffet for weddings.', inclusions: 'Jollof rice, fried rice, chicken, salad, drinks, serving staff', basePrice: 150000, pricePerGuest: 6500, minGuests: 50, active: true,
      lines: [{ variantId: items.get('Rice (kg)').variantId, qtyPerGuest: 0.2 }, { variantId: items.get('Chicken (kg)').variantId, qtyPerGuest: 0.15 }] })
    await mk({ name: 'Corporate Lunch Box', description: 'Individually packed lunch for meetings and trainings.', inclusions: 'Rice, chicken, plantain, drink', basePrice: 0, pricePerGuest: 4500, minGuests: 20, active: true,
      lines: [{ variantId: items.get('Rice (kg)').variantId, qtyPerGuest: 0.15 }, { variantId: items.get('Chicken (kg)').variantId, qtyPerGuest: 0.1 }] })
    const svc = new Map((await api.get('/api/catering/services')).map((s) => [s.name, s]))
    for (const s of [{ name: 'Serving staff (per person)', description: 'Trained waiters', price: 8000, basis: 'FIXED', active: true }, { name: 'Table and chair rental', description: 'Per guest', price: 500, basis: 'PER_GUEST', active: true }]) {
      if (!svc.has(s.name)) svc.set(s.name, await api.post('/api/catering/services', s))
    }
    return { have, svc }
  })
  if (!pkgs || !customers || content(await api.get('/api/catering/events')).length) return
  await step('catering events (enquiry, quoted, booked, in preparation)', async () => {
    const wedding = pkgs.have.get('Classic Wedding Package'), lunch = pkgs.have.get('Corporate Lunch Box')
    const staff = pkgs.svc.get('Serving staff (per person)')
    const c = (n) => customers.get(n)
    const base = (title, cust, pkg, guests, date, venue, extra = {}) => ({ title, customerId: c(cust).id, venue, eventDate: day(date), startTime: '12:00', guests, packageId: pkg.id,
      services: [{ serviceId: staff.id, quantity: 4 }], depositRequired: 100000, ...extra })
    await api.post('/api/catering/events', base('Okonkwo wedding reception', 'Mrs Adaeze Okonkwo', wedding, 150, 21, 'Grand Palm Event Centre, Lekki'))
    const quoted = await api.post('/api/catering/events', base('GreenTech annual staff lunch', 'GreenTech Solutions Ltd', lunch, 80, 12, 'GreenTech Office, Victoria Island', { depositRequired: 60000 }))
    await api.post(`/api/catering/events/${quoted.id}/quote`)
    const booked = await api.post('/api/catering/events', base('Bassey church anniversary', 'Pastor Emmanuel Bassey', wedding, 120, 9, 'Grace Chapel Hall, Surulere'))
    await api.post(`/api/catering/events/${booked.id}/quote`)
    await api.post(`/api/catering/events/${booked.id}/payments`, { amount: 100000, method: 'TRANSFER', note: 'Deposit' })
    await api.post(`/api/catering/events/${booked.id}/confirm`, {})
    await api.post(`/api/catering/events/${booked.id}/tasks`, { title: 'Confirm final guest count' })
    await api.post(`/api/catering/events/${booked.id}/tasks`, { title: 'Buy fresh vegetables' })
    await api.post(`/api/catering/events/${booked.id}/prepare`)
  })
}

// ---------------------------------------------------------------- run
const PLAN = [
  ['retail', 'Aminu Stores (retail): 21 products, customers, suppliers, purchases, sales on credit, expenses, a second branch and transfer, team invitations, online store with orders', seedRetail],
  ['restaurant', 'Royal Kitchen Restaurant: menu, ingredients, tables, menu options, dine-in/takeaway/delivery orders on the kitchen board', seedRestaurant],
  ['bakery', 'Golden Crust Bakery: bread, cakes, pastries, recipe and production run, sales, online store with orders', seedBakery],
  ['catering', 'Fresh Harvest Foods: packages, services, customers and events from enquiry to in preparation', seedCatering],
]
const DESCRIPTIONS = {
  retail: ['Quality groceries and household goods in Ikeja, Lagos. (Demo business)', '14 Allen Avenue, Ikeja, Lagos'],
  restaurant: ['Nigerian dishes, grills and drinks. (Demo business)', '2 Admiralty Way, Lekki, Lagos'],
  bakery: ['Fresh bread, cakes and pastries. (Demo business)', '8 Bodija Market Road, Ibadan'],
  catering: ['Weddings, corporate lunches and events. (Demo business)', '21 Adeola Odeku Street, Victoria Island, Lagos'],
}

try { assertLocalBackend() } catch (e) { console.error(e.message); process.exit(2) }
const chosen = PLAN.filter(([k]) => !only.length || only.includes(k))
log(`ShopScale demo seed  ->  ${API_BASE_URL}${DRY ? '  (dry run: nothing will be changed)' : ''}`)
for (const [key, what, fn] of chosen) {
  const acc = { ...ACCOUNTS[key], description: DESCRIPTIONS[key][0], address: DESCRIPTIONS[key][1] }
  log(`\n== ${what}\n   sign in: ${acc.email}`)
  if (DRY) continue
  try { const api = await session(acc); await fn(api, acc) } catch (e) { failures.push(`${key}: ${e.message}`); log('  FAIL ' + e.message) }
}
log(failures.length ? `\nFinished with ${failures.length} problem(s). Fix the cause and run the seed again; it only adds what is missing:\n - ${failures.join('\n - ')}` : '\nDemo data is ready.')
process.exit(failures.length ? 1 : 0)
