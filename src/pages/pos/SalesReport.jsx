import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { ErrorBox, ListSkeleton, RangePicker, useLoad } from '../../components.jsx'
import { money, rangeQuery } from '../../lib/format.js'

const GROUPS = [['employee', 'By employee'], ['branch', 'By location'], ['method', 'By payment type'], ['channel', 'By sales channel']]
const CHANNEL = { POS: 'Till sales', ORDER: 'Customer orders', ONLINE: 'Online store', RESTAURANT: 'Restaurant', CATERING: 'Catering' }
const METHOD = { CASH: 'Cash', TRANSFER: 'Bank transfer', CARD: 'Card' }

export default function SalesReport() {
  const [sp, setSp] = useSearchParams()
  const range = sp.get('range') || 'thisMonth'
  const from = sp.get('from') || ''
  const to = sp.get('to') || ''
  const [group, setGroup] = useState('employee')
  const ready = range !== 'custom' || (from && to)
  const r = useLoad(() => (ready ? api.get('/sales/report', { groupBy: group, ...rangeQuery(range, from, to) }) : Promise.resolve(null)), [group, range, from, to])
  const label = (l) => (group === 'channel' ? CHANNEL[l.key] || l.label : group === 'method' ? METHOD[l.key] || l.label : l.label)
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Sales reports</h1><p className="sub">Returns are already taken off</p></div></div>
      <div className="seg" role="group" aria-label="Group by">{GROUPS.map(([id, text]) => <button key={id} className={`chip ${group === id ? 'on' : ''}`} aria-pressed={group === id} onClick={() => setGroup(id)}>{text}</button>)}</div>
      <RangePicker value={range} from={from} to={to} onChange={({ range: x, from: f, to: t }) => setSp(x === 'custom' ? { range: x, ...(f ? { from: f } : {}), ...(t ? { to: t } : {}) } : { range: x }, { replace: true })} />
      <ErrorBox error={r.error} onRetry={r.reload} />
      {r.loading && <ListSkeleton rows={3} />}
      {r.data && (
        <section className="section pad stack-sm">
          <div className="kv"><strong>Total</strong><strong className="num">{money(r.data.total)}</strong></div>
          {r.data.lines.length === 0 && <p className="muted">No sales in this period.</p>}
          {r.data.lines.map((l) => (
            <div className="kv" key={l.key}>
              <span className="k">{label(l)} <span className="muted small">· {l.count} {group === 'method' ? 'payments' : 'sales'}</span></span>
              <span className="num">{money(l.total)}{l.profit != null ? <span className="muted small"> · profit {money(l.profit)}</span> : null}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
