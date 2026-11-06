import { describe, expect, it } from 'vitest'
import { addLine, buildPayments, computeTotals, validateSale } from '../lib/cart.js'

const item = { variantId: 'v1', productName: 'Ankara shirt', label: 'M', price: '5000.00', quantity: 3 }

describe('cart', () => {
  it('adds a line then increments the same variant', () => {
    let lines = addLine([], item)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ name: 'Ankara shirt (M)', quantity: 1, stock: 3 })
    lines = addLine(lines, item)
    expect(lines).toHaveLength(1)
    expect(lines[0].quantity).toBe(2)
  })

  it('computes totals and caps the discount at the subtotal', () => {
    const lines = [{ variantId: 'a', price: 1500.5, quantity: 2 }, { variantId: 'b', price: 200, quantity: 1 }]
    expect(computeTotals(lines, '')).toEqual({ subtotal: 3201, discount: 0, total: 3201 })
    expect(computeTotals(lines, '201')).toEqual({ subtotal: 3201, discount: 201, total: 3000 })
    expect(computeTotals(lines, '99999').total).toBe(0)
    expect(computeTotals(lines, '-5').discount).toBe(0)
  })

  it('splits payments for full, part and later', () => {
    expect(buildPayments('full', 'CASH', '', 3000)).toEqual({ payments: [{ method: 'CASH', amount: 3000 }], owed: 0 })
    expect(buildPayments('part', 'TRANSFER', '1000', 3000)).toEqual({ payments: [{ method: 'TRANSFER', amount: 1000 }], owed: 2000 })
    expect(buildPayments('part', 'CASH', '9000', 3000).owed).toBe(0)
    expect(buildPayments('part', 'CASH', '', 3000)).toEqual({ payments: [], owed: 3000 })
    expect(buildPayments('later', 'CASH', '', 3000)).toEqual({ payments: [], owed: 3000 })
  })

  it('validates a sale before sending', () => {
    const lines = [{ variantId: 'v1', name: 'Shirt', quantity: 2, stock: 5 }]
    expect(validateSale({ lines: [], total: 0, owed: 0 })).toMatch(/at least one item/i)
    expect(validateSale({ lines, total: 100, owed: 0 })).toBeNull()
    expect(validateSale({ lines: [{ ...lines[0], quantity: 9 }], total: 100, owed: 0 })).toMatch(/Only 5 left/)
    expect(validateSale({ lines: [{ ...lines[0], quantity: 9, allowNegative: true }], total: 100, owed: 0 })).toBeNull()
    expect(validateSale({ lines, total: 100, owed: 50, customer: null, canUseCredit: true })).toMatch(/customer/i)
    expect(validateSale({ lines, total: 100, owed: 50, customer: { id: 'c' }, canUseCredit: false })).toMatch(/not included/i)
    expect(validateSale({ lines, total: 100, owed: 50, customer: { id: 'c' }, canUseCredit: true })).toBeNull()
  })
})
