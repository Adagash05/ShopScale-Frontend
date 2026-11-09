import { useState } from 'react'
import { api } from '../lib/api'
import { ErrorBox, Skeleton, useLoad } from '../components.jsx'
import { daysLeft, dateOnly } from '../lib/format.js'
import { CompareTable, PlanCards } from './Pricing.jsx'

const STATUS = {
  TRIALING: ['Free trial', 'ok'], ACTIVE: ['Active', 'ok'], PAST_DUE: ['Payment due', 'warn'], GRACE_PERIOD: ['Renew now', 'warn'],
  CANCELLED: ['Cancelled', 'gray'], EXPIRED: ['Expired (read-only)', 'danger'], SUSPENDED: ['Suspended', 'danger'],
}

export default function Plan() {
  const [annual, setAnnual] = useState(false)
  const cur = useLoad(() => api.get('/subscriptions/current'), [])
  const plans = useLoad(() => api.public.get('/subscriptions/plans'), [])
  const s = cur.data
  const [label, tone] = STATUS[s?.status] || ['', 'gray']

  return (
    <div className="stack">
      <div className="page-head"><div><h1>Plan and billing</h1></div></div>
      <ErrorBox error={cur.error} onRetry={cur.reload} />
      {!s && !cur.error && <Skeleton height={120} />}
      {s && (
        <section className="section">
          <div className="kv"><span className="k">Current plan</span><span className="v">{s.planName}</span></div>
          <div className="kv"><span className="k">Status</span><span className={`badge ${tone}`}>{label}</span></div>
          <div className="kv"><span className="k">{s.status === 'TRIALING' ? 'Trial ends' : 'Current period ends'}</span><span className="v">{dateOnly(s.periodEnd)}{s.status === 'TRIALING' && ` (${daysLeft(s.periodEnd)} days left)`}</span></div>
          {!s.writable && <div className="pad"><div className="banner danger">Your account is read-only. Your data is safe and you can still view everything. Choose a plan below to record new activity.</div></div>}
        </section>
      )}
      <div className="banner">Paying for a plan inside the app is being finished. Until then, contact AMSATI to activate or change your plan, and your trial keeps running as shown above.</div>
      <div className="seg" style={{ maxWidth: 320 }} role="group" aria-label="Billing period">
        <button className={`chip ${!annual ? 'on' : ''}`} aria-pressed={!annual} onClick={() => setAnnual(false)}>Monthly</button>
        <button className={`chip ${annual ? 'on' : ''}`} aria-pressed={annual} onClick={() => setAnnual(true)}>Yearly</button>
      </div>
      <ErrorBox error={plans.error} onRetry={plans.reload} />
      {plans.data && <><PlanCards plans={plans.data} annual={annual} renderAction={(p) => (s?.planCode === p.code ? <span className="badge">Your current plan</span> : null)} /><CompareTable plans={plans.data} /></>}
    </div>
  )
}
