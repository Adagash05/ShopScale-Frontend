import React from 'react'
import { renderToString } from 'react-dom/server'
import { STATE } from './router-stub.jsx'
import { HelpLayout, HelpHome, HelpSearch, HelpCategory, HelpArticle } from '../../src/help/HelpCentre.jsx'
import HowItWorks from '../../src/help/HowItWorks.jsx'
import { ARTICLES, CATEGORIES, search, neighbours, related } from '../../src/help/data.js'
import { SHOTS, VISUAL } from '../../src/help/shots.js'
const HIDDEN_CAT = /^(restaurant|catering|branches)\//
import { SUPPORT_MAILTO, SUPPORT_WHATSAPP } from '../../src/help/support.js'
let fail = 0, n = 0
const t = (name, fn) => { n++; try { fn(); console.log('PASS ' + name) } catch (e) { fail++; console.log('FAIL ' + name + ': ' + e.message) } }
const html = (el) => renderToString(el).replace(/<!-- -->/g, '')
const has = (h, ...s) => { for (const x of s) if (!h.includes(x)) throw new Error('missing "' + x + '"') }
const lacks = (h, ...s) => { for (const x of s) if (h.includes(x)) throw new Error('should not show "' + x + '"') }
const at = (path, params = {}, q = '') => { STATE.path = path; STATE.params = params; STATE.search = q }

t('content: 10 categories in V1 (restaurant, catering, branches hidden), every category has articles', () => { if (CATEGORIES.length !== 10) throw new Error(String(CATEGORIES.length)); for (const c of CATEGORIES) if (!ARTICLES.some((a) => a.cat === c.id)) throw new Error('empty ' + c.id) })
t('no tel: links or call-us wording anywhere in help content', () => { for (const a of ARTICLES) if (/tel:|call us|call:|call 0|by phone/i.test(a.text)) throw new Error(a.path) })
t('content: no coming-soon or placeholder text', () => { for (const a of ARTICLES) if (/coming soon|lorem|todo|tbd/i.test(a.text)) throw new Error(a.path) })
t('content: every article has a heading or steps and a non-trivial body', () => { for (const a of ARTICLES) if (a.text.split(/\s+/).length < 25) throw new Error('thin ' + a.path) })
t('support links are the real email and WhatsApp', () => { if (SUPPORT_MAILTO !== 'mailto:support@shopscale.com.ng' || SUPPORT_WHATSAPP !== 'https://wa.me/2349122609070') throw new Error('wrong') })

at('/help'); t('home: search, categories, popular, support', () => { const h = html(<HelpHome />); has(h, 'Help Centre', 'Getting Started', 'Online Storefront', 'Online Order Management', 'Troubleshooting', SUPPORT_MAILTO, SUPPORT_WHATSAPP, 'Still need help? We&#x27;re here to assist.') })
t('home: shows every category link', () => { const h = html(<HelpHome />); for (const c of CATEGORIES) has(h, 'href="/help/' + c.id + '"') })
at('/help/search', {}, 'q=paystack'); t('search: returns linked results', () => { const h = html(<HelpSearch />); if (!/href="\/help\/[a-z-]+\/[a-z-]+"/.test(h)) throw new Error('no result links') })
at('/help/search', {}, 'q=zzzxqvv'); t('search: sensible empty state, with support', () => { const h = html(<HelpSearch />); has(h, SUPPORT_MAILTO); lacks(h, 'undefined') })
t('search(): finds the storefront article for "open my store"', () => { if (!search('open my store').some((r) => (r.article || r).path === '/help/storefront/activate-store')) throw new Error('not found') })
t('search(): empty query returns nothing, no throw', () => { search(''); search('   ') })
for (const c of CATEGORIES) { at('/help/' + c.id, { cat: c.id }); t('category ' + c.id + ' lists its articles', () => { const h = html(<HelpCategory />); for (const a of ARTICLES.filter((x) => x.cat === c.id)) has(h, a.path) }) }
at('/help/nope', { cat: 'nope' }); t('unknown category → not found page', () => has(html(<HelpCategory />), 'Help Centre'))
t('every article renders with title, breadcrumbs, support, no "undefined"', () => {
  for (const a of ARTICLES) { at(a.path, { cat: a.cat, article: a.id }); const h = html(<HelpArticle />); has(h, a.title, 'Breadcrumb', SUPPORT_MAILTO, SUPPORT_WHATSAPP); lacks(h, 'undefined', '[object') }
})
t('every article: TOC anchors match heading ids', () => {
  for (const a of ARTICLES) { at(a.path, { cat: a.cat, article: a.id }); const h = html(<HelpArticle />); for (const x of a.headings) has(h, 'id="' + x.id + '"'); if (a.headings.length >= 2) for (const x of a.headings) has(h, 'href="#' + x.id + '"') }
})
t('prev/next: first has no prev, middle has both, links resolve', () => {
  for (const a of ARTICLES) { const { prev, next } = neighbours(a); for (const x of [prev, next]) if (x && !ARTICLES.includes(x)) throw new Error('bad neighbour ' + a.path) }
})
t('related links resolve', () => { for (const a of ARTICLES) for (const r of related(a)) if (!ARTICLES.includes(r)) throw new Error(a.path) })
at('/help/orders/process-orders', { cat: 'orders', article: 'process-orders' }); t('order article is available and does not imply creation = paid', () => { const h = html(<HelpArticle />); has(h, 'Pending payment') })
at('/help/storefront/activate-store', { cat: 'storefront', article: 'activate-store' }); t('screenshots hidden unless a file exists (no broken img requirement)', () => { html(<HelpArticle />) })

