import http from 'node:http'; import fs from 'node:fs'
const O = 'http://localhost:8080'
const img = (n) => `${O}/img/${n}.svg`
let vid = 0
const P = (productId, name, category, price, o = {}) => ({ productId, name, category, price, ...o })
const mkItems = (defs) => defs.flatMap((d) => (d.variants || [{ label: null, price: d.price }]).map((v) => ({ variantId: `v${++vid}-${d.productId}`, productId: d.productId, name: d.name, label: v.label, description: d.description || '', price: String(v.price), inStock: v.stock !== false, available: v.av ?? 12, unit: 'piece', allowDecimal: false, imageUrl: d.img ? img(d.img) : null, categoryId: d.category ? 'cat-' + d.category : null, categoryName: d.category || null, createdAt: d.at || '2026-05-01T00:00:00Z' })))
const stores = {
  'ada-fashion': {
    info: { slug: 'ada-fashion', name: 'Ada Fashion House', title: 'Ada Fashion House', description: 'Contemporary Nigerian fashion made with care in Lagos. Ankara, lace and everyday essentials, cut to fit and finished by hand.', phone: '0803 123 4567', whatsapp: '08031234567', pickup: true, delivery: true, deliveryFee: '1500', deliveryNote: 'Lagos deliveries in 1-2 days.', payOnline: true, payLater: true, businessType: 'RETAIL', subtype: 'fashion', email: 'hello@adafashion.ng', address: '12 Adeola Odeku Street, Victoria Island, Lagos' },
    items: mkItems([
      P('p1', 'Ankara Shirt', 'Men', 9000, { img: 1, at: '2026-09-01T00:00:00Z', description: 'A relaxed-fit shirt in a bold Ankara print.', variants: [{ label: 'S', price: 8500 }, { label: 'M', price: 9000 }, { label: 'L', price: 9500, stock: false }] }),
      P('p2', 'Linen Trousers', 'Men', 14000, { img: 2, at: '2026-08-01T00:00:00Z' }),
      P('p3', 'Lace Gown', 'Women', 38000, { img: 3, at: '2026-10-01T00:00:00Z', variants: [{ label: '10', price: 38000 }, { label: '12', price: 38000 }] }),
      P('p4', 'Adire Wrap Skirt', 'Women', 16500, { img: 4, at: '2026-10-05T00:00:00Z' }),
      P('p5', 'Leather Tote', 'Bags', 25000, { img: 5, at: '2026-07-01T00:00:00Z' }),
      P('p6', 'Beaded Clutch', 'Bags', 12000, { img: 6, at: '2026-06-01T00:00:00Z', stock: false, variants: [{ label: null, price: 12000, stock: false }] }),
      P('p7', 'Silk Head Wrap', 'Accessories', 4500, { at: '2026-10-09T00:00:00Z' }),
      P('p8', 'Brass Cuff', 'Accessories', 7000, { img: 7, at: '2026-04-01T00:00:00Z' }),
      P('p9', 'Agbada Set With A Rather Long Product Name That Should Wrap Gracefully', 'Men', 85000, { img: 8, at: '2026-10-10T00:00:00Z' }),
    ]),
  },
  'mama-put': {
    info: { slug: 'mama-put', name: 'Mama Put Kitchen', title: 'Mama Put Kitchen', description: null, phone: '0809 555 0101', whatsapp: null, pickup: true, delivery: false, deliveryFee: '0', deliveryNote: null, payOnline: false, payLater: true, businessType: 'RESTAURANT', subtype: null, email: null, address: null },
    items: mkItems([
      P('m1', 'Jollof Rice & Chicken', 'Rice', 3500, { img: 2, description: 'Smoky party jollof with grilled chicken and fried plantain.' }),
      P('m2', 'Fried Rice & Turkey', 'Rice', 4500, { description: 'Mixed vegetables, turkey and a side of coleslaw.' }),
      P('m3', 'Egusi Soup & Pounded Yam', 'Soups', 4000, { img: 4, description: 'Rich melon seed soup with assorted meat.' }),
      P('m4', 'Pepper Soup', 'Soups', 3000, { variants: [{ label: 'Goat', price: 3000 }, { label: 'Catfish', price: 3500 }] }),
      P('m5', 'Zobo', 'Drinks', 1000, { img: 6 }),
    ]),
  },
  'new-shop': { info: { slug: 'new-shop', name: 'New Shop', title: 'New Shop', description: null, phone: null, whatsapp: null, pickup: true, delivery: false, deliveryFee: '0', deliveryNote: null, payOnline: false, payLater: true, businessType: 'RETAIL', subtype: null, email: null, address: null }, items: [] },
}
const orders = {}

