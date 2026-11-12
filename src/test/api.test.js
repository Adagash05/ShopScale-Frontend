import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, tokens } from '../lib/api.js'

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('api client', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); tokens.clear() })
  afterEach(() => { vi.unstubAllGlobals(); tokens.clear() })

  it('sends the bearer token and the cookie credentials, and returns JSON', async () => {
    tokens.set({ accessToken: 'A1' })
    fetch.mockResolvedValueOnce(json(200, { ok: true }))
    const r = await api.get('/dashboard', { range: 'today', from: '' })
    expect(r).toEqual({ ok: true })
    const [url, init] = fetch.mock.calls[0]
    expect(url).toMatch(/\/api\/dashboard\?range=today$/)
    expect(init.headers.Authorization).toBe('Bearer A1')
    expect(init.credentials).toBe('include')
    expect(init.headers['X-ShopScale-Client']).toBe('web')
  })

  it('public endpoints are called without credentials or custom headers', async () => {
    fetch.mockResolvedValueOnce(json(200, []))
    await api.public.get('/public/stores/x')
    const init = fetch.mock.calls[0][1]
    expect(init.credentials).toBeUndefined()
    expect(init.headers['X-ShopScale-Client']).toBeUndefined()
  })

  it('never puts a refresh token in localStorage', async () => {
    tokens.set({ accessToken: 'old' })
    fetch.mockResolvedValueOnce(json(401, {})).mockResolvedValueOnce(json(200, { accessToken: 'new' })).mockResolvedValueOnce(json(200, {}))
    await api.get('/x')
    const stored = JSON.stringify({ ...localStorage })
    expect(stored).not.toMatch(/refresh/i)
    expect(stored).not.toMatch(/new/)
  })

  it('refreshes once on 401 from the cookie and retries with the new token', async () => {
    tokens.set({ accessToken: 'old' })
    fetch
      .mockResolvedValueOnce(json(401, { message: 'Sign in to continue' }))
      .mockResolvedValueOnce(json(200, { accessToken: 'new' }))
      .mockResolvedValueOnce(json(200, { done: 1 }))
    expect(await api.get('/products')).toEqual({ done: 1 })
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(fetch.mock.calls[1][0]).toMatch(/\/auth\/refresh$/)
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer new')
  })

  it('renews first when a reloaded page has no access token yet', async () => {
    localStorage.setItem('shopscale.signedin', '1')
    fetch.mockResolvedValueOnce(json(200, { accessToken: 'fresh' })).mockResolvedValueOnce(json(200, { ok: 1 }))
    expect(await api.get('/products')).toEqual({ ok: 1 })
    expect(fetch.mock.calls[0][0]).toMatch(/\/auth\/refresh$/)
    expect(fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer fresh')
  })

  it('shares one refresh between parallel requests', async () => {
    tokens.set({ accessToken: 'old' })
    let refreshCalls = 0
    fetch.mockImplementation((url, init) => {
      if (String(url).endsWith('/auth/refresh')) { refreshCalls++; return Promise.resolve(json(200, { accessToken: 'new' })) }
      return Promise.resolve(init.headers.Authorization === 'Bearer new' ? json(200, { ok: 1 }) : json(401, {}))
    })
    await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')])
    expect(refreshCalls).toBe(1)
  })

  it('signs out when the server says the session ended', async () => {
    tokens.set({ accessToken: 'old' })
    const out = vi.fn()
    window.addEventListener('shopscale:signedout', out)
    fetch.mockResolvedValueOnce(json(401, {})).mockResolvedValueOnce(json(401, { message: 'Your session has ended. Sign in again.' }))
    await expect(api.get('/products')).rejects.toBeInstanceOf(ApiError)
    expect(tokens.get()).toBeNull()
    expect(tokens.hinted()).toBe(false)
    expect(out).toHaveBeenCalled()
    window.removeEventListener('shopscale:signedout', out)
  })

  it('does NOT sign out when the refresh fails only because the network is down', async () => {
    tokens.set({ accessToken: 'old' })
    const out = vi.fn()
    window.addEventListener('shopscale:signedout', out)
    fetch.mockResolvedValueOnce(json(401, {})).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const err = await api.get('/products').catch((e) => e)
    expect(err.status).toBe(0)
    expect(tokens.hinted()).toBe(true)
    expect(out).not.toHaveBeenCalled()
    window.removeEventListener('shopscale:signedout', out)
  })

  it('does NOT sign out on a server error during refresh', async () => {
    tokens.set({ accessToken: 'old' })
    fetch.mockResolvedValueOnce(json(401, {})).mockResolvedValueOnce(json(503, {}))
    await expect(api.get('/products')).rejects.toMatchObject({ status: 503 })
    expect(tokens.hinted()).toBe(true)
  })

  it('migrates an older stored refresh token once and removes it from localStorage', async () => {
    localStorage.setItem('shopscale.session', JSON.stringify({ accessToken: 'x', refreshToken: 'LEGACY' }))
    fetch.mockResolvedValueOnce(json(200, { accessToken: 'new' })).mockResolvedValueOnce(json(200, { ok: 1 }))
    await api.get('/products')
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ refreshToken: 'LEGACY' })
    expect(localStorage.getItem('shopscale.session')).toBeNull()
  })

  it('turns server errors into friendly messages with field errors', async () => {
    fetch.mockResolvedValueOnce(json(400, { message: 'Please check the highlighted fields', fieldErrors: { price: 'Enter the selling price' } }))
    const err = await api.post('/products', {}).catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.fieldErrors.price).toBe('Enter the selling price')
  })

  it('reports a clear message when offline', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const err = await api.get('/products').catch((e) => e)
    expect(err.status).toBe(0)
    expect(err.message).toMatch(/connection/i)
  })
})
