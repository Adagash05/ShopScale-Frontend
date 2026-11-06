import { Link } from 'react-router-dom'
import { AlertTriangle, CircleAlert, Info } from 'lucide-react'
import { api } from '../lib/api'
import { ErrorBox, Skeleton, useLoad } from '../components.jsx'
import { rangeQuery } from '../lib/format.js'

const SEVERITY = {
  ATTENTION: { icon: CircleAlert, cls: '', color: 'var(--danger)', bg: '#fef2f2', label: 'Needs attention' },
  WARNING: { icon: AlertTriangle, cls: 'warn', color: '#b45309', bg: '#fffbeb', label: 'Worth a look' },
  INFO: { icon: Info, cls: 'gray', color: 'var(--blue-deep)', bg: 'var(--blue-light)', label: 'Good to know' },
}

/** Deterministic insights from the server. Each one says what it is based on and where to fix it. */
export default function Insights({ range, from, to }) {
  const ready = range !== 'custom' || (from && to)
  const d = useLoad(() => (ready ? api.get('/insights', rangeQuery(range, from, to)) : Promise.resolve([])), [range, from, to])
  if (d.loading) return <section className="section pad stack-sm"><Skeleton height={16} width="40%" /><Skeleton height={14} /></section>
  if (d.error) return <ErrorBox error={d.error} onRetry={d.reload} />
  if (!d.data || d.data.length === 0) {
    return <section className="section pad"><strong>Nothing needs your attention right now.</strong><p className="muted small">We check stock, margins, customers who owe you and changes in sales and spending. Anything important will show up here.</p></section>
  }
  return (
    <section className="stack-sm" aria-label="What needs your attention">
      <h2>What needs your attention</h2>
      {d.data.map((i) => {
        const s = SEVERITY[i.severity] || SEVERITY.INFO
        const Icon = s.icon
        return (
          <article key={i.id} className="section" style={{ borderLeft: `4px solid ${s.color}` }}>
            <div className="pad stack-sm">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <span className="feed-icon" style={{ background: s.bg, color: s.color, flexShrink: 0 }}><Icon size={18} aria-hidden="true" /></span>
                <div className="grow"><div className="title">{i.title}</div><div className="muted small">{i.detail}</div></div>
              </div>
              {i.items?.length > 0 && (
                <div className="list" style={{ border: '1px solid var(--line)', borderRadius: 10 }}>
                  {i.items.map((it, k) => (
                    <Link key={k} to={it.path} className="list-item" style={{ minHeight: 48, padding: '8px 12px' }}>
                      <div className="grow"><div className="title small">{it.label}</div><div className="meta">{it.note}</div></div>
                    </Link>
                  ))}
                </div>
              )}
              <div className="row between wrap">
                <Link to={i.actionPath} className="btn sm">{i.actionLabel}</Link>
                <details className="small muted"><summary style={{ cursor: 'pointer' }}>How do we know?</summary><p style={{ marginTop: 6, maxWidth: 520 }}>{i.basis}</p></details>
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