const A = stores['ada-fashion']
Object.assign(A.info, { logoUrl: O + '/img/logo.svg', instagramUrl: 'https://instagram.com/adafashionhouse', facebookUrl: 'https://facebook.com/adafashionhouse', openingHours: 'Mon-Sat 9am-6pm\nSun closed' })
for (const it of A.items) {
  if (it.productId === 'p2') it.compareAtPrice = '18000'
  if (it.productId === 'p3') { it.images = [O + '/img/3.svg', O + '/img/4.svg', O + '/img/5.svg']; it.specs = 'Material: French lace\nLength: Floor length\nCare: Dry clean only' }
  if (it.productId === 'p1') { it.ratingAvg = 4.5; it.ratingCount = 2 }
}
const M = stores['mama-put']
const PROT = { id: 'g-prot', name: 'Protein', required: true, maxSelect: 1, options: [{ id: 'o-chk', name: 'Chicken', priceDelta: '1500' }, { id: 'o-beef', name: 'Beef', priceDelta: '1800' }] }
const SIDES = { id: 'g-side', name: 'Sides', required: false, maxSelect: 2, options: [{ id: 'o-pl', name: 'Plantain', priceDelta: '500' }, { id: 'o-sal', name: 'Salad', priceDelta: '700' }, { id: 'o-egg', name: 'Egg', priceDelta: '300' }] }
for (const it of M.items) if (it.productId === 'm1') it.optionGroups = [PROT, SIDES]
stores['zuri-events'] = { info: { slug: 'zuri-events', name: 'Zuri Events Catering', title: 'Zuri Events Catering', description: 'Weddings, birthdays and corporate events.', phone: '0807 000 1122', whatsapp: null, pickup: true, delivery: true, deliveryFee: '5000', deliveryNote: null, payOnline: false, payLater: true, businessType: 'CATERING', subtype: null, email: 'hello@zuri.example', address: '12 Admiralty Way, Lekki' }, items: mkItems([P('c1', 'Small Party Pack (20 guests)', 'Packages', 150000), P('c2', 'Wedding Package (100 guests)', 'Packages', 650000)]) }
const subs = {}, enq = {}, revs = {}
const body = (req) => new Promise((r) => { let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => r(b ? JSON.parse(b) : {})) })
const colors = ['#c9a27e', '#7a8f7a', '#b36a5e', '#6f7fa3', '#d0b48a', '#8c6f8f', '#5f8a8b', '#a08060']
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }
const json = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json', ...cors }); res.end(JSON.stringify(body)) }
http.createServer((req, res) => {
  const u = new URL(req.url, O); const p = u.pathname
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end() }
  let m
  if ((m = p.match(/^\/img\/(\d+)\.svg$/))) { const c = colors[(+m[1] - 1) % 8]; res.writeHead(200, { 'Content-Type': 'image/svg+xml', ...cors }); return res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#2b2b2b" stop-opacity=".55"/></linearGradient></defs><rect width="800" height="1000" fill="url(#g)"/><circle cx="400" cy="420" r="170" fill="#fff" opacity=".18"/><rect x="250" y="620" width="300" height="180" fill="#fff" opacity=".12"/></svg>`) }
  if ((m = p.match(/^\/api\/public\/store\/([^/]+)$/))) { const s = stores[m[1]]; return s ? json(res, 200, s.info) : json(res, 404, { message: 'Store not found' }) }
  if ((m = p.match(/^\/api\/public\/store\/([^/]+)\/products$/))) { const s = stores[m[1]]; return s ? json(res, 200, s.items) : json(res, 404, { message: 'Store not found' }) }
  if ((m = p.match(/^\/img\/logo\.svg$/))) { res.writeHead(200, { 'Content-Type': 'image/svg+xml', ...cors }); return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40" fill="#7a3b2e"/><text x="60" y="26" fill="#fff" font-size="16" text-anchor="middle">ADA</text></svg>') }
  if ((m = p.match(/^\/api\/test\/(complete|approve)\/(.+)$/))) { if (m[1] === 'complete') orders[m[2]].status = 'COMPLETED'; else for (const r of Object.values(revs)) for (const x of r) x.status = 'APPROVED'; return json(res, 200, {}) }
  if (p === '/api/test/state') return json(res, 200, { subs, enq, revs, orders })
  if ((m = p.match(/^\/api\/public\/store\/([^/]+)\/(reviews|testimonials|subscribe|enquiries|orders\/lookup)$/)) && stores[m[1]]) {
    const slug = m[1], what = m[2]
    return body(req).then((b) => {
      if (what === 'subscribe') { if (!/@/.test(b.email || '')) return json(res, 400, { message: 'Enter a valid email' }); subs[slug] = [...new Set([...(subs[slug] || []), b.email.toLowerCase()])]; return json(res, 200, { status: 'SUBSCRIBED' }) }
      if (what === 'enquiries') { if (!b.name || !b.phone || !b.message) return json(res, 400, { message: 'Missing fields' }); (enq[slug] ||= []).push(b); return json(res, 200, { status: 'RECEIVED' }) }
      if (what === 'orders/lookup') { const o = Object.values(orders).find((x) => x.slug === slug && x.number === b.number && x._body.phone.replace(/\D/g, '').endsWith(String(b.phone).replace(/\D/g, '').slice(-10))); return o ? json(res, 200, o) : json(res, 404, { message: 'We could not find an order with that number and phone' }) }
      if (what === 'testimonials') return json(res, 200, (revs[slug] || []).filter((x) => x.status === 'APPROVED' && x.rating >= 4).map((x) => ({ id: x.id, author: x.author, rating: x.rating, body: x.body, productName: 'Ankara Shirt' })))
      if (req.method === 'GET') return json(res, 200, (revs[slug] || []).filter((x) => x.status === 'APPROVED' && x.productId === u.searchParams.get('productId')).map((x) => ({ id: x.id, author: x.author, rating: x.rating, body: x.body, createdAt: new Date().toISOString() })))
      const o = orders[b.token]; if (!o || o.slug !== slug) return json(res, 404, { message: 'Order not found' })
      if (o.status !== 'COMPLETED') return json(res, 409, { message: 'You can review an item once your order has been completed' })
      if ((revs[slug] ||= []).some((x) => x.token === b.token && x.productId === b.productId)) return json(res, 409, { message: 'You have already reviewed this item' })
      revs[slug].push({ id: 'r' + revs[slug].length, token: b.token, productId: b.productId, author: o._body.customerName.split(' ')[0], rating: b.rating, body: b.body, status: 'PENDING' }); return json(res, 200, { status: 'PENDING' })
    })
  }
  if ((m = p.match(/^\/api\/public\/store\/([^/]+)\/orders$/)) && req.method === 'POST') {
    return body(req).then((b) => {
      const s = stores[m[1]]; if (!s) return json(res, 404, { message: 'Store not found' })
      const items = []
      for (const i of b.items) {
        const it = s.items.find((x) => x.variantId === i.variantId); if (!it) return json(res, 400, { message: 'An item in your cart is no longer available' })
        const opts = (i.options || []).map((id) => (it.optionGroups || []).flatMap((g) => g.options).find((o) => o.id === id)); if (opts.some((o) => !o)) return json(res, 400, { message: 'An option you chose is no longer available' })
        for (const g of it.optionGroups || []) { const n = g.options.filter((o) => (i.options || []).includes(o.id)).length; if (g.required && !n) return json(res, 400, { message: 'Choose ' + g.name }); if (n > g.maxSelect) return json(res, 400, { message: 'Too many ' + g.name }) }
        const unit = Number(it.price) + opts.reduce((n, o) => n + Number(o.priceDelta), 0)
        items.push({ variantId: i.variantId, productId: it.productId, name: it.name + (opts.length ? ' + ' + opts.map((o) => o.name).join(', ') : ''), quantity: i.quantity, unitPrice: String(unit), lineTotal: String(unit * i.quantity) })
      }
      const sub = items.reduce((n, i) => n + Number(i.lineTotal), 0); const fee = b.deliveryMethod === 'DELIVERY' ? Number(s.info.deliveryFee) : 0; const n = Object.keys(orders).length
      const token = 'tok' + n; orders[token] = { id: token, slug: m[1], number: 1001 + n, token, status: 'NEW', paymentMode: b.paymentMode, paymentStatus: 'UNPAID', deliveryMethod: b.deliveryMethod, subtotal: String(sub), deliveryFee: String(fee), total: String(sub + fee), createdAt: new Date().toISOString(), items, storeName: s.info.name, _body: b }
      json(res, 200, { token, status: 'NEW', paymentMode: b.paymentMode, authorizationUrl: null })
    })
  }
  if ((m = p.match(/^\/api\/public\/store\/([^/]+)\/orders$/)) && req.method === 'POST') {
    let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => { const body = JSON.parse(b); const s = stores[m[1]]; const items = body.items.map((i) => { const it = s.items.find((x) => x.variantId === i.variantId); return { variantId: i.variantId, name: it.name, quantity: i.quantity, unitPrice: it.price, lineTotal: String(Number(it.price) * i.quantity) } }); const sub = items.reduce((n, i) => n + Number(i.lineTotal), 0); const fee = body.deliveryMethod === 'DELIVERY' ? Number(s.info.deliveryFee) : 0; const token = 'tok' + Object.keys(orders).length; orders[token] = { id: token, number: 1001 + Object.keys(orders).length, token, status: 'NEW', paymentMode: body.paymentMode, paymentStatus: 'UNPAID', deliveryMethod: body.deliveryMethod, subtotal: String(sub), deliveryFee: String(fee), total: String(sub + fee), createdAt: new Date().toISOString(), items, storeName: s.info.name, _body: body }; json(res, 200, { token, status: 'NEW', paymentMode: body.paymentMode, authorizationUrl: null }) }); return
  }
  if ((m = p.match(/^\/api\/public\/orders\/([^/]+)(\/verify)?$/))) { const o = orders[m[1]]; return o ? json(res, 200, o) : json(res, 404, { message: 'Order not found' }) }
  if (p.startsWith('/api/')) return json(res, 404, { message: 'nope' })
  if (p === '/entry.js' || p === '/entry.css') { res.writeHead(200, { 'Content-Type': p.endsWith('js') ? 'text/javascript' : 'text/css' }); return res.end(fs.readFileSync('/tmp/sfh/dist' + p)) }
  res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>t</title><link rel="stylesheet" href="/entry.css"></head><body style="margin:0"><div id="root"></div><script src="/entry.js"></script></body></html>')
}).listen(8080, () => console.log('mock up'))
