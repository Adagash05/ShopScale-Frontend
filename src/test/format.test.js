import { describe, expect, it } from 'vitest'
import { daysLeft, money, rangeQuery } from '../lib/format.js'
import { annualSavings, limitText, newFeatures } from '../lib/plans.js'

describe('format', () => {
  it('formats naira', () => {
    expect(money(9000)).toContain('9,000')
    expect(money('1234.5')).toContain('1,234.50')
    expect(money(null)).toContain('0')
  })
  it('counts trial days left, never negative', () => {
    const now = new Date('2026-06-10T12:00:00Z')
    expect(daysLeft('2026-06-13T12:00:00Z', now)).toBe(3)
    expect(daysLeft('2026-06-10T13:00:00Z', now)).toBe(1)
    expect(daysLeft('2026-06-01T00:00:00Z', now)).toBe(0)
  })
  it('only sends dates for a custom range', () => {
    expect(rangeQuery('today', 'a', 'b')).toEqual({ range: 'today' })
    expect(rangeQuery('custom', '2026-01-01', '2026-01-31')).toEqual({ range: 'custom', from: '2026-01-01', to: '2026-01-31' })
  })
})

describe('plans', () => {
  const essential = { code: 'ESSENTIAL', monthlyPrice: 4999, annualPrice: 49990, maxItems: 100, features: ['POS'] }
  const growth = { code: 'GROWTH', monthlyPrice: 11999, annualPrice: 119990, maxItems: 500, features: ['POS', 'ADVANCED_FINANCE'] }
  it('shows two months free as the annual saving', () => {
    expect(annualSavings(essential)).toBe(9998)
    expect(annualSavings(growth)).toBe(23998)
  })
  it('treats a null limit as unlimited', () => {
    expect(limitText(null)).toBe('Unlimited*')
    expect(limitText(500)).toBe('500')
  })
  it('lists only what a higher plan adds', () => {
    expect(newFeatures(growth, essential)).toEqual(['ADVANCED_FINANCE'])
  })
})
