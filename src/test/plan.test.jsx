import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Plan from '../pages/Plan.jsx'
import { api } from '../lib/api'
import { track, trackOnce } from '../analytics/analytics.js'

vi.mock('../auth/AuthContext.jsx', () => ({ useAuth: () => ({ can: () => true }) }))
vi.mock('../components.jsx', async (orig) => ({ ...(await orig()), useToast: () => vi.fn() }))
vi.mock('../analytics/analytics.js', () => ({ track: vi.fn(), trackOnce: vi.fn() }))
vi.mock('../lib/api', () => ({ api: { get: vi.fn(), post: vi.fn(), del: vi.fn(), public: { get: vi.fn() } } }))

const PLANS = [
  { code: 'FREE', name: 'Free', monthlyPrice: '0.00', annualPrice: '0.00', features: [], maxUsers: 1, maxLocations: 1, maxItems: 15 },
  { code: 'GROWTH', name: 'Growth', monthlyPrice: '11999.00', annualPrice: '119990.00', features: [], maxUsers: 5, maxLocations: 2, maxItems: 500, recommended: true },
]
const CURRENT = { planCode: 'GROWTH', planName: 'Growth', status: 'ACTIVE', billingCycle: 'MONTHLY', periodEnd: '2026-12-15T10:00:00Z', writable: true, features: [] }
const BILLING = { autoRenew: true, autoRenewAvailable: true, nextRenewalAt: '2026-12-15T10:00:00Z', nextRenewalAmount: '11999.00', cycle: 'MONTHLY', paymentMethod: { brand: 'visa', last4: '4081', expMonth: '12', expYear: '2030' }, lastRenewal: null, lastPayment: { paidAt: '2026-11-15T10:00:00Z', amount: '11999.00' } }
const PAYMENTS = (status = 'SUCCESS') => [{ id: '1', planCode: 'GROWTH', cycle: 'MONTHLY', kind: 'NEW', amount: '11999.00', status, reference: 'SSB-abc', paidAt: '2026-11-15T10:00:00Z', periodEnd: '2026-12-15T10:00:00Z', createdAt: '2026-11-15T10:00:00Z', source: 'CHECKOUT' }]

function setup({ billing = BILLING, current = CURRENT, payments = PAYMENTS(), verify, url = '/more/plan' } = {}) {
  api.public.get.mockResolvedValue(PLANS)
  api.get.mockImplementation(async (path) => {
    if (path === '/subscriptions/current') return current
    if (path === '/subscriptions/payments') return payments
    if (path === '/subscriptions/billing-status') return { configured: true }
    if (path === '/subscriptions/billing') return billing
    if (path === '/subscriptions/quote') return { planCode: 'GROWTH', planName: 'Growth', cycle: 'MONTHLY', listPrice: '11999.00', credit: '0', amount: '11999.00', kind: 'NEW' }
    throw new Error('unexpected GET ' + path)
  })
  api.post.mockImplementation(async (path, body) => {
    if (path === '/subscriptions/verify') return verify(body)
    if (path === '/subscriptions/checkout') return { reference: 'SSB-new', authorizationUrl: 'https://checkout.paystack.com/x', quote: {} }
    return { status: 'OK' }
  })
  return render(<MemoryRouter initialEntries={[url]}><Plan /></MemoryRouter>)
}