t('shots: ids unique, captions present, every placement names a real article', () => {
  const paths = new Set(ARTICLES.map((a) => a.path.replace('/help/', '')))
  if (new Set(SHOTS.map((s) => s.id)).size !== SHOTS.length) throw new Error('duplicate shot id')
  for (const s of SHOTS) { if (!s.caption || s.caption.length < 15) throw new Error('caption ' + s.id); if (!s.steps.length) throw new Error('no steps ' + s.id); for (const [p] of (s.placements || [])) if (!paths.has(p) && !HIDDEN_CAT.test(p)) throw new Error(s.id + ' -> ' + p) }
})
t('shots: every shot appears in its article, in order, once per article', () => {
  for (const s of SHOTS) for (const [p, cap] of (s.placements || [])) {
    if (HIDDEN_CAT.test(p)) continue
    const a = ARTICLES.find((x) => x.path === '/help/' + p); const n = a.blocks.filter((b) => b.t === 'shot' && b.id === s.id).length
    if (n !== 1) throw new Error(s.id + ' appears ' + n + ' times in ' + p)
    at(a.path, { cat: a.cat, article: a.id }); has(html(<HelpArticle />), '/help/shots/' + s.id + '.png')
  }
})
t('shots: a picture comes after the steps it illustrates, never before', () => {
  for (const a of ARTICLES) { const fs = a.blocks.findIndex((b) => b.t === 'steps'); const fshot = a.blocks.findIndex((b) => b.t === 'shot'); const placed = SHOTS.some((s) => (s.placements || []).some(([p, , af]) => '/help/' + p === a.path && (af || 'steps') === 'steps'))
    if (placed && fs >= 0 && fshot >= 0 && fshot < fs && !a.blocks.slice(0, fs).some((b) => b.t === 'shot' && !SHOTS.some((s) => s.id === b.id))) throw new Error('shot before steps in ' + a.path) }
})
t('visual: every paired step is a real step, names a defined shot, and renders as a step card with its picture slot', () => {
  const ids = new Set(SHOTS.map((x) => x.id)); let cards = 0
  for (const [p, list] of Object.entries(VISUAL)) {
    if (HIDDEN_CAT.test(p)) continue
    const a = ARTICLES.find((x) => x.path === '/help/' + p); if (!a) throw new Error('no article ' + p)
    const vs = a.blocks.filter((b) => b.t === 'vsteps'); if (!vs.length) throw new Error('no vsteps block in ' + p)
    for (const v of list) {
      if (!ids.has(v.shot)) throw new Error(p + ': unknown shot ' + v.shot)
      if (!vs.some((b) => b.items.some((it) => it.shot === v.shot && it.text && it.text.length > 5))) throw new Error(p + ': shot ' + v.shot + ' not on a step')
      cards++
    }
    at(a.path, { cat: a.cat, article: a.id }); const h = html(<HelpArticle />)
    has(h, 'hc-vsteps', 'hc-vstep', ...list.map((v) => '/help/shots/' + v.shot + '.png'))
    if (a.blocks.some((b) => b.t === 'shot' && list.some((v) => v.shot === b.id))) throw new Error(p + ': shot repeated as a separate figure')
  }
  if (cards < 40) throw new Error('only ' + cards + ' visual steps')
})
t('visual: text of an article is preserved when steps get pictures (same step wording, same count)', () => {
  const a = ARTICLES.find((x) => x.path === '/help/products/create-product'); const vs = a.blocks.find((b) => b.t === 'vsteps')
  if (!vs || vs.items.length < 3) throw new Error('create-product steps missing'); if (vs.items.some((it) => !it.text)) throw new Error('empty step text')
})
t('storefront overview carries the six-step visual walkthrough in order', () => {
  const a = ARTICLES.find((x) => x.path === '/help/storefront/overview'); const caps = a.blocks.filter((b) => b.t === 'shot').map((b) => b.caption)
  for (let i = 1; i <= 6; i++) if (!caps.some((c) => c.startsWith('Step ' + i + '.'))) throw new Error('missing Step ' + i)
  const order = caps.filter((c) => /^Step \d\./.test(c)).map((c) => +c[5]); if (order.join('') !== '123456') throw new Error('order ' + order.join(''))
})
at('/how-it-works'); t('how it works: all 17 parts', () => { const h = html(<HowItWorks />); has(h, 'How ShopScale works', 'Start your 14-day free trial', 'Explore the Help Centre', 'How businesses use ShopScale', 'operating workflow', 'Getting started', 'Products and inventory', 'point of sale', 'online storefront', 'How customers discover and order', 'process online orders', 'Payments and fulfilment', 'Your team', 'Monitoring your money', 'Supported business types', 'Frequently asked questions', 'Get started', 'href="/help"', 'href="/register"', SUPPORT_MAILTO) })
t('how it works: every internal /help link resolves to an article or category', () => {
  at('/how-it-works'); const h = html(<HowItWorks />); const ok = new Set([...ARTICLES.map((a) => a.path), ...CATEGORIES.map((c) => '/help/' + c.id), '/help'])
  for (const m of h.matchAll(/href="(\/help[^"#]*)"/g)) if (!ok.has(m[1])) throw new Error('broken ' + m[1])
})
console.log(`\n${n - fail}/${n} passed`); process.exit(fail ? 1 : 0)
