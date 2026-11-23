import { Link } from 'react-router-dom'
import { daysLeft } from '../lib/format.js'

export function SubscriptionBanner({ sub }) {
  if (!sub) return null
  if (sub.status === 'TRIALING') {
    const d = daysLeft(sub.periodEnd)
    return <div className={`banner ${d <= 3 ? 'warn' : ''}`}>Free trial: {d} {d === 1 ? 'day' : 'days'} left. <Link to="/more/plan">See plans</Link></div>
  }
  if (sub.status === 'GRACE_PERIOD') return <div className="banner warn">Your subscription has ended. You have a few days to renew. <Link to="/more/plan">See plans</Link></div>
  if (sub.status === 'EXPIRED' || sub.status === 'SUSPENDED') {
    return <div className="banner danger">Your account is read-only. Your data is safe. <Link to="/more/plan">Renew to record new sales</Link></div>
  }
  return null
}

export function Kpi({ label, value, hint, to, tone = '', delta, tip, unavailable }) {
  const body = (
    <>
      <div className="label">{label}{tip && <span className="info" title={tip} aria-label={tip} role="img">i</span>}</div>
      <div className="value num">{unavailable ? '—' : value}</div>
      {delta && <div className={`delta ${delta.dir}${delta.badUp && delta.dir === 'up' ? ' bad-up' : ''}`}>{delta.dir === 'up' ? '▲' : delta.dir === 'down' ? '▼' : '–'} {delta.text}<span className="muted"> vs before</span></div>}
      {(hint || unavailable) && <div className="hint">{unavailable || hint}</div>}
    </>
  )
  return to ? <Link to={to} className={`kpi accent ${tone}`}>{body}</Link> : <div className={`kpi accent ${tone}`}>{body}</div>
}
