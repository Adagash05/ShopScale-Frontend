const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 2,
})

export function money(value) {
  const n = Number(value ?? 0)
  return naira.format(Number.isFinite(n) ? n : 0)
}

export function dateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  })
}

export function dateOnly(iso) {
  if (!iso) return ''
  const d = iso.length === 10 ? new Date(iso + 'T00:00:00') : new Date(iso)
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function daysLeft(iso, now = new Date()) {
  if (!iso) return 0
  const ms = new Date(iso).getTime() - now.getTime()
  return Math.max(0, Math.ceil(ms / 86400000))
}

export const RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 days' },
  { id: 'last30', label: 'Last 30 days' },
  { id: 'thisMonth', label: 'This month' },
  { id: 'lastMonth', label: 'Last month' },
  { id: 'custom', label: 'Choose dates' },
]

export function rangeQuery(range, from, to) {
  return range === 'custom' ? { range, from, to } : { range }
}
