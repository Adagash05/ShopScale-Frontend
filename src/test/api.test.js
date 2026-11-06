import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, tokens } from '../lib/api.js'

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('api client', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('sends the bearer token and returns JSON', async () => {
    tokens.set({ accessToken: 'A1', refreshToken: 'R1' })
    fetch.mockResolvedValueOnce(json(200, { ok: true }))
    const r = await api.get('/dashboard', { range: 'today', from: '' })
    expect(r).toEqual({ ok: true })
    const [url, init] = fetch.mock.calls[0]
    expect(url).toMatch(/\/api\/dashboard\?range=today$/)
    expect(init.headers.Authorization).toBe('Bearer A1')
  })

  it('refreshes once on 401 and retries with the new token', async () => {
    tokens.set({ accessToken: 'old', refreshToken: 'R1' })
    fetch
      .mockResolvedValueOnce(json(401, { message: 'Sign in to continue' }))
      .mockResolvedValueOnce(json(200, { accessToken: 'new', refreshToken: 'R2' }))
      .mockResolvedValueOnce(json(200, { done: 1 }))
    expect(await api.get('/products')).toEqual({ done: 1 })
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer new')
    expect(tokens.get()).toEqual({ accessToken: 'new', refreshToken: 'R2' })
  })

  it('shares one refresh between parallel requests', async () => {
    tokens.set({ accessToken: 'old', refreshToken: 'R1' })
    let refreshCalls = 0
    fetch.mockImplementation((url, init) => {
      if (String(url).endsWith('/auth/refresh')) { refreshCalls++; return Promise.resolve(json(200, { accessToken: 'new', refreshToken: 'R2' })) }
      return Promise.resolve(init.headers.Authorization === 'Bearer new' ? json(200, { ok: 1 }) : json(401, {}))
    })
    await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')])
    expect(refreshCalls).toBe(1)
  })

  it('signs out when the refresh fails', async () => {
    tokens.set({ accessToken: 'old', refreshToken: 'dead' })
    const out = vi.fn()
    window.addEventListener('shopscale:signedout', out)
    fetch.mockResolvedValueOnce(json(401, {})).mockResolvedValueOnce(json(401, { message: 'Your session has ended. Sign in again.' }))
    await expect(api.get('/products')).rejects.toBeInstanceOf(ApiError)
    expect(tokens.get()).toBeNull()
    expect(out).toHaveBeenCalled()
    window.removeEventListener('shopscale:signedout', out)
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
