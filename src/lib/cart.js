// Pure sale maths for the Sell screen. The server recomputes everything; this only drives the UI.

const toNum = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

export function computeTotals(lines, discount) {
  const subtotal = round2(lines.reduce((s, l) => s + toNum(l.price) * l.quantity, 0))
  const d = Math.min(Math.max(toNum(discount), 0), subtotal)
  return { subtotal, discount: round2(d), total: round2(subtotal - d) }
}

/**
 * mode: 'full' (paid now), 'part' (some now, rest owed), 'later' (all owed)
 * Returns the payments to send plus how much stays owed.
 */
export function buildPayments(mode, method, partAmount, total) {
  if (mode === 'later') return { payments: [], owed: total }
  if (mode === 'part') {
    const paid = Math.min(Math.max(toNum(partAmount), 0), total)
    return { payments: paid > 0 ? [{ method, amount: round2(paid) }] : [], owed: round2(total - paid) }
  }
  return { payments: total > 0 ? [{ method, amount: total }] : [], owed: 0 }
}

export function validateSale({ lines, total, owed, customer, canUseCredit }) {
  if (lines.length === 0) return 'Add at least one item'
  for (const l of lines) {
    if (l.quantity < 1) return 'Quantity must be at least 1'
    if (l.stock != null && l.quantity > l.stock && !l.allowNegative) {
      return `Only ${l.stock} left of ${l.name}`
    }
  }
  if (owed > 0 && !customer) return 'Choose a customer when the money is not fully paid'
  if (owed > 0 && !canUseCredit) return 'Selling on credit is not included in your plan'
  if (total < 0) return 'Check the discount'
  return null
}

export function addLine(lines, item) {
  const i = lines.findIndex((l) => l.variantId === item.variantId)
  if (i >= 0) {
    return lines.map((l, idx) => (idx === i ? { ...l, quantity: l.quantity + 1 } : l))
  }
  return [
    ...lines,
    {
      variantId: item.variantId,
      name: item.label ? `${item.productName} (${item.label})` : item.productName,
      price: item.price,
      quantity: 1,
      stock: item.quantity,
    },
  ]
}

export function newRequestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'req-' + Date.now() + '-' + Math.random().toString(16).slice(2)
}
