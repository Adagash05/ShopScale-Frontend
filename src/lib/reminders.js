// Payment reminder wording. Pure functions: the person edits the text, copies it or opens WhatsApp with it. Nothing is sent from here.
import { waLink } from './invoiceShare.js'

const naira = (n) => `NGN ${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const TEMPLATES = [
  { key: 'FRIENDLY', label: 'Friendly reminder' },
  { key: 'DUE', label: 'Payment due' },
  { key: 'OVERDUE', label: 'Overdue payment' },
]

/** Whole days from the due date to today (positive = past due). Dates are yyyy-mm-dd; null when there is no due date. */
export function daysPastDue(dueDate, today = new Date()) {
  if (!dueDate) return null
  const d = new Date(`${String(dueDate).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((t - d) / 86400000)
}

/** Which template fits: past due -> overdue, due today or within 3 days -> due, otherwise friendly. */
export function suggestTemplate(dueDate, today = new Date()) {
  const n = daysPastDue(dueDate, today)
  if (n === null) return 'FRIENDLY'
  if (n > 0) return 'OVERDUE'
  if (n >= -3) return 'DUE'
  return 'FRIENDLY'
}

/**
 * ctx: { customerName, businessName, balance, invoiceNumber?, dueDate? }. Uses only what the record holds: a missing invoice number or due date is left out, never invented.
 */
export function reminderText(key, ctx) {
  const name = (ctx.customerName || '').trim() || 'there'
  const biz = (ctx.businessName || '').trim() || 'us'
  const bal = naira(ctx.balance)
  const ref = ctx.invoiceNumber ? ` for invoice ${ctx.invoiceNumber}` : ''
  const due = ctx.dueDate ? String(ctx.dueDate).slice(0, 10) : ''
  const close = `Thank you.\n${biz}`
  if (key === 'OVERDUE') {
    return `Hello ${name},\n\nThis is a reminder from ${biz}. The balance of ${bal}${ref} was due${due ? ` on ${due}` : ''} and is still outstanding.\n\nPlease let us know when to expect payment, or tell us if there is a problem we can help with. If you have already paid, please ignore this message.\n\n${close}`
  }
  if (key === 'DUE') {
    return `Hello ${name},\n\nA reminder from ${biz}: the balance of ${bal}${ref} ${due ? `is due on ${due}` : 'is due'}.\n\nPlease arrange payment when you can. If you have already paid, please ignore this message.\n\n${close}`
  }
  return `Hello ${name},\n\nA friendly reminder from ${biz} that you have an outstanding balance of ${bal}${ref}${due ? ` (due ${due})` : ''}.\n\nPlease pay when convenient. If you have already paid, thank you and please ignore this message.\n\n${close}`
}

/** wa.me link with the saved phone number and the (possibly edited) text. Returns '' when the phone cannot be used. */
export function reminderLink(phone, text) {
  const l = waLink(phone, text)
  return l.startsWith('https://wa.me/?') ? '' : l
}
