// Checks the reminder wording and WhatsApp link. Run: node scripts/reminders-verify.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { daysPastDue, reminderLink, reminderText, suggestTemplate } from '../src/lib/reminders.js'

const ctx = { customerName: 'Ada Obi', businessName: 'Ada Stores', balance: 12500, invoiceNumber: 'INV-0007', dueDate: '2026-11-10' }
const day = (s) => new Date(`${s}T12:00:00`)

test('days past due', () => {
  assert.equal(daysPastDue('2026-11-10', day('2026-11-23')), 13)
  assert.equal(daysPastDue('2026-11-23', day('2026-11-23')), 0)
  assert.equal(daysPastDue('2026-11-25', day('2026-11-23')), -2)
  assert.equal(daysPastDue(null), null)
})
test('suggested template follows the due date', () => {
  assert.equal(suggestTemplate('2026-11-10', day('2026-11-23')), 'OVERDUE')
  assert.equal(suggestTemplate('2026-11-25', day('2026-11-23')), 'DUE')
  assert.equal(suggestTemplate('2026-12-30', day('2026-11-23')), 'FRIENDLY')
  assert.equal(suggestTemplate(null), 'FRIENDLY')
})
test('every template carries the real name, invoice, balance, due date and business', () => {
  for (const k of ['FRIENDLY', 'DUE', 'OVERDUE']) {
    const t = reminderText(k, ctx)
    for (const part of ['Ada Obi', 'Ada Stores', 'INV-0007', '12,500.00', '2026-11-10']) assert.ok(t.includes(part), `${k} missing ${part}`)
  }
})
test('missing details are left out, not invented', () => {
  const t = reminderText('FRIENDLY', { customerName: 'Ada', businessName: 'Ada Stores', balance: 500 })
  assert.ok(!/invoice|undefined|null|\(due/.test(t), t)
})
test('wording is polite and makes no delivery claim', () => {
  for (const k of ['FRIENDLY', 'DUE', 'OVERDUE']) assert.ok(!/legal|court|police|final warning|sent to you|delivered/i.test(reminderText(k, ctx)))
})
test('WhatsApp link uses the saved number and the edited text; unusable numbers give no link', () => {
  const l = reminderLink('0803 123 4567', 'Hi there')
  assert.equal(l, 'https://wa.me/2348031234567?text=Hi%20there')
  assert.equal(reminderLink('', 'x'), '')
  assert.equal(reminderLink('123', 'x'), '')
})

import { describeError } from '../src/lib/invoiceShare.js'
test('validation errors name the field instead of "check the highlighted fields"', () => {
  const e = { message: 'Please check the highlighted fields', fieldErrors: { 'items[1].unitPrice': 'must be greater than or equal to 0', dueDate: 'must be a valid date' } }
  const t = describeError(e)
  assert.ok(t.includes('Item 2: unit price must be greater than or equal to 0'), t)
  assert.ok(t.includes('due date: must be a valid date'), t)
  assert.equal(describeError({ message: 'Boom' }), 'Boom')
  assert.equal(describeError(null), 'Something went wrong.')
})
