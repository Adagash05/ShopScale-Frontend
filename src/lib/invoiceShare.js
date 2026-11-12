// WhatsApp / device sharing helpers for invoices. Pure functions (testable); the browser calls are isolated in shareFile().

/** Turns what a person typed ("0803 123 4567", "+234 803…") into the digits wa.me needs, or '' if it cannot be a number. */
export function toWaNumber(phone, countryCode = '234') {
  let d = String(phone || '').replace(/[^\d+]/g, '')
  if (d.startsWith('+')) d = d.slice(1)
  else if (d.startsWith('00')) d = d.slice(2)
  else if (d.startsWith('0')) d = countryCode + d.slice(1)
  d = d.replace(/\D/g, '')
  return d.length >= 11 && d.length <= 15 ? d : ''
}

const naira = (n) => `NGN ${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function waMessage({ businessName, invoice, link }) {
  const lines = [`Hello ${invoice.customerName},`, `Here is invoice ${invoice.number} from ${businessName}.`, `Total: ${naira(invoice.total)}`]
  if (Number(invoice.amountPaid) > 0) lines.push(`Paid: ${naira(invoice.amountPaid)}`)
  lines.push(`Balance due: ${naira(invoice.balance)}`)
  if (invoice.dueDate) lines.push(`Due: ${invoice.dueDate}`)
  if (link) lines.push('', `View or download the invoice: ${link}`)
  lines.push('', 'Thank you.')
  return lines.join('\n')
}

/** wa.me click-to-chat. It only opens a chat with the text filled in: it can NOT attach a file, and it does not send anything. */
export function waLink(phone, text) {
  const n = toWaNumber(phone)
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`
}

/** Can this device hand a PDF file to another app (including WhatsApp)? */
export function canShareFile(file) {
  try { return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [file] }) } catch { return false }
}

/** Opens the device share sheet with the PDF attached. Resolves 'shared' or 'cancelled'; rejects on a real failure. */
export async function shareFile(file, { title, text }) {
  try {
    await navigator.share({ files: [file], title, text })
    return 'shared'
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancelled'
    throw e
  }
}

/** Client-side preview of the totals, for the form only. The server recomputes every amount and its answer is what is saved. */
export function previewTotals(lines, invoiceDiscount = 0) {
  const r2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100
  let subtotal = 0, tax = 0
  for (const l of lines) {
    const gross = r2((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0))
    const net = Math.max(0, r2(gross - (Number(l.discount) || 0)))
    subtotal = r2(subtotal + net)
    tax = r2(tax + r2(net * (Number(l.taxRate) || 0) / 100))
  }
  const total = Math.max(0, r2(subtotal + tax - (Number(invoiceDiscount) || 0)))
  return { subtotal, tax, total }
}

export const STATUS_LABEL = { DRAFT: 'Draft', SENT: 'Sent', PARTIALLY_PAID: 'Partly paid', PAID: 'Paid', OVERDUE: 'Overdue', CANCELLED: 'Cancelled' }
export const STATUS_BADGE = { DRAFT: 'gray', SENT: '', PARTIALLY_PAID: 'warn', PAID: 'ok', OVERDUE: 'danger', CANCELLED: 'gray' }
