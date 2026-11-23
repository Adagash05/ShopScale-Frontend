import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout, { visibleNav } from '../pages/Layout.jsx'

let perms = new Set()
vi.mock('../auth/AuthContext.jsx', () => ({
  useAuth: () => ({ business: { name: 'Fashion House', slug: 'fashionhouse' }, can: (p) => perms.has(p) }),
}))

const labels = (can) => visibleNav(can).map((i) => i.label)

describe('navigation follows permissions', () => {
  it('owner-level access sees everything', () => {
    const all = () => true
    expect(labels(all)).toEqual(['Home', 'Sales', 'Products & Stock', 'Money', 'More'])
  })

  it('a cashier gets Sell, Products and Customers but no dashboard', () => {
    const cashier = new Set(['PRODUCTS_VIEW', 'SALES_CREATE', 'CUSTOMERS_VIEW'])
    expect(labels((p) => cashier.has(p))).toEqual(['Sales', 'Products & Stock', 'Customers & Suppliers', 'Settings'])
  })

  it('kitchen staff see only Settings and More', () => {
    const kitchen = new Set(['KITCHEN_VIEW'])
    expect(labels((p) => kitchen.has(p))).toEqual(['Settings', 'More'])
  })

  it('renders only the allowed links in both navigations', () => {
    perms = new Set(['SALES_CREATE'])
    render(<MemoryRouter><Layout /></MemoryRouter>)
    expect(screen.getAllByRole('link', { name: 'Sales' })).toHaveLength(2)   // sidebar + bottom bar
    expect(screen.queryByRole('link', { name: 'Customers & Suppliers' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Home' })).toBeNull()
  })
})
