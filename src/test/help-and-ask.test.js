import { describe, expect, it } from 'vitest'
import { ARTICLES, CATEGORIES, searchArticles } from '../pages/helpContent.js'
import { advertised, NOT_YET_DELIVERED } from '../lib/plans.js'

describe('in-app Help', () => {
  it('has the nine categories and every one has answers', () => {
    expect(CATEGORIES.map((c) => c.title)).toEqual(['Getting started', 'Sales and receipts', 'Products and stock', 'Customers', 'Suppliers', 'Money and expenses', 'Online store', 'Account and subscription', 'Invoices and payments'])
    for (const c of CATEGORIES) expect(ARTICLES.some((a) => a.cat === c.id)).toBe(true)
  })
  it('does not describe modules that are hidden in V1', () => {
    expect(ARTICLES.map((a) => a.title + a.body.join(' ')).join(' ')).not.toMatch(/kitchen|catering|restaurant|branch/i)
  })
  it('searches questions and answers', () => {
    expect(searchArticles('print').length).toBeGreaterThan(0)
    expect(searchArticles('zzzxqv')).toEqual([])
    expect(searchArticles('')).toHaveLength(ARTICLES.length)
  })
})

describe('pricing page promises', () => {
  it('does not advertise features that are not delivered as described', () => {
    for (const f of NOT_YET_DELIVERED) expect(advertised(f, false)).toBe(false)
    expect(advertised('STOREFRONT', true)).toBe(true)
  })
})
