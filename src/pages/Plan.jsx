import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { ErrorBox, Skeleton, useLoad, useToast } from '../components.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { daysLeft, dateOnly, money } from '../lib/format.js'
import { CompareTable, PlanCards } from './Pricing.jsx'

const STATUS = {
  TRIALING: ['Free trial', 'ok'], ACTIVE: ['Active', 'ok'], PAST_DUE: ['Payment due', 'warn'], GRACE_PERIOD: ['Renew now', 'warn'],
  FREE: ['Free plan', 'ok'], CANCELLED: ['Cancelled', 'gray'], EXPIRED: ['Expired (read-only)', 'danger'], SUSPENDED: ['Suspended', 'danger'],
}

export default function Plan() {
  const [annual, setAnnual] = useState(false)
  const cur = useLoad(() => api.get('/subscriptions/current'), [])
  const plans = useLoad(() => api.public.get('/subscriptions/plans'), [])
  const s = cur.data
  const toast = useToast()
  const { can } = useAuth()
  async function goFree() {
    if (!window.confirm('Move to the Free plan? Nothing is deleted, but features and limits beyond Free stop for new activity.')) return
    try { await api.post('/subscriptions/choose-free'); toast('You are on the Free plan'); cur.reload() } catch (e) { toast(e.message, 'error') }
  }
  const [params, setParams] = useSearchParams()
  const [busy, setBusy] = useState('')
  const [quote, setQuote] = useState(null)
  const pays = useLoad(() => api.get('/subscriptions/payments'), [])
  const status = useLoad(() => api.get('/subscriptions/billing-status'), [])
  // Back from Paystack: ask OUR server to confirm with Paystack. The redirect alone never activates anything.
  useEffect(() => {
    const ref = params.get('reference') || params.get('trxref')
    if (!ref) return
    setParams({}, { replace: true })
    setBusy('verify')
    api.post('/subscriptions/verify', { reference: ref })
      .then((r) => { toast(r.status === 'SUCCESS' ? 'Payment confirmed. Your plan is active.' : r.status === 'PENDING' ? 'We have not received confirmation yet. This page will update once Paystack confirms.' : 'The payment did not go through.', r.status === 'SUCCESS' ? undefined : 'error'); cur.reload(); pays.reload() })
      .catch((e) => toast(e.message, 'error')).finally(() => setBusy(''))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function choose(p) {
    try { setQuote(await api.get('/subscriptions/quote', { plan: p.code, cycle: annual ? 'ANNUAL' : 'MONTHLY' })) } catch (e) { toast(e.message, 'error') }
  }
  async function pay() {
    setBusy('pay')
    try { const c = await api.post('/subscriptions/checkout', { planCode: quote.planCode, cycle: quote.cycle }); window.location.assign(c.authorizationUrl) } catch (e) { toast(e.message, 'error'); setBusy('') }
  }
  async function cancelPlan() {
    if (!window.confirm('Cancel your plan? You keep full access until the current period ends, then you move to the Free plan. Nothing is deleted.')) return
    try { await api.post('/subscriptions/cancel'); toast('Plan cancelled. Access continues until the period ends.'); cur.reload() } catch (e) { toast(e.message, 'error') }
  }
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
          {s.lapsedFrom && <div className="pad"><div className="banner">Your {s.lapsedFrom} plan has ended, so your business is on the Free plan. Your records are all kept.</div></div>}
          {s.periodEnd && s.status !== 'FREE' && <div className="kv"><span className="k">{s.status === 'TRIALING' ? 'Trial ends' : 'Current period ends'}</span><span className="v">{dateOnly(s.periodEnd)}{s.status === 'TRIALING' && ` (${daysLeft(s.periodEnd)} days left)`}</span></div>}
          {!s.writable && <div className="pad"><div className="banner danger">Your account is read-only. Your data is safe and you can still view everything. Choose a plan below to record new activity.</div></div>}
        </section>
      )}
      {busy === 'verify' && <div className="banner">Confirming your payment with Paystack…</div>}
      {status.data && !status.data.configured && <div className="banner">Online payment for plans is not switched on for this server yet. Contact AMSATI to activate your plan.</div>}
      {s?.status === 'ACTIVE' && s.planCode !== 'FREE' && can('SUBSCRIPTION_MANAGE') && <button className="btn" onClick={cancelPlan}>Cancel plan</button>}
      {quote && (
        <section className="section pad stack">
          <h2>{quote.kind === 'RENEWAL' ? 'Renew' : 'Pay for'} {quote.planName} ({quote.cycle === 'ANNUAL' ? 'yearly' : 'monthly'})</h2>
          <div className="kv"><span className="k">Plan price</span><span className="v num">{money(quote.listPrice)}</span></div>
          {Number(quote.credit) > 0 && <div className="kv"><span className="k">Credit for unused time on your current plan</span><span className="v num">-{money(quote.credit)}</span></div>}
          <div className="kv"><span className="k"><b>Pay now</b></span><span className="v num"><b>{money(quote.amount)}</b></span></div>
          <p className="muted small">Paid securely with Paystack. Your plan becomes active only after Paystack confirms the payment. This is a one-time payment for the period; we do not charge your card automatically.</p>
          <div className="row"><button className="btn primary" disabled={busy === 'pay' || !status.data?.configured} onClick={pay}>{busy === 'pay' ? 'Opening Paystack…' : 'Pay with Paystack'}</button><button className="btn" onClick={() => setQuote(null)}>Back</button></div>
        </section>
      )}
      <div className="seg" style={{ maxWidth: 320 }} role="group" aria-label="Billing period">
        <button className={`chip ${!annual ? 'on' : ''}`} aria-pressed={!annual} onClick={() => setAnnual(false)}>Monthly</button>
        <button className={`chip ${annual ? 'on' : ''}`} aria-pressed={annual} onClick={() => setAnnual(true)}>Yearly</button>
      </div>
      <ErrorBox error={plans.error} onRetry={plans.reload} />
      {plans.data && <><PlanCards plans={plans.data} annual={annual} renderAction={(p) => (s?.planCode === p.code ? <span className="badge">Your current plan</span> : Number(p.monthlyPrice) === 0 && can('BILLING_MANAGE') ? <button className="btn block" onClick={goFree}>Switch to Free</button> : Number(p.monthlyPrice) > 0 && can('SUBSCRIPTION_MANAGE') ? <button className="btn primary block" onClick={() => choose(p)}>{s?.planCode === p.code ? 'Renew' : 'Choose plan'}</button> : null)} /><CompareTable plans={plans.data} /></>}
      {pays.data?.length > 0 && (
        <section className="section"><h2 className="section-title">Payment history</h2>
          {pays.data.map((x) => <div key={x.id} className="list-item"><div className="grow"><div className="title">{x.planCode} {x.cycle === 'ANNUAL' ? 'yearly' : 'monthly'}</div><div className="meta">{dateOnly(x.paidAt || x.createdAt)}{x.note ? ` - ${x.note}` : ''}</div></div><div style={{ textAlign: 'right' }}><div className="num">{money(x.amount)}</div><span className={`badge ${x.status === 'SUCCESS' ? 'ok' : x.status === 'PENDING' ? 'warn' : 'danger'}`}>{x.status.toLowerCase()}</span></div></div>)}
        </section>
      )}
    </div>
  )
}
