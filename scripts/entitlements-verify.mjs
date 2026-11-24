// Plan-allowance wording used by the pricing page and the reminder dialog. Run: node scripts/entitlements-verify.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { expenseLimitText, reminderExhausted, reminderLimitText, reminderUsageText, supplierLimitText } from '../src/lib/entitlements.js'

const P = {
  free: { maxExpenses: 10, expensePeriod: 'TOTAL', maxSuppliers: 0, maxWhatsappReminders: 0 },
  essential: { maxExpenses: 50, expensePeriod: 'MONTH', maxSuppliers: 10, maxWhatsappReminders: 20 },
  growth: { maxExpenses: null, expensePeriod: 'TOTAL', maxSuppliers: 50, maxWhatsappReminders: 50 },
  business: { maxExpenses: null, expensePeriod: 'TOTAL', maxSuppliers: null, maxWhatsappReminders: null },
}
test('expense allowance text: lifetime on Free, per month on Essential, unlimited above', () => {
  assert.equal(expenseLimitText(P.free), '10')
  assert.equal(expenseLimitText(P.essential), '50 per month')
  assert.equal(expenseLimitText(P.growth), 'Unlimited*')
  assert.equal(expenseLimitText(P.business), 'Unlimited*')
})
test('supplier allowance text: none on Free', () => {
  assert.equal(supplierLimitText(P.free), 'None')
  assert.equal(supplierLimitText(P.essential), '10')
  assert.equal(supplierLimitText(P.growth), '50')
  assert.equal(supplierLimitText(P.business), 'Unlimited*')
})
test('reminder allowance text', () => {
  assert.equal(reminderLimitText(P.free), 'None')
  assert.equal(reminderLimitText(P.essential), '20 per month')
  assert.equal(reminderLimitText(P.growth), '50 per month')
  assert.equal(reminderLimitText(P.business), 'Unlimited*')
})
test('remaining reminders are shown, and exhaustion is detected', () => {
  const u = { included: true, unlimited: false, limit: 20, used: 15, remaining: 5 }
  assert.equal(reminderUsageText(u), '5 of 20 WhatsApp reminders left this billing month')
  assert.equal(reminderExhausted(u), false)
  assert.equal(reminderExhausted({ ...u, used: 20, remaining: 0 }), true)
  assert.match(reminderUsageText({ included: true, unlimited: true, limit: null }), /Unlimited/)
  assert.equal(reminderExhausted({ included: true, unlimited: true, limit: null, remaining: null }), false)
  assert.equal(reminderUsageText({ included: false }), null)
  assert.equal(reminderExhausted(null), false)
})
