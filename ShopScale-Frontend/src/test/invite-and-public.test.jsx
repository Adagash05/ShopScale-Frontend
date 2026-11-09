import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AcceptInvite from '../pages/AcceptInvite.jsx'
import { HomePage, RestaurantPage, CateringPage, ContactPage, PrivacyPage, NotFoundPage } from '../marketing/Pages.jsx'
import { Donut, HBars, BarChart } from '../charts.jsx'

const acceptInvite = vi.fn()
vi.mock('../auth/AuthContext.jsx', () => ({ useAuth: () => ({ acceptInvite }) }))

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const plans = [
  { code: 'ESSENTIAL', name: 'Essential', monthlyPrice: 9000, annualPrice: 90000, maxUsers: 1, maxLocations: 1, maxItems: 500, features: ['POS'] },
  { code: 'GROWTH', name: 'Growth', monthlyPrice: 17000, annualPrice: 170000, maxUsers: 3, maxLocations: 2, maxItems: 3000, features: ['POS', 'ADVANCED_FINANCE'] },
  { code: 'BUSINESS', name: 'Business', monthlyPrice: 29000, annualPrice: 290000, maxUsers: 10, maxLocations: 5, maxItems: null, features: ['POS', 'ADVANCED_FINANCE', 'CUSTOM_DOMAINS'] },
]

beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); acceptInvite.mockReset() })
afterEach(() => vi.unstubAllGlobals())

function at(path, element) {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="*" element={element} /></Routes></MemoryRouter>)
}

describe('AcceptInvite', () => {
  it('shows who invited you and creates an account with a password', async () => {
    fetch.mockResolvedValue(json(200, { businessName: 'Fashion House', fullName: 'Ada', email: 'ada@x.com', roleName: 'Sales staff', accountExists: false }))
    acceptInvite.mockResolvedValue()
    at('/accept-invite?token=abc', <AcceptInvite />)
    expect(await screen.findByText(/Join Fashion House/)).toBeInTheDocument()
    expect(screen.getByText('Sales staff')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Choose a password'), 'longenough1')
    await userEvent.click(screen.getByRole('button', { name: /join the team/i }))
    expect(acceptInvite).toHaveBeenCalledWith({ token: 'abc', fullName: null, password: 'longenough1' })
  })

  it('asks for the existing password when the person already has an account', async () => {
    fetch.mockResolvedValue(json(200, { businessName: 'B', fullName: 'Ada', email: 'a@x.com', roleName: 'Manager', accountExists: true }))
    at('/accept-invite?token=abc', <AcceptInvite />)
    expect(await screen.findByLabelText('Your ShopScale password')).toBeInTheDocument()
    expect(screen.queryByLabelText('Your name')).toBeNull()
  })

  it('rejects short passwords before calling the server', async () => {
    fetch.mockResolvedValue(json(200, { businessName: 'B', fullName: 'Ada', email: 'a@x.com', roleName: 'Manager', accountExists: false }))
    at('/accept-invite?token=abc', <AcceptInvite />)
    await userEvent.type(await screen.findByLabelText('Choose a password'), 'short')
    await userEvent.click(screen.getByRole('button', { name: /join the team/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 8 characters/i)
    expect(acceptInvite).not.toHaveBeenCalled()
  })

  it('shows a clear message for an expired or used link', async () => {
    fetch.mockResolvedValue(json(409, { message: 'This invitation has expired. Ask your employer to resend it.' }))
    at('/accept-invite?token=old', <AcceptInvite />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/expired/i)
  })
})

describe('public website', () => {
  it('home page sells the product without inventing proof, and marks unfinished tools as coming soon', async () => {
    fetch.mockResolvedValue(json(200, plans))
    at('/', <HomePage />)
    expect(screen.getByRole('heading', { level: 1, name: /Your entire business\. One simple platform\./ })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Start your 14-day free trial/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Coming soon').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText(/sample (figures|items)/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/testimonial/i)).toBeNull()
    await waitFor(() => expect(screen.getByText('Growth')).toBeInTheDocument())
  })

  it('restaurant and catering pages say plainly that the tools are not available yet', () => {
    at('/restaurant', <RestaurantPage />)
    expect(screen.getAllByText('Coming soon').length).toBeGreaterThan(0)
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument()
    at('/catering', <CateringPage />)
    expect(screen.getAllByText(/not available yet/i).length).toBeGreaterThan(0)
  })

  it('sets the page title for SEO', () => {
    at('/privacy', <PrivacyPage />)
    expect(document.title).toBe('Privacy Policy · ShopScale')
    expect(document.head.querySelector('link[rel="canonical"]').getAttribute('href')).toMatch(/\/privacy$/)
    expect(document.head.querySelector('meta[name="description"]').getAttribute('content').length).toBeGreaterThan(20)
  })

  it('does not show a fake contact address when none is configured', () => {
    at('/contact', <ContactPage />)
    expect(screen.queryByRole('link', { name: /@/ })).toBeNull()
    expect(screen.getByText(/contact details are being set up/i)).toBeInTheDocument()
  })

  it('has a friendly 404', () => {
    at('/nope', <NotFoundPage />)
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toMatch(/noindex/)
  })
})

describe('charts', () => {
  it('draws one slice per payment method with percentages', () => {
    const { container } = render(<Donut ariaLabel="Payments" centerLabel="Received" centerValue="₦10k" segments={[{ label: 'Cash', value: 7500 }, { label: 'Card', value: 2500 }]} />)
    expect(container.querySelectorAll('circle[stroke-dasharray]')).toHaveLength(2)
    expect(screen.getByText(/75%/)).toBeInTheDocument()
    expect(screen.getByText(/25%/)).toBeInTheDocument()
  })

  it('draws a bar per day and per series, and bars are clickable only when given an action', async () => {
    const onClick = vi.fn()
    const { container } = render(<BarChart ariaLabel="Sales by day" series={[{ key: 'a', label: 'A', color: '#000' }, { key: 'b', label: 'B', color: '#111' }]}
      data={[{ label: '1 Jun', title: 't1', values: { a: 100, b: 50 }, onClick }, { label: '2 Jun', title: 't2', values: { a: 0, b: 0 } }]} />)
    expect(container.querySelectorAll('rect[fill="#000"]')).toHaveLength(2)
    expect(container.querySelectorAll('g[role="link"]')).toHaveLength(1)
    await userEvent.click(container.querySelector('g[role="link"]'))
    expect(onClick).toHaveBeenCalled()
  })

  it('scales horizontal bars to the largest value', () => {
    const { container } = render(<HBars items={[{ label: 'A', value: 100, note: '100 sold' }, { label: 'B', value: 50, note: '50 sold' }]} />)
    const widths = [...container.querySelectorAll('.hbar-fill')].map((e) => e.style.width)
    expect(widths).toEqual(['100%', '50%'])
  })
})
