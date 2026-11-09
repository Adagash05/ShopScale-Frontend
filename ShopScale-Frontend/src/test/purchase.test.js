import { describe, expect, it } from 'vitest'
import { addPurchaseLine, purchasePayment, purchaseTotal, validatePurchase } from '../lib/purchase.js'

const item = { variantId: 'v1', productName: 'Rice 50kg', label: null, quantity: 4 }

describe('receiving stock', () => {
  it('adds a product once and ignores duplicates', () => {
    let lines = addPurchaseLine([], item)
    expect(lines[0]).toMatchObject({ name: 'Rice 50kg', quantity: 1, unitCost: '', stock: 4 })
    lines = addPurchaseLine(lines, item)
    expect(lines).toHaveLength(1)
  })

  it('totals quantity times cost', () => {
    expect(purchaseTotal([{ quantity: '10', unitCost: '1500.5' }, { quantity: 2, unitCost: 300 }])).toBe(15605)
    expect(purchaseTotal([])).toBe(0)
  })

  it('splits what was paid from what is owed', () => {
    expect(purchasePayment('full', '', 5000)).toEqual({ paid: 5000, owed: 0 })
    expect(purchasePayment('part', '2000', 5000)).toEqual({ paid: 2000, owed: 3000 })
    expect(purchasePayment('part', '9000', 5000)).toEqual({ paid: 5000, owed: 0 })
    expect(purchasePayment('later', '', 5000)).toEqual({ paid: 0, owed: 5000 })
  })

  it('stops incomplete or impossible purchases before they reach the server', () => {
    const ok = [{ name: 'Rice', quantity: '2', unitCost: '1000' }]
    expect(validatePurchase({ lines: [], owed: 0 })).toMatch(/at least one/i)
    expect(validatePurchase({ lines: [{ ...ok[0], quantity: '0' }], owed: 0 })).toMatch(/how many/i)
    expect(validatePurchase({ lines: [{ ...ok[0], unitCost: '' }], owed: 0 })).toMatch(/what you paid/i)
    expect(validatePurchase({ lines: ok, owed: 500, supplier: '', canOwe: true })).toMatch(/choose a supplier/i)
    expect(validatePurchase({ lines: ok, owed: 500, supplier: 's1', canOwe: false })).toMatch(/not included/i)
    expect(validatePurchase({ lines: ok, owed: 500, supplier: 's1', canOwe: true })).toBeNull()
    expect(validatePurchase({ lines: ok, owed: 0, supplier: '', canOwe: false })).toBeNull()
  })
})
