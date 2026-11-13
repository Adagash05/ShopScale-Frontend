import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Register from '../pages/Register.jsx'
import VerifyNotice from '../pages/VerifyNotice.jsx'
import { ApiError, api } from '../lib/api.js'

const register = vi.fn()
vi.mock('../auth/AuthContext.jsx', () => ({ useAuth: () => ({ register }) }))
vi.mock('../analytics/analytics.js', () => ({ track: vi.fn() }))

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

async function fill(over = {}) {
  const v = { name: 'Ada Obi', email: 'ada@example.com', password: 'longenough1', ...over }
  await userEvent.type(screen.getByLabelText('Your name'), v.name)
  await userEvent.type(screen.getByLabelText('Email'), v.email)
  await userEvent.type(screen.getByLabelText('Password'), v.password)
}

describe('Register', () => {
  beforeEach(() => register.mockReset())

  it('validates before calling the server', async () => {
    render(<MemoryRouter><Register /></MemoryRouter>)
    await userEvent.type(screen.getByLabelText('Password'), 'short')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText(/enter your name/i)).toBeInTheDocument()
    expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    expect(screen.getByText(/at least 8/i)).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('sends one request even if the button is pressed twice, and shows a loading state', async () => {
    let done
    register.mockReturnValue(new Promise((r) => { done = r }))
    render(<MemoryRouter><Register /></MemoryRouter>)
    await fill()
    const btn = screen.getByRole('button', { name: /create account/i })
    await userEvent.dblClick(btn)
    expect(register).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: /creating account/i })).toBeDisabled()
    done()
  })

  it('shows the server reason, not a stack trace, when sign-up fails', async () => {
    register.mockRejectedValueOnce(new ApiError(409, 'An account with this email already exists'))
    render(<MemoryRouter><Register /></MemoryRouter>)
    await fill()
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('An account with this email already exists')
  })

  it('shows a clear message on a network failure or timeout and lets the person retry', async () => {
    register.mockRejectedValueOnce(new ApiError(0, 'This is taking longer than expected. Check your connection and try again.'))
    render(<MemoryRouter><Register /></MemoryRouter>)
    await fill()
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/taking longer than expected/)
    expect(screen.getByRole('button', { name: /create account/i })).toBeEnabled()
  })
})

describe('Verification notice', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.unstubAllGlobals())

  it('says check your email and resends once, then waits', async () => {
    fetch.mockImplementation(async (url) => String(url).includes('verification-status') ? json(200, { verified: false, emailConfigured: true }) : new Response(null, { status: 204 }))
    render(<VerifyNotice email="ada@example.com" />)
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /send the email again/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /send again in/i })).toBeDisabled())
    expect(fetch.mock.calls.filter(([u]) => String(u).includes('resend-verification'))).toHaveLength(1)
  })

  it('does not claim an email went out when the server has no email set up', async () => {
    fetch.mockImplementation(async () => json(200, { verified: false, emailConfigured: false }))
    render(<VerifyNotice />)
    expect(await screen.findByText(/not available yet/i)).toBeInTheDocument()
    expect(screen.queryByText(/we sent/i)).toBeNull()
  })

  it('renders nothing once the email is confirmed', async () => {
    fetch.mockImplementation(async () => json(200, { verified: true, emailConfigured: true }))
    const { container } = render(<VerifyNotice />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})

describe('API client timeouts', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.unstubAllGlobals())

  it('turns an aborted request into a readable timeout error', async () => {
    fetch.mockRejectedValueOnce(Object.assign(new Error('aborted'), { name: 'AbortError' }))
    await expect(api.public.post('/auth/register', {})).rejects.toMatchObject({ status: 0, message: expect.stringMatching(/longer than expected/) })
  })

  it('explains a gateway timeout instead of showing a raw error', async () => {
    fetch.mockResolvedValueOnce(new Response('<html>504</html>', { status: 504 }))
    await expect(api.public.post('/auth/register', {})).rejects.toMatchObject({ status: 504, message: expect.stringMatching(/busy or slow/) })
  })
})
