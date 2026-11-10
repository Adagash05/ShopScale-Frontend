// Pure maths for receiving stock. The server recomputes everything; this drives the screen.
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

export function purchaseTotal(lines) {
  return r2(lines.reduce((s, l) => s + num(l.unitCost) * num(l.quantity), 0))
}

/** mode: 'full' | 'part' | 'later'. Returns what was paid now and what is owed to the supplier. */
export function purchasePayment(mode, partAmount, total) {
  if (mode === 'later') return { paid: 0, owed: total }
  if (mode === 'part') { const paid = Math.min(Math.max(num(partAmount), 0), total); return { paid: r2(paid), owed: r2(total - paid) } }
  return { paid: total, owed: 0 }
}

export function validatePurchase({ lines, owed, supplier, canOwe }) {
  if (lines.length === 0) return 'Add at least one product'
  for (const l of lines) {
    if (!(num(l.quantity) > 0) || (!l.allowDecimal && !Number.isInteger(num(l.quantity)))) return `Enter how many ${l.name} you received`
    if (l.unitCost === '' || num(l.unitCost) < 0) return `Enter what you paid for each ${l.name}`
  }
  if (owed > 0 && !supplier) return 'Choose a supplier when you have not paid in full'
  if (owed > 0 && !canOwe) return 'Tracking what you owe suppliers is not included in your plan'
  return null
}

export function addPurchaseLine(lines, item) {
  if (lines.some((l) => l.variantId === item.variantId)) return lines
  return [...lines, { variantId: item.variantId, name: item.label ? `${item.productName} (${item.label})` : item.productName, quantity: 1, unitCost: '', stock: item.quantity, allowDecimal: !!item.allowDecimal }]
}
