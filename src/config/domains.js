/**
 * Pure domain / routing rules (no Vite or browser globals) so they can be unit-tested with plain Node.
 *
 * Three "modes", decided by the hostname the page is served from:
 *   public  – the marketing website (shopscale.com.ng, www.shopscale.com.ng) and public storefronts
 *   app     – the business application (app.shopscale.com.ng)
 *   unified – anything else (localhost, Cloudflare preview *.pages.dev, a single-origin Docker/nginx install):
 *             every route is served from one origin, exactly like before domain separation.
 */

/** First path segments owned by the business application. Every module route lives under "more/". */
export const APP_PREFIXES = [
  'login', 'register', 'forgot-password', 'reset-password', 'verify-email', 'accept-invite', 'onboarding',
  'dashboard', 'sell', 'products', 'customers', 'expenses', 'suppliers', 'purchases', 'more',
]

/** Marketing pages served on the public domain ('/' is the homepage). */
export const PUBLIC_PREFIXES = ['features', 'retail', 'restaurant', 'catering', 'pricing', 'about', 'contact', 'faq', 'privacy', 'terms', 'refunds']

/** Public customer storefront: /s/:slug and /s/:slug/order/:token. Stays on the public domain. */
export const STORE_PREFIX = 's'

export function hostOf(url) {
  try { return new URL(url).hostname.toLowerCase() } catch { return '' }
}

export function splitPath(to) {
  const s = String(to || '/')
  const cut = s.search(/[?#]/)
  return cut === -1 ? { pathname: s, rest: '' } : { pathname: s.slice(0, cut), rest: s.slice(cut) }
}

export function firstSegment(pathname) {
  return String(pathname || '/').split('/').filter(Boolean)[0]?.toLowerCase() || ''
}

/** Which deployment owns this path: 'public' | 'store' | 'app' | 'home' (the "/" entry) | 'unknown'. */
export function sideOf(pathname) {
  const seg = firstSegment(splitPath(pathname).pathname)
  if (seg === '') return 'home'
  if (APP_PREFIXES.includes(seg)) return 'app'
  if (seg === STORE_PREFIX) return 'store'
  if (PUBLIC_PREFIXES.includes(seg)) return 'public'
  return 'unknown'
}

/**
 * @param hostname  window.location.hostname
 * @param cfg       { siteUrl, appUrl, override } – override is VITE_SITE_MODE ('public' | 'app' | 'unified' | '')
 */
export function detectMode(hostname, { siteUrl = '', appUrl = '', override = '' } = {}) {
  if (['public', 'app', 'unified'].includes(override)) return override
  const h = String(hostname || '').toLowerCase()
  const appHost = hostOf(appUrl)
  const siteHost = hostOf(siteUrl)
  if (appHost && h === appHost) return 'app'
  if (siteHost && (h === siteHost || h === `www.${siteHost}`)) return 'public'
  return 'unified'
}

/**
 * Where should this path go from the given mode? Returns null when the current host serves it itself.
 * Returns the absolute URL otherwise. The sets are disjoint, so a redirect can never bounce back.
 */
export function crossOrigin(mode, to, { siteUrl, appUrl }) {
  if (mode === 'unified') return null
  const { pathname, rest } = splitPath(to)
  const side = sideOf(pathname)
  if (mode === 'public' && side === 'app') return appUrl + pathname + rest
  if (mode === 'app' && (side === 'public' || side === 'store')) return siteUrl + pathname + rest
  return null
}

/** Only same-origin application paths may be used as a post-login destination (no open redirects). */
export function safeNext(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  const { pathname } = splitPath(value)
  const side = sideOf(pathname)
  if (side !== 'app') return null
  const seg = firstSegment(pathname)
  if (['login', 'register', 'forgot-password', 'reset-password', 'verify-email', 'accept-invite'].includes(seg)) return null
  return value
}
