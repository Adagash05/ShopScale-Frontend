import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login.jsx'
import Onboarding, { slugify } from '../pages/Onboarding.jsx'

const login = vi.fn()
const completeOnboarding = vi.fn()
vi.mock('../auth/AuthContext.jsx', () => ({
  useAuth: () => ({ login, completeOnboarding, logout: vi.fn(), user: { fullName: 'Ada Obi' } }),
}))

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('Login', () => {
  beforeEach(() => login.mockReset())

  it('validates before calling the server', async () => {
    render(<MemoryRouter><Login /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
    expect(screen.getByText(/enter your password/i)).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('shows the server message when sign in fails', async () => {
    login.mockRejectedValueOnce(new Error('Email or password is incorrect'))
    render(<MemoryRouter><Login /></MemoryRouter>)
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-pass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect')
  })
})

describe('Onboarding', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); completeOnboarding.mockReset() })
  afterEach(() => vi.unstubAllGlobals())

  it('only lets merchants choose what is actually available', () => {
    render(<MemoryRouter><Onboarding /></MemoryRouter>)
    expect(screen.getByText(/Hi Ada/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /shop or retail/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /restaurant or food/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /small chops/i })).toBeDisabled()
    expect(screen.getAllByText('Coming soon')).toHaveLength(2)
  })

  it('suggests a store address from the name and enables finish only when it is available', async () => {
    fetch.mockImplementation(async () => json(200, { slug: 'fashion-house', available: true }))   // a fresh Response per call: the sign-up notice also asks for verification status
    render(<MemoryRouter><Onboarding /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await userEvent.type(screen.getByLabelText('Business name'), 'Fashion House')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByLabelText('Store address')).toHaveValue('fashion-house')
    await waitFor(() => expect(screen.getByText(/That address is available/)).toBeInTheDocument())
    const finish = screen.getByRole('button', { name: /start my free trial/i })
    expect(finish).toBeEnabled()
    await userEvent.click(finish)
    expect(completeOnboarding).toHaveBeenCalledWith(expect.objectContaining({ businessType: 'RETAIL', slug: 'fashion-house', name: 'Fashion House', currency: 'NGN' }))
  })

  it('blocks finishing when the address is taken', async () => {
    fetch.mockImplementation(async () => json(200, { slug: 'taken', available: false, reason: 'That store address is already taken' }))   // a fresh Response per call: the sign-up notice also asks for verification status
    render(<MemoryRouter><Onboarding /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await userEvent.type(screen.getByLabelText('Business name'), 'Taken')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText(/already taken/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start my free trial/i })).toBeDisabled()
  })
})

describe('slugify', () => {
  it('makes safe store addresses', () => {
    expect(slugify("Ada's Beauty & Hair!")).toBe('ada-s-beauty-hair')
    expect(slugify('  --Tech World--  ')).toBe('tech-world')
    expect(slugify('x'.repeat(60))).toHaveLength(40)
  })
})