describe('Plan: payment return', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('keeps the reference until the server confirms, then reports the purchase once', async () => {
    const verify = vi.fn().mockResolvedValue({ status: 'SUCCESS' })
    setup({ verify, url: '/more/plan?reference=SSB-abc' })
    await waitFor(() => expect(verify).toHaveBeenCalledWith({ reference: 'SSB-abc' }))
    await waitFor(() => expect(trackOnce).toHaveBeenCalledWith('purchase:SSB-abc', 'purchase', expect.objectContaining({ transaction_id: 'SSB-abc' })))
    expect(localStorage.getItem('shopscale.pendingPayment')).toBeNull()
  })

  it('does not lose the reference when the network fails, and the customer can retry', async () => {
    const verify = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ status: 'SUCCESS' })
    setup({ verify, url: '/more/plan?reference=SSB-abc' })
    const retry = await screen.findByRole('button', { name: /check payment status/i })
    expect(JSON.parse(localStorage.getItem('shopscale.pendingPayment')).reference).toBe('SSB-abc')
    expect(trackOnce).not.toHaveBeenCalled()
    await userEvent.click(retry)
    await waitFor(() => expect(verify).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(localStorage.getItem('shopscale.pendingPayment')).toBeNull())
  })

  it('shows a pending payment as unconfirmed and reports nothing to analytics', async () => {
    setup({ verify: vi.fn().mockResolvedValue({ status: 'PENDING' }), url: '/more/plan?reference=SSB-abc', payments: PAYMENTS('PENDING') })
    expect(await screen.findByText(/has not been confirmed yet/i)).toBeInTheDocument()
    expect(trackOnce).not.toHaveBeenCalled()
    expect(localStorage.getItem('shopscale.pendingPayment')).not.toBeNull()
  })

  it('a failed payment is final: reference cleared, nothing reported', async () => {
    const verify = vi.fn().mockResolvedValue({ status: 'FAILED' })
    setup({ verify, url: '/more/plan?reference=SSB-abc', payments: PAYMENTS('FAILED') })
    await waitFor(() => expect(localStorage.getItem('shopscale.pendingPayment')).toBeNull())
    expect(trackOnce).not.toHaveBeenCalled()
  })

  it('resumes verification from a reference stored on an earlier visit', async () => {
    localStorage.setItem('shopscale.pendingPayment', JSON.stringify({ reference: 'SSB-old', at: Date.now() }))
    const verify = vi.fn().mockResolvedValue({ status: 'SUCCESS' })
    setup({ verify })
    await waitFor(() => expect(verify).toHaveBeenCalledWith({ reference: 'SSB-old' }))
  })
})

describe('Plan: automatic renewal', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows the renewal state from the backend', async () => {
    setup({ verify: vi.fn() })
    expect(await screen.findByText('Automatic renewal')).toBeInTheDocument()
    expect(await screen.findByText(/•••• 4081/)).toBeInTheDocument()
    expect(screen.getByText(/Next renewal/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /turn off automatic renewal/i })).toBeInTheDocument()
  })

  it('shows a failed renewal with the retry date', async () => {
    setup({ verify: vi.fn(), billing: { ...BILLING, lastRenewal: { status: 'FAILED', attemptNo: 1, failureReason: 'Insufficient Funds', nextRetryAt: '2026-12-16T10:00:00Z' } } })
    expect(await screen.findByText(/last automatic renewal failed/i)).toHaveTextContent(/Insufficient Funds/)
  })

  it('says a cancelled plan will not be charged again and keeps access until the period ends', async () => {
    setup({ verify: vi.fn(), current: { ...CURRENT, status: 'CANCELLED' }, billing: { ...BILLING, autoRenew: false } })
    expect(await screen.findByText(/will not be charged again/i)).toBeInTheDocument()
  })

  it('sends consent only when the customer ticks the box', async () => {
    setup({ verify: vi.fn(), billing: { ...BILLING, autoRenew: false, paymentMethod: null } })
    const choose = await screen.findAllByRole('button', { name: /choose plan|renew/i })
    await userEvent.click(choose[0])
    const box = await screen.findByRole('checkbox')
    expect(box).not.toBeChecked()
    expect(screen.getByText(/one-time payment for the period/i)).toBeInTheDocument()
    await userEvent.click(box)
    delete window.location
    window.location = { assign: vi.fn() }
    await userEvent.click(screen.getByRole('button', { name: /pay with paystack/i }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/subscriptions/checkout', expect.objectContaining({ autoRenew: true, consent: true })))
    expect(track).toHaveBeenCalledWith('begin_checkout', expect.anything())
  })

  it('lists payment history with automatic renewals labelled', async () => {
    setup({ verify: vi.fn(), payments: [{ ...PAYMENTS()[0], source: 'AUTO', kind: 'RENEWAL' }] })
    expect(await screen.findByText(/automatic renewal$/i)).toBeInTheDocument()
  })
})
