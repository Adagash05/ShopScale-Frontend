/**
 * Google Analytics 4 for ShopScale's OWN application pages only.
 *
 * - Off unless VITE_GA_MEASUREMENT_ID is set to a valid "G-XXXXXXXX" id. Without it every function is a harmless no-op.
 * - Consent first: the Google tag is NOT downloaded, and nothing is sent, until the visitor accepts analytics.
 *   "Decline", Do Not Track and Global Privacy Control all keep it off.
 * - Public merchant storefronts (/s/...) are never tracked, so one merchant's shoppers never reach ShopScale's property.
 * - Event parameters go through an allowlist and a PII filter. No emails, phone numbers, names, record contents or sale amounts.
 * - Analytics can never throw into business code: every public function swallows its own errors.
 */
const ID = String(import.meta.env?.VITE_GA_MEASUREMENT_ID || '').trim()
const VALID = /^G-[A-Z0-9]{4,20}$/.test(ID)
const CONSENT_KEY = 'shopscale.analytics.consent'
const SENT_KEY = 'shopscale.analytics.sent'
const DEDUPE_MS = 1500

let loaded = false
let lastPath = null
const recent = new Map()
const listeners = new Set()

const store = {
  get(k) { try { return localStorage.getItem(k) } catch { return null } },
  set(k, v) { try { localStorage.setItem(k, v) } catch { /* private mode */ } },
}

export const analyticsConfigured = () => VALID

function privacySignal() {
  try { return navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true } catch { return false }
}

/** 'granted' | 'denied' | null (not asked yet) */
export function getConsent() {
  if (!VALID) return 'denied'
  if (privacySignal()) return 'denied'
  const v = store.get(CONSENT_KEY)
  return v === 'granted' || v === 'denied' ? v : null
}

export function onConsentChange(fn) { listeners.add(fn); return () => listeners.delete(fn) }

export function setConsent(value) {
  try {
    if (!VALID) return
    const v = value === 'granted' ? 'granted' : 'denied'
    store.set(CONSENT_KEY, v)
    if (v === 'granted') load()
    else disable()
    listeners.forEach((fn) => { try { fn(v) } catch { /* ignore */ } })
  } catch { /* never break the app */ }
}

function disable() {
  try {
    window[`ga-disable-${ID}`] = true
    if (typeof window.gtag === 'function') window.gtag('consent', 'update', { analytics_storage: 'denied' })
  } catch { /* ignore */ }
}

function load() {
  if (loaded || !VALID || typeof document === 'undefined') return
  loaded = true
  window[`ga-disable-${ID}`] = false
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() { window.dataLayer.push(arguments) } // eslint-disable-line prefer-rest-params
  window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
  window.gtag('js', new Date())
  window.gtag('config', ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false })
  window.gtag('consent', 'update', { analytics_storage: 'granted' })
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ID)}`
  document.head.appendChild(s)
}

/** Call once at start-up: loads the tag only if the visitor already agreed on an earlier visit. */
export function initAnalytics() {
  try { if (getConsent() === 'granted') load() } catch { /* ignore */ }
}

// ---------- what may be sent ----------
const ALLOWED = new Set(['method', 'source', 'item_id', 'item_name', 'billing_cycle', 'currency', 'value', 'transaction_id', 'items', 'business_type',
  'item_count', 'export_type', 'channel', 'from_plan', 'to_plan', 'page_path'])
const EMAIL = /[^\s@]+@[^\s@]+/
const PHONEISH = /\+?\d[\d\s-]{8,}/

function cleanValue(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const s = v.trim().slice(0, 100)
    if (!s || EMAIL.test(s) || PHONEISH.test(s)) return undefined
    return s
  }
  return undefined
}

export function sanitize(params) {
  const out = {}
  if (!params || typeof params !== 'object') return out
  for (const [k, v] of Object.entries(params)) {
    if (!ALLOWED.has(k)) continue
    if (k === 'items') {
      if (Array.isArray(v)) out.items = v.slice(0, 10).map((it) => {
        const o = {}
        for (const f of ['item_id', 'item_name', 'price', 'quantity']) { const c = cleanValue(it?.[f]); if (c !== undefined) o[f] = c }
        return o
      })
      continue
    }
    const c = cleanValue(v)
    if (c !== undefined) out[k] = c
  }
  return out
}

/** Paths are sent without query strings, ids or tokens. */
export function normalizePath(pathname) {
  return String(pathname || '/').split('?')[0].split('#')[0]
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/order\/[^/]+/, '/order/:token') || '/'
}

const isStorefront = (p) => p === '/s' || p.startsWith('/s/')

function ready() { return VALID && getConsent() === 'granted' && loaded && typeof window.gtag === 'function' }

function send(name, params) {
  const clean = sanitize(params)
  const key = `${name}|${JSON.stringify(clean)}`
  const now = Date.now()
  if (recent.has(key) && now - recent.get(key) < DEDUPE_MS) return false   // re-render or StrictMode double call
  recent.set(key, now)
  if (recent.size > 100) recent.delete(recent.keys().next().value)
  window.gtag('event', name, clean)
  return true
}

export function track(name, params) {
  try { if (ready()) return send(name, params) } catch { /* analytics must never break the app */ }
  return false
}

/** For conversions: sends at most once per key, remembered across reloads (e.g. one purchase per transaction id). */
export function trackOnce(key, name, params) {
  try {
    if (!ready()) return false
    let seen = []
    try { seen = JSON.parse(store.get(SENT_KEY) || '[]') } catch { seen = [] }
    if (seen.includes(key)) return false
    if (!send(name, params)) return false
    store.set(SENT_KEY, JSON.stringify([...seen, key].slice(-100)))
    return true
  } catch { return false }
}

/** SPA page view. Same path twice in a row is ignored; storefront pages are never sent. */
export function pageView(pathname) {
  try {
    const path = normalizePath(pathname)
    if (isStorefront(path)) return false
    if (path === lastPath) return false
    if (!ready()) return false
    lastPath = path
    return send('page_view', { page_path: path })
  } catch { return false }
}

/** Forget the last page so the current one is reported once consent has just been given. */
export function resetPageMemory() { lastPath = null }

export const __test = { reset() { loaded = false; lastPath = null; recent.clear() } }
