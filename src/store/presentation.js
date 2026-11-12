// Everything the storefront decides from real data, in one place. Pure functions (tested in scripts/store-verify.mjs).
// Design is centrally controlled: merchants supply content (name, products, contact details, delivery settings); nothing here is merchant-configurable.

/**
 * Industry-aware presentation. Same components and design language for every type; only wording, the product layout and a restrained accent differ.
 * layout: 'grid' (photo-led shopping) or 'menu' (grouped list, for food and catering).
 */
const TYPES = {
  RETAIL:      { key: 'retail',     layout: 'grid', accent: '#1c3556', shop: 'Shop',     all: 'All products', add: 'Add to cart',  cta: 'Shop now',     eyebrow: 'Online store',   lead: 'Browse our products and order online.' },
  WHOLESALE:   { key: 'wholesale',  layout: 'grid', accent: '#1c3556', shop: 'Shop',     all: 'All products', add: 'Add to cart',  cta: 'Shop now',     eyebrow: 'Wholesale',      lead: 'Browse our range and order online.' },
  PRODUCTION:  { key: 'production', layout: 'grid', accent: '#2f4a3a', shop: 'Products', all: 'All products', add: 'Add to cart',  cta: 'Shop now',     eyebrow: 'Made by us',     lead: 'Order what we make, directly from us.' },
  RESTAURANT:  { key: 'restaurant', layout: 'menu', accent: '#8a3b1b', shop: 'Menu',     all: 'Full menu',    add: 'Add to order', cta: 'Order now',    eyebrow: 'Order online',   lead: 'See the menu and order for pickup or delivery.' },
  SMALL_CHOPS: { key: 'chops',      layout: 'menu', accent: '#8a3b1b', shop: 'Menu',     all: 'Full menu',    add: 'Add to order', cta: 'Order now',    eyebrow: 'Order online',   lead: 'See what is available and place your order.' },
  CATERING:    { key: 'catering',   layout: 'menu', accent: '#5b2c4d', shop: 'Packages', all: 'All packages', add: 'Add to order', cta: 'Order now',    eyebrow: 'Catering',       lead: 'Choose from what we offer and place your order.' },
  LIVESTOCK:   { key: 'livestock',  layout: 'grid', accent: '#3f5b2c', shop: 'Listings', all: 'All listings', add: 'Add to cart',  cta: 'View listings', eyebrow: 'Farm listings', lead: 'See what is available and order directly from the farm.' },
}
export const presentation = (type) => TYPES[String(type || '').toUpperCase()] || { ...TYPES.RETAIL, key: 'general' }

/** One card per product; its variants (sizes, flavours...) become options on the product page. */
export function groupProducts(items = []) {
  const map = new Map()
  for (const i of items) {
    let p = map.get(i.productId)
    if (!p) {
      const gallery = Array.isArray(i.images) ? i.images : []
      p = {
        id: i.productId, name: i.name, description: i.description || '', imageUrl: i.imageUrl || null, categoryId: i.categoryId || null, categoryName: i.categoryName || null, createdAt: i.createdAt || null,
        images: [...new Set([i.imageUrl, ...gallery].filter(Boolean))], specs: specsList(i.specs), ratingAvg: i.ratingAvg ?? null, ratingCount: Number(i.ratingCount) || 0,
        optionGroups: Array.isArray(i.optionGroups) ? i.optionGroups : [], variants: [],
      }
      map.set(i.productId, p)
    }
    p.variants.push(i)
  }
  const out = [...map.values()]
  for (const p of out) {
    p.variants.sort((a, b) => Number(a.price) - Number(b.price))
    const prices = p.variants.map((v) => Number(v.price))
    p.minPrice = Math.min(...prices)
    p.maxPrice = Math.max(...prices)
    p.inStock = p.variants.some((v) => v.inStock)
    p.single = p.variants.length === 1
    p.hasOptions = p.optionGroups.length > 0
    // A sale is shown only when the server says the original price is higher than what is charged.
    const was = p.variants.filter((v) => Number(v.compareAtPrice) > Number(v.price))
    p.onSale = was.length > 0
    p.compareAt = p.onSale ? Math.min(...was.map((v) => Number(v.compareAtPrice))) : null
  }
  return out
}

