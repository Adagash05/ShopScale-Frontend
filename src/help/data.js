import gettingStarted from './content/gettingStarted.js'
import { SHOTS } from './shots.js'
import products from './content/products.js'
import storefront from './content/storefront.js'
import orders from './content/orders.js'
import sales from './content/sales.js'
import purchasing from './content/purchasing.js'
import restaurant from './content/restaurant.js'
import catering from './content/catering.js'
import employees from './content/employees.js'
import branches from './content/branches.js'
import finance from './content/finance.js'
import settings from './content/settings.js'
import troubleshooting from './content/troubleshooting.js'

/**
 * Help Centre content. Order here is the order in the sidebar and for previous/next.
 * Every article describes behaviour that exists in the application today (checked against the screens and the API).
 * Block types: p, h (section heading, appears in the table of contents), steps, list, tip, warn, shot (real screenshot, only shown when the image file exists), illus (labelled illustration).
 */
export const CATEGORIES = [gettingStarted, products, storefront, orders, sales, purchasing, restaurant, catering, employees, branches, finance, settings, troubleshooting]

export const WORDS_PER_MINUTE = 200

const strip = (t) => String(t || '').replace(/\*\*|\[([^\]]+)\]\([^)]+\)/g, '$1')

function blockText(b) {
  if (b.t === 'steps' || b.t === 'list') return b.items.map(strip).join(' ')
  return strip(b.text || b.caption || '')
}

export function slugify(t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

/**
 * Puts each screenshot from shots.js into its article, right after the first numbered steps (or the first paragraph), so the picture
 * follows the instructions it illustrates. A screenshot the article already carries is not added twice.
 */
export function withShots(articlePath, blocks) {
  const wanted = SHOTS.flatMap((s) => s.placements.filter(([p]) => p === articlePath).map(([, caption, after]) => ({ block: shotBlock(s.id, caption || s.caption), after: after || 'steps' })))
    .filter((w) => !blocks.some((b) => b.t === 'shot' && b.id === w.block.id))
  if (!wanted.length) return blocks
  const firstSteps = blocks.findIndex((b) => b.t === 'steps')
  const firstPara = blocks.findIndex((b) => b.t === 'p')
  const anchor = (after) => (after === 'end' ? blocks.length - 1 : after === 'start' ? firstPara : firstSteps >= 0 ? firstSteps : firstPara)
  const at = new Map()
  for (const w of wanted) { const k = Math.max(anchor(w.after), -1); at.set(k, [...(at.get(k) || []), w.block]) }
  const out = [...(at.get(-1) || [])]
  blocks.forEach((b, i) => { out.push(b); out.push(...(at.get(i) || [])) })
  return out
}
const shotBlock = (id, caption) => ({ t: 'shot', id, caption })

export const ARTICLES = CATEGORIES.flatMap((c) => c.articles.map((raw) => {
  const a = { ...raw, blocks: withShots(`${c.id}/${raw.id}`, raw.blocks) }
  const text = a.blocks.map(blockText).join(' ')
  return {
    ...a, cat: c.id, catTitle: c.title, path: `/help/${c.id}/${a.id}`, text,
    headings: a.blocks.filter((b) => b.t === 'h').map((b) => ({ id: slugify(b.text), text: b.text })),
    minutes: Math.max(1, Math.round(text.split(/\s+/).length / WORDS_PER_MINUTE)),
  }
}))

export const byPath = Object.fromEntries(ARTICLES.map((a) => [`${a.cat}/${a.id}`, a]))
export const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

export function neighbours(article) {
  const i = ARTICLES.findIndex((a) => a.cat === article.cat && a.id === article.id)
  return { prev: i > 0 ? ARTICLES[i - 1] : null, next: i >= 0 && i < ARTICLES.length - 1 ? ARTICLES[i + 1] : null }
}

export function related(article) {
  return (article.related || []).map((k) => byPath[k]).filter(Boolean)
}

/** Client-side search: every word must match (prefix match allowed); title, description, headings and body are weighted. */
export function search(query, limit = 30) {
  const words = String(query || '').toLowerCase().split(/[^a-z0-9₦]+/).filter((w) => w.length > 1)
  if (!words.length) return []
  const out = []
  for (const a of ARTICLES) {
    const title = a.title.toLowerCase(), desc = (a.desc || '').toLowerCase(), heads = a.headings.map((h) => h.text).join(' ').toLowerCase(), body = a.text.toLowerCase(), kw = (a.keywords || '').toLowerCase()
    let score = 0, ok = true
    for (const w of words) {
      let s = 0
      if (title.includes(w)) s += title.startsWith(w) ? 14 : 10
      if (kw.includes(w)) s += 8
      if (desc.includes(w)) s += 5
      if (heads.includes(w)) s += 4
      if (body.includes(w)) s += 1 + Math.min(3, (body.split(w).length - 1) * 0.3)
      if (!s) { ok = false; break }
      score += s
    }
    if (ok) out.push({ article: a, score })
  }
  return out.sort((x, y) => y.score - x.score).slice(0, limit).map((r) => r.article)
}

/** A short excerpt around the first match so a result shows why it matched. */
export function excerpt(article, query) {
  const w = String(query || '').toLowerCase().split(/[^a-z0-9₦]+/).filter((x) => x.length > 1)[0]
  const t = article.text
  const i = w ? t.toLowerCase().indexOf(w) : -1
  if (i < 0) return article.desc
  const start = Math.max(0, i - 50)
  return (start > 0 ? '… ' : '') + t.slice(start, start + 150).trim() + (start + 150 < t.length ? ' …' : '')
}

export const POPULAR = ['storefront/activate-store', 'storefront/add-products', 'orders/process-orders', 'products/create-product', 'sales/make-a-sale', 'getting-started/first-steps']
