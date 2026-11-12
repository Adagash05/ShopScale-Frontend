import { detectMode, crossOrigin } from './domains.js'

/**
 * The single place that reads build-time configuration. VITE_* values are baked into the bundle at build
 * time: change one in Cloudflare and you must trigger a new build. They are public, never put secrets here.
 */
const e = import.meta.env || {}
const clean = (v) => String(v || '').trim().replace(/\/+$/, '')

export const API_ORIGIN = clean(e.VITE_API_BASE_URL || e.VITE_API_URL) || (e.PROD ? '' : 'http://localhost:8080')
export const API_BASE = `${API_ORIGIN}/api`
export const SITE_URL = clean(e.VITE_PUBLIC_SITE_URL || e.VITE_SITE_URL)
export const APP_URL = clean(e.VITE_APP_URL)
export const MODE = detectMode(typeof window === 'undefined' ? '' : window.location.hostname,
  { siteUrl: SITE_URL, appUrl: APP_URL, override: clean(e.VITE_SITE_MODE) })

/** Absolute URL of the business application for a path (relative path when one origin serves everything). */
export function appUrl(path = '/') { return MODE === 'unified' || !APP_URL ? path : APP_URL + path }
/** Absolute URL of the public website for a path. */
export function siteUrl(path = '/') { return MODE === 'unified' || !SITE_URL ? path : SITE_URL + path }
/** Customer storefront address for a merchant slug, always on the public domain. */
export function storeUrl(slug) {
  const origin = SITE_URL && MODE !== 'unified' ? SITE_URL : (typeof window === 'undefined' ? '' : window.location.origin)
  return `${origin}/s/${slug}`
}
export function crossTarget(path) { return crossOrigin(MODE, path, { siteUrl: SITE_URL, appUrl: APP_URL }) }