/** "Label: value" lines to [label, value] pairs. */
export function specsList(text) {
  return String(text || '').split(/\r?\n/).map((l) => { const i = l.indexOf(':'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : null }).filter((x) => x && x[0] && x[1])
}

/** Percent off for a struck-through price, rounded; '' when there is no sale. */
export function discountLabel(price, compareAt) {
  const p = Number(price), c = Number(compareAt)
  return c > p && p > 0 ? `${Math.round((1 - p / c) * 100)}% off` : ''
}

export function categoriesOf(products) {
  const m = new Map()
  for (const p of products) if (p.categoryId && p.categoryName) {
    const c = m.get(p.categoryId) || { id: p.categoryId, name: p.categoryName, count: 0, imageUrl: null }
    c.count += 1
    if (!c.imageUrl && p.imageUrl) c.imageUrl = p.imageUrl
    m.set(p.categoryId, c)
  }
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function filterProducts(products, { q = '', category = '', inStockOnly = false } = {}) {
  const term = q.trim().toLowerCase()
  return products.filter((p) => (!category || p.categoryId === category)
    && (!inStockOnly || p.inStock)
    && (!term || `${p.name} ${p.categoryName || ''} ${p.description} ${p.variants.map((v) => v.label || '').join(' ')}`.toLowerCase().includes(term)))
}

export const SORTS = [['featured', 'Featured'], ['new', 'Newest'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['name', 'Name A-Z']]
export function sortProducts(products, sort = 'featured') {
  const a = [...products]
  const stockFirst = (x, y) => Number(y.inStock) - Number(x.inStock)
  if (sort === 'new') a.sort((x, y) => String(y.createdAt || '').localeCompare(String(x.createdAt || '')) || stockFirst(x, y))
  else if (sort === 'low') a.sort((x, y) => x.minPrice - y.minPrice)
  else if (sort === 'high') a.sort((x, y) => y.minPrice - x.minPrice)
  else if (sort === 'name') a.sort((x, y) => x.name.localeCompare(y.name))
  else a.sort((x, y) => stockFirst(x, y) || (Number(!!y.imageUrl) - Number(!!x.imageUrl)))   // featured: available and photographed products first
  return a
}

/** Largest quantity a customer may add; matches the rule the original storefront used (decimal units and negative-stock stores are not capped). */
export function maxQty(item) {
  if (item.allowDecimal) return Infinity
  const n = Math.floor(Number(item.available) || 0)
  return n > 0 ? n : Infinity
}
export function clampQty(item, qty) { return Math.min(qty, maxQty(item)) }

/** A cart entry is a variant id, or `variantId~optionId.optionId` when paid menu options were chosen (sorted, so equal choices share a line). */
export const cartKey = (variantId, optionIds = []) => (optionIds.length ? `${variantId}~${[...optionIds].sort().join('.')}` : variantId)
export function parseKey(key) {
  const [variantId, rest] = String(key).split('~')
  return { variantId, optionIds: rest ? rest.split('.').filter(Boolean) : [] }
}

/** Checks the customer's choices against the product's option groups. Returns '' when fine, otherwise a message. The server checks again. */
export function optionsError(groups = [], chosen = []) {
  const set = new Set(chosen)
  for (const g of groups) {
    const n = g.options.filter((o) => set.has(o.id)).length
    if (g.required && n === 0) return `Choose ${g.name}`
    if (n > g.maxSelect) return `Choose at most ${g.maxSelect} for ${g.name}`
  }
  return ''
}
export const optionsExtra = (groups = [], chosen = []) => groups.flatMap((g) => g.options).filter((o) => chosen.includes(o.id)).reduce((n, o) => n + Number(o.priceDelta), 0)

/** Cart lines from the stored cart {key: qty} and the live catalogue. `missing` are cart entries whose product, option or stock is gone. */
export function cartLines(cart, byId) {
  const lines = []
  let missing = 0
  for (const [key, qty] of Object.entries(cart || {})) {
    const { variantId, optionIds } = parseKey(key)
    const item = byId[variantId]
    if (!item || !item.inStock) { missing += 1; continue }
    const all = (item.optionGroups || []).flatMap((g) => g.options)
    const options = optionIds.map((id) => all.find((o) => o.id === id))
    if (options.some((o) => !o) || optionsError(item.optionGroups, optionIds)) { missing += 1; continue }
    const unit = Number(item.price) + options.reduce((n, o) => n + Number(o.priceDelta), 0)
    lines.push({ id: key, qty: Math.min(Number(qty), maxQty(item)), item, optionIds, options, unit })
  }
  const subtotal = lines.reduce((n, l) => n + l.qty * l.unit, 0)
  return { lines, missing, subtotal, count: lines.reduce((n, l) => n + l.qty, 0) }
}

const naira = (n) => `₦${Number(n).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`

/** The announcement bar: only facts from the store's real settings. Returns '' when there is nothing true to say. */
export function announcement(info) {
  if (!info) return ''
  const parts = []
  if (info.delivery) parts.push(Number(info.deliveryFee) > 0 ? `Delivery available (${naira(info.deliveryFee)})` : 'Delivery available')
  if (info.pickup) parts.push('Pickup available')
  if (info.payOnline) parts.push('Pay securely online')
  else if (info.payLater) parts.push(`Pay on ${info.delivery && !info.pickup ? 'delivery' : 'pickup'}`)
  return parts.join('  ·  ')
}

/** Short reassurance points; each exists only if the matching capability is really switched on. */
export function trustPoints(info) {
  const t = []
  if (info.payOnline) t.push(['Secure online payment', 'Pay by card or bank transfer. Payments are processed by Paystack.'])
  if (info.payLater) t.push([`Pay on ${info.delivery && !info.pickup ? 'delivery' : 'pickup'}`, 'Prefer to pay when you receive your order? You can.'])
  if (info.delivery) t.push(['Delivery', info.deliveryNote || (Number(info.deliveryFee) > 0 ? `Delivery fee ${naira(info.deliveryFee)}.` : 'We deliver to you.')])
  if (info.pickup) t.push(['Pickup', 'Collect your order from the business.'])
  if (info.whatsapp || info.phone) t.push(['Questions?', 'Talk to the business directly before or after you order.'])
  return t.slice(0, 4)
}

export const digits = (s) => String(s || '').replace(/\D/g, '')
/** wa.me link for the store's own WhatsApp number (Nigerian numbers starting with 0 are given the 234 country code). */
export function whatsappLink(info, text = '') {
  let d = digits(info?.whatsapp)
  if (!d) return null
  if (d.startsWith('0')) d = '234' + d.slice(1)
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** Contact details that really exist, in display order. */
export function contactLines(info) {
  const out = []
  if (info?.phone) out.push({ kind: 'phone', label: info.phone, href: `tel:${info.phone.replace(/\s+/g, '')}` })
  if (info?.whatsapp) out.push({ kind: 'whatsapp', label: `WhatsApp ${info.whatsapp}`, href: whatsappLink(info) })
  if (info?.email) out.push({ kind: 'email', label: info.email, href: `mailto:${info.email}` })
  if (info?.address) out.push({ kind: 'address', label: info.address, href: null })
  return out
}

/** Social links that were really configured by the merchant (https links only). */
export function socialLinks(info) {
  const out = []
  const add = (label, url) => { if (typeof url === 'string' && /^https:\/\//i.test(url)) out.push({ label, href: url }) }
  add('Instagram', info?.instagramUrl); add('Facebook', info?.facebookUrl); add('X', info?.xUrl); add('TikTok', info?.tiktokUrl)
  return out
}
export const hoursLines = (info) => String(info?.openingHours || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

/** Frequently asked questions answered from the store's actual settings (no invented policies). */
export function faqFor(info, p) {
  const f = []
  f.push(['How do I place an order?', `Add ${p.layout === 'menu' ? 'items' : 'products'} to your cart, open the cart, then checkout with your name and phone number. You will see an order page that you can come back to at any time.`])
  const pay = []
  if (info.payOnline) pay.push('pay online by card or bank transfer (processed securely by Paystack)')
  if (info.payLater) pay.push(`pay when you ${info.delivery && !info.pickup ? 'receive' : 'collect'} your order`)
  if (pay.length) f.push(['How can I pay?', `You can ${pay.join(' or ')}. The options available are shown at checkout.`])
  const way = []
  if (info.delivery) way.push(Number(info.deliveryFee) > 0 ? `delivery (fee ${naira(info.deliveryFee)})` : 'delivery')
  if (info.pickup) way.push('pickup')
  if (way.length) f.push(['Do you deliver?', `This store offers ${way.join(' and ')}. ${info.deliveryNote || ''}`.trim()])
  f.push(['How will I know my order went through?', 'After you order you are taken to your order page, which shows its status. Orders paid online show as paid only after the payment is confirmed with Paystack.'])
  f.push(['Can I change or cancel my order?', `Contact ${info.name} as soon as possible${info.phone ? ` on ${info.phone}` : ''}. Changes depend on whether the order has already been prepared.`])
  return f
}

/** Orders placed from this device, kept so customers can find them again (there are no customer accounts). */
export const ordersKey = (slug) => `shopscale.orders.${slug}`
export function readOrders(storage, slug) { try { const v = JSON.parse(storage.getItem(ordersKey(slug))); return Array.isArray(v) ? v : [] } catch { return [] } }
export function rememberOrder(storage, slug, token, now = Date.now()) {
  try {
    const list = readOrders(storage, slug).filter((o) => o.token !== token)
    list.unshift({ token, at: now })
    storage.setItem(ordersKey(slug), JSON.stringify(list.slice(0, 30)))
  } catch { /* private mode */ }
}
