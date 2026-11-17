import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

export const ORDER_TYPES = { DINE_IN: 'Dine in', TAKEAWAY: 'Takeaway', DELIVERY: 'Delivery' }
export const STAGE_LABEL = { PENDING: 'Pending', ACCEPTED: 'Accepted', PREPARING: 'Preparing', READY: 'Ready', SERVED: 'Served', CANCELLED: 'Cancelled' }
export const STAGE_TONE = { PENDING: 'warn', ACCEPTED: '', PREPARING: 'teal', READY: 'ok', SERVED: 'gray', CANCELLED: 'gray' }
export const PAY_LABEL = { UNPAID: 'Not paid', PARTIAL: 'Part paid', PAID: 'Paid', REFUNDED: 'Refunded' }
export const PAY_TONE = { UNPAID: 'warn', PARTIAL: 'warn', PAID: 'ok', REFUNDED: 'gray' }
export const ITEM_LABEL = { NEW: 'New', PREPARING: 'Preparing', READY: 'Ready', SERVED: 'Served', CANCELLED: 'Cancelled' }
export const METHODS = { CASH: 'Cash', TRANSFER: 'Bank transfer', CARD: 'Card' }

/** "4 min", "1 h 05 min": how long ago. */
export function elapsed(iso, now = Date.now()) {
  if (!iso) return ''
  const m = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000))
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`
}

export function minutesSince(iso, now = Date.now()) {
  return iso ? Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000)) : 0
}

/** Re-renders every `ms` so elapsed times stay current. */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t) }, [ms])
  return now
}

/** Calls `fn` every `ms` while the page is open (kitchen display). */
export function usePolling(fn, ms) {
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) fn() }, ms)
    return () => clearInterval(t)
  }, [fn, ms])
}

/** Every product with its variants (menu, finished goods and ingredients), loading up to 500 items. */
export async function loadProducts(extra = {}) {
  const out = []
  for (let page = 0; page < 5; page++) {
    const res = await api.get('/products', { size: 100, page, ...extra })
    out.push(...res.content)
    if (res.last || res.content.length < 100) break
  }
  return out
}

export function variantName(p, v) {
  return p.name + (v.label ? ` (${v.label})` : '')
}
