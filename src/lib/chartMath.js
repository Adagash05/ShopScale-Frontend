// Pure helpers for the dashboard trend chart, kept apart from the React component so they can be tested on their own.

/** A tidy upper bound and evenly spaced ticks for a value axis starting at zero. */
export function niceScale(max, ticks = 3) {
  const m = Number(max) || 0
  if (m <= 0) return { max: 1, ticks: [0, 1] }
  const rough = m / ticks
  const pow = Math.pow(10, Math.floor(Math.log10(rough)))
  const step = [1, 2, 2.5, 5, 10].map((f) => f * pow).find((s) => s >= rough) || 10 * pow
  const top = Math.ceil(m / step) * step
  const out = []
  for (let v = 0; v <= top + step / 1000; v += step) out.push(Math.round(v * 100) / 100)
  return { max: top, ticks: out }
}

/** Which points get an x-axis label: first, last and a few evenly spaced between, never more than `max`. */
export function labelIndexes(n, max = 5) {
  if (n <= 0) return []
  if (n <= max) return Array.from({ length: n }, (_, i) => i)
  const out = new Set([0, n - 1])
  for (let k = 1; k < max - 1; k++) out.add(Math.round((k * (n - 1)) / (max - 1)))
  return [...out].sort((a, b) => a - b)
}

/** The point nearest to a horizontal position x inside a plot that starts at `left` and is `width` wide. */
export function nearestIndex(x, left, width, n) {
  if (n <= 1) return 0
  const t = (x - left) / width
  return Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))))
}

/** Direction and size of a change for the small trend badges. Null when no percentage can honestly be shown. */
export function changeInfo(percent) {
  if (percent == null || Number.isNaN(Number(percent))) return null
  const p = Number(percent)
  if (Math.abs(p) < 0.05) return { dir: 'flat', text: '0%' }
  return { dir: p > 0 ? 'up' : 'down', text: `${Math.abs(p).toLocaleString('en-NG', { maximumFractionDigits: 1 })}%` }
}
