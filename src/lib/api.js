import { API_BASE as BASE } from '../config/env.js'

/*
 * Session model (see docs/SESSION_MANAGEMENT.md)
 *  - The 15-minute access token lives in memory only.
 *  - The 30-day refresh token lives in an HttpOnly cookie set by the API. Scripts can never read it.
 *  - localStorage holds only a non-secret "signed in" hint so a returning visitor's page knows to renew quietly.
 *  - A network failure is never treated as a sign-out; only the server saying the session is over (401/403) is.
 */
const HINT = 'shopscale.signedin'
const LEGACY = 'shopscale.session'   // older versions stored both tokens here; migrated once, then removed

let accessToken = null
const store = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } },
  del: (k) => { try { localStorage.removeItem(k) } catch { /* private mode */ } },
}

export const tokens = {
  get() { return accessToken ? { accessToken } : null },
  set(t) { accessToken = t?.accessToken || null; if (accessToken) store.set(HINT, '1') },
  clear() { accessToken = null; store.del(HINT); store.del(LEGACY) },
  /** True when this browser has (or may have) a session that can be renewed. */
  hinted() { return store.get(HINT) === '1' || !!legacyRefresh() },
}

function legacyRefresh() {
  try { return JSON.parse(store.get(LEGACY))?.refreshToken || null } catch { return null }
}

export class ApiError extends Error {
  constructor(status, message, fieldErrors) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors || null
  }
}

function qs(query) {
  if (!query) return ''
  const p = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, v)
  })
  const s = p.toString()
  return s ? `?${s}` : ''
}

async function parse(res) {
  if (res.status === 204) return null
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { /* non-JSON body */ }
  if (!res.ok) {
    const fallback = res.status >= 500
      ? 'Something went wrong on our side. Please try again.'
      : 'Something went wrong. Please try again.'
    throw new ApiError(res.status, data?.message || fallback, data?.fieldErrors)
  }
  return data
}

const NO_CONNECTION = 'No connection. Check your network and try again.'

/** Calls that read or write the refresh cookie (everything except the open public endpoints) send credentials. */
const isPublic = (path) => path.startsWith('/public/') || path === '/subscriptions/plans'
function init(path, method, headers, body) {
  const h = { ...headers }
  const o = { method, headers: h, body }
  if (!isPublic(path)) { o.credentials = 'include'; h['X-ShopScale-Client'] = 'web' }
  return o
}

let refreshing = null

/**
 * Renews the access token from the refresh cookie. One refresh is shared by every request waiting on it.
 * Resolves with the new session; rejects with ApiError(401/403) only when the server ended the session,
 * and ApiError(0) / 5xx when it could not be reached (the session is kept).
 */
export function refreshSession() {
  if (!refreshing) {
    const legacy = legacyRefresh()
    refreshing = fetch(`${BASE}/auth/refresh`, init('/auth/refresh', 'POST', { 'Content-Type': 'application/json' }, legacy ? JSON.stringify({ refreshToken: legacy }) : '{}'))
      .catch(() => { throw new ApiError(0, NO_CONNECTION) })
      .then(parse)
      .then((data) => { store.del(LEGACY); tokens.set(data); return data })
      .catch((e) => {
        if (e.status === 401 || e.status === 403) {
          tokens.clear()
          window.dispatchEvent(new Event('shopscale:signedout'))
        }
        throw e
      })
      .finally(() => { refreshing = null })
  }
  return refreshing
}

export async function request(path, { method = 'GET', body, query, auth = true } = {}) {
  const send = () => {
    const headers = {}
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`
    return fetch(`${BASE}${path}${qs(query)}`, init(path, method, headers, body !== undefined ? JSON.stringify(body) : undefined))
  }
  // A reloaded page has no access token yet: renew first instead of sending a call that is bound to fail.
  if (auth && !accessToken && tokens.hinted()) await refreshSession()
  let res
  try { res = await send() } catch { throw new ApiError(0, NO_CONNECTION) }
  if (res.status === 401 && auth && tokens.hinted()) {
    await refreshSession()
    try { res = await send() } catch { throw new ApiError(0, NO_CONNECTION) }
  }
  return parse(res)
}

/** Multipart upload (product images). Retries once after a token refresh, like request(). */
export async function upload(path, formData) {
  const send = () => fetch(`${BASE}${path}`, init(path, 'POST', accessToken ? { Authorization: `Bearer ${accessToken}` } : {}, formData))
  if (!accessToken && tokens.hinted()) await refreshSession()
  let res
  try { res = await send() } catch { throw new ApiError(0, NO_CONNECTION) }
  if (res.status === 401 && tokens.hinted()) { await refreshSession(); res = await send() }
  return parse(res)
}

/** Authenticated file download (CSV, PDF). Returns the Blob. */
export async function download(path, query) {
  const send = () => fetch(`${BASE}${path}${qs(query)}`, init(path, 'GET', accessToken ? { Authorization: `Bearer ${accessToken}` } : {}))
  if (!accessToken && tokens.hinted()) await refreshSession()
  let res
  try { res = await send() } catch { throw new ApiError(0, NO_CONNECTION) }
  if (res.status === 401 && tokens.hinted()) { await refreshSession(); res = await send() }
  if (!res.ok) await parse(res)
  return res.blob()
}

export const api = {
  upload,
  download,
  get: (path, query) => request(path, { query }),
  post: (path, body) => request(path, { method: 'POST', body: body ?? {} }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  public: {
    get: (path, query) => request(path, { query, auth: false }),
    post: (path, body) => request(path, { method: 'POST', body, auth: false }),
  },
}
