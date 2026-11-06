const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '') + '/api'
const KEY = 'shopscale.session'

// Tokens live in localStorage so the session survives reloads on mobile. The trade-off (XSS exposure)
// is documented in the README; the app renders no untrusted HTML.
export const tokens = {
  get() {
    try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
  },
  set(t) { localStorage.setItem(KEY, JSON.stringify({ accessToken: t.accessToken, refreshToken: t.refreshToken })) },
  clear() { localStorage.removeItem(KEY) },
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

let refreshing = null

async function refreshTokens() {
  const t = tokens.get()
  if (!t?.refreshToken) throw new ApiError(401, 'Sign in to continue')
  if (!refreshing) {
    refreshing = fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: t.refreshToken }),
    })
      .then(parse)
      .then((data) => { tokens.set(data); return data })
      .catch((e) => {
        tokens.clear()
        window.dispatchEvent(new Event('shopscale:signedout'))
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
    const t = tokens.get()
    if (auth && t?.accessToken) headers.Authorization = `Bearer ${t.accessToken}`
    return fetch(`${BASE}${path}${qs(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }
  let res
  try {
    res = await send()
  } catch {
    throw new ApiError(0, 'No connection. Check your network and try again.')
  }
  if (res.status === 401 && auth && tokens.get()?.refreshToken) {
    await refreshTokens()
    try { res = await send() } catch { throw new ApiError(0, 'No connection. Check your network and try again.') }
  }
  return parse(res)
}

export const api = {
  get: (path, query) => request(path, { query }),
  post: (path, body) => request(path, { method: 'POST', body: body ?? {} }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  public: {
    get: (path, query) => request(path, { query, auth: false }),
    post: (path, body) => request(path, { method: 'POST', body, auth: false }),
  },
}
