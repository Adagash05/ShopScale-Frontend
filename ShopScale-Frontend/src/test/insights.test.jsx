import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Insights from '../pages/Insights.jsx'

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
afterEach(() => vi.unstubAllGlobals())
const show = () => render(<MemoryRouter><Insights range="last30" from="" to="" /></MemoryRouter>)

describe('Insights panel', () => {
  it('explains each insight, shows the records behind it and links to the fix', async () => {
    fetch.mockResolvedValue(json(200, [{
      id: 'out-of-stock-selling', severity: 'ATTENTION', title: '2 products are out of stock but still selling', detail: 'You are probably losing sales on these.',
      basis: 'Out of stock now and sold at least once in the last 30 days.', actionLabel: 'Receive stock', actionPath: '/purchases/new',
      items: [{ label: 'Ankara shirt (M)', note: 'Sold 9 in the last 30 days', path: '/products/p1' }],
    }]))
    show()
    expect(await screen.findByText(/out of stock but still selling/)).toBeInTheDocument()
    expect(screen.getByText('Ankara shirt (M)')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Receive stock/ })).toHaveAttribute('href', '/purchases/new')
    expect(screen.getByRole('link', { name: /Ankara shirt/ })).toHaveAttribute('href', '/products/p1')
    expect(screen.getByText('How do we know?')).toBeInTheDocument()
    expect(screen.getByText(/sold at least once in the last 30 days/)).toBeInTheDocument()
  })

  it('says plainly when nothing needs attention instead of inventing something', async () => {
    fetch.mockResolvedValue(json(200, []))
    show()
    expect(await screen.findByText(/Nothing needs your attention/)).toBeInTheDocument()
  })

  it('shows an error with retry when insights cannot load', async () => {
    fetch.mockResolvedValue(json(500, { message: 'Something went wrong on our side. Please try again.' }))
    show()
    expect(await screen.findByRole('alert')).toHaveTextContent(/went wrong/)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
