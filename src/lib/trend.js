import { dateOnly } from './format.js'

const dayLabel = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })

/** Turn the server's trend into chart points for the chosen view. Only the day view carries the previous period line. */
export function trendPoints(trend, view) {
  if (!trend) return []
  if (view === 'week') return (trend.weekly || []).map((b) => ({ label: dayLabel(b.start), title: `Week of ${dateOnly(b.start)}`, value: Number(b.total) }))
  if (view === 'month') return (trend.monthly || []).map((b) => ({ label: new Date(b.start + 'T00:00:00').toLocaleDateString('en-NG', { month: 'short', year: '2-digit' }), title: new Date(b.start + 'T00:00:00').toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }), value: Number(b.total) }))
  return (trend.daily || []).map((p) => ({ label: dayLabel(p.date), title: dateOnly(p.date), value: Number(p.sales), previous: p.previousSales == null ? null : Number(p.previousSales) }))
}

