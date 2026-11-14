/*
 * Referral capture for ShopScale Partners.
 *
 * A partner link looks like  https://app.shopscale.com.ng/register?ref=CODE  (the public site forwards it to the app
 * host with the query intact). The code is remembered on this device for the attribution window; the LAST link a
 * visitor opens wins. At sign-up the code and an anonymous visitor id are sent to the API, which decides on its own
 * whether and to whom the sign-up is attributed. Nothing here can create or change a commission.
 */
export const REF_KEY = 'shopscale.ref'
export const VISITOR_KEY = 'shopscale.visitor'
export const DEFAULT_WINDOW_DAYS = 30
const DAY = 86400000
const CODE = /^[A-Za-z0-9]{4,24}$/

function safeStore() {
  try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}

function read(storage, key) {
  try { return JSON.parse(storage?.getItem(key)) } catch { return null }
}

function write(storage, key, value) {
  try { storage?.setItem(key, JSON.stringify(value)) } catch { /* private mode: attribution simply does not persist */ }
}

function newId() {
  try { if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID() } catch { /* fall through */ }
  return 'v' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** A stable anonymous id for this browser, used only to de-duplicate clicks and to find the last referral. */
export function visitorId(storage = safeStore()) {
  const saved = storage && read(storage, VISITOR_KEY)
  if (typeof saved === 'string' && saved.length >= 8 && saved.length <= 64) return saved
  const id = newId()
  if (storage) write(storage, VISITOR_KEY, id)
  return id
}

/** Reads ?ref=CODE. Returns the normalised code, or null when absent or not shaped like a code. */
export function codeFromSearch(search) {
  let v
  try { v = new URLSearchParams(search || '').get('ref') } catch { return null }
  v = (v || '').trim()
  return CODE.test(v) ? v.toUpperCase() : null
}

/**
 * Remember a referral from the page URL. The newest link replaces an older one (last referral wins).
 * Returns the stored record, or null when the URL carries no valid code.
 */
export function capture(search, { storage = safeStore(), now = Date.now() } = {}) {
  const code = codeFromSearch(search)
  if (!code) return null
  let source = null
  try { source = (new URLSearchParams(search).get('utm_source') || '').trim().slice(0, 60) || null } catch { /* ignore */ }
  const prev = storage && read(storage, REF_KEY)
  // The same link opened again keeps its "click already reported" flag; a different code starts fresh.
  const record = { code, visitorId: visitorId(storage), at: now, source: source || 'link', clicked: prev?.code === code && !!prev.clicked }
  if (storage) write(storage, REF_KEY, record)
  return record
}

/** The remembered referral if it is still inside the window, otherwise null (and the stale record is dropped). */
export function current({ storage = safeStore(), now = Date.now(), days = DEFAULT_WINDOW_DAYS } = {}) {
  const r = storage && read(storage, REF_KEY)
  if (!r || typeof r.code !== 'string' || !CODE.test(r.code) || typeof r.at !== 'number') return null
  if (now - r.at > days * DAY || r.at > now + DAY) { try { storage.removeItem(REF_KEY) } catch { /* ignore */ } return null }
  return r
}

export function markClicked(storage = safeStore()) {
  const r = storage && read(storage, REF_KEY)
  if (r) write(storage, REF_KEY, { ...r, clicked: true })
}

/** Extra fields for the register request: empty when there is no live referral, so ordinary sign-ups are unchanged. */
export function registrationFields(opts = {}) {
  const r = current(opts)
  return r ? { referralCode: r.code, visitorId: r.visitorId } : {}
}

/** Called once per captured link: tells the API a click happened (best effort; a failure is retried next visit). */
export async function reportClick(post, opts = {}) {
  const r = current(opts)
  if (!r || r.clicked) return false
  try {
    await post('/public/partners/click', { code: r.code, visitorId: r.visitorId, source: r.source })
    markClicked(opts.storage ?? safeStore())
    return true
  } catch { return false }
}
