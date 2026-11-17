import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { track, trackOnce } from '../analytics/analytics.js'
import { api } from '../lib/api'
import { ErrorBox, Skeleton, useLoad, useToast } from '../components.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { daysLeft, dateOnly, money } from '../lib/format.js'
import { CompareTable, PlanCards } from './Pricing.jsx'

const STATUS = {
  TRIALING: ['Free trial', 'ok'], ACTIVE: ['Active', 'ok'], PAST_DUE: ['Payment due', 'warn'], GRACE_PERIOD: ['Renew now', 'warn'],
  FREE: ['Free plan', 'ok'], CANCELLED: ['Cancelled', 'gray'], EXPIRED: ['Expired (read-only)', 'danger'], SUSPENDED: ['Suspended', 'danger'],
}

// A payment reference is kept on this device until OUR server reports a final answer (success, failed or mismatch), so a dropped connection
// or a slow Paystack confirmation never loses it. The redirect alone proves nothing: only POST /subscriptions/verify can activate a plan.
const PENDING_KEY = 'shopscale.pendingPayment'
const readPending = () => { try { const v = JSON.parse(localStorage.getItem(PENDING_KEY)); return v && Date.now() - v.at < 7 * 86400000 ? v : null } catch { return null } }
const writePending = (reference) => { try { localStorage.setItem(PENDING_KEY, JSON.stringify({ reference, at: Date.now() })) } catch { /* private mode */ } }
const clearPending = () => { try { localStorage.removeItem(PENDING_KEY) } catch { /* ignore */ } }

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
  useEffect(() => { track('view_pricing', { source: 'app' }) }, [])
  const pays = useLoad(() => api.get('/subscriptions/payments'), [])
  const status = useLoad(() => api.get('/subscriptions/billing-status'), [])
  const billing = useLoad(() => (can('SUBSCRIPTION_VIEW') ? api.get('/subscriptions/billing') : Promise.resolve(null)), [])
  const [unconfirmed, setUnconfirmed] = useState(null)   // a reference we could not confirm yet
  const tries = useRef(0)
  const refreshAll = useCallback(() => { cur.reload(); pays.reload(); billing.reload() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Ask OUR server to confirm with Paystack. Keeps the reference until the answer is final.
  const verify = useCallback(async (ref) => {
    setBusy('verify')
    try {
      const r = await api.post('/subscriptions/verify', { reference: ref })
      if (r.status === 'SUCCESS') {
        clearPending(); setUnconfirmed(null)
        await reportPurchase(ref)
        toast('Payment confirmed. Your plan is active.')
      } else if (r.status === 'FAILED' || r.status === 'MISMATCH') {
        clearPending(); setUnconfirmed(null)
        toast(r.status === 'MISMATCH' ? 'We received a payment that does not match this order. Nothing was activated. Contact support with your payment reference.' : 'The payment did not go through. Nothing was charged to your plan.', 'error')
      } else {
        setUnconfirmed(ref)   // PENDING: Paystack has not confirmed it (yet)
      }
      refreshAll()
    } catch (e) {
      setUnconfirmed(ref)     // network trouble: the reference is still stored, so this can be retried
      toast('We could not check your payment just now. It is saved, so you can check again.', 'error')
    } finally { setBusy('') }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Back from Paystack (or a reference left from an earlier visit). The reference goes into storage BEFORE it leaves the address bar.
  useEffect(() => {
    const fromUrl = params.get('reference') || params.get('trxref')
    if (fromUrl) { writePending(fromUrl); setParams({}, { replace: true }) }
    const ref = fromUrl || readPending()?.reference
    if (ref) verify(ref)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // While Paystack has not confirmed, look again a few times on a gentle schedule.
  useEffect(() => {
    if (!unconfirmed || tries.current >= 5) return undefined
    const t = setTimeout(() => { tries.current += 1; verify(unconfirmed) }, 8000 * (tries.current + 1))
    return () => clearTimeout(t)
  }, [unconfirmed, verify])
  // Reported only after OUR backend says the payment is SUCCESS (it asked Paystack itself). A bare redirect never gets here.
  async function reportPurchase(ref) {
    try {
      const list = await api.get('/subscriptions/payments')
      const p = list.find((x) => x.reference === ref && x.status === 'SUCCESS')
      if (!p) return
      const item = { item_id: p.planCode, item_name: p.planCode, price: Number(p.amount), quantity: 1 }
      trackOnce(`purchase:${ref}`, 'purchase', { transaction_id: ref, currency: 'NGN', value: Number(p.amount), billing_cycle: p.cycle === 'ANNUAL' ? 'annual' : 'monthly', items: [item] })
      let pre = null
      try { pre = JSON.parse(localStorage.getItem('shopscale.checkout.' + ref)) } catch { pre = null }
      if (pre?.upgrade) trackOnce(`upgrade:${ref}`, 'plan_upgrade', { transaction_id: ref, from_plan: pre.from, to_plan: p.planCode })
      try { localStorage.removeItem('shopscale.checkout.' + ref) } catch { /* ignore */ }
    } catch { /* analytics only */ }
  }
  async function choose(p) {
    track('select_plan', { item_id: p.code, item_name: p.name, billing_cycle: annual ? 'annual' : 'monthly' })
    try { setQuote(await api.get('/subscriptions/quote', { plan: p.code, cycle: annual ? 'ANNUAL' : 'MONTHLY' }))} catch (e) { toast(e.message, 'error') }
  }
  async function pay() {
    setBusy('pay')
    try { const c = await api.post('/subscriptions/checkout', { planCode: quote.planCode, cycle: quote.cycle })
      writePending(c.reference)
      try {
        const order = (plans.data || []).map((x) => x.code)
        const up = quote.kind === 'CHANGE' && order.indexOf(quote.planCode) > order.indexOf(s?.planCode)
        localStorage.setItem('shopscale.checkout.' + c.reference, JSON.stringify({ from: s?.planCode, upgrade: up }))
      } catch { /* ignore */ }
      track('begin_checkout', { currency: 'NGN', value: Number(quote.amount), billing_cycle: quote.cycle === 'ANNUAL' ? 'annual' : 'monthly', items: [{ item_id: quote.planCode, item_name: quote.planName, price: Number(quote.amount), quantity: 1 }] })
      window.location.assign(c.authorizationUrl) } catch (e) { toast(e.message, 'error'); setBusy('') }
  }
  async function cancelPlan() {
    if (!window.confirm(`Cancel your subscription? Automatic renewal stops and you will not be charged again. You keep full access until ${s?.periodEnd ? dateOnly(s.periodEnd) : 'the current period ends'}, then you move to the Free plan. Nothing is deleted.`)) return
    try { await api.post('/subscriptions/cancel'); toast('Subscription cancelled. No further charges. Access continues until the period ends.'); refreshAll() } catch (e) { toast(e.message, 'error') }
  }
  // Resuming a cancelled plan that is still inside its paid period. Cancelling is the only way a customer stops renewal.
  async function resumePlan() {
    try { await api.post('/subscriptions/auto-renew', { enabled: true }); toast('Subscription resumed. It will renew automatically.'); refreshAll() } catch (e) { toast(e.message, 'error') }
  }
  // "Update payment method": paying for the current plan saves the card used for that payment in place of the old one.
  function updateMethod() {
    const p = (plans.data || []).find((x) => x.code === s.planCode)
    if (!p) return
    api.get('/subscriptions/quote', { plan: p.code, cycle: s.billingCycle || 'MONTHLY' }).then((q) => { setQuote(q) }).catch((e) => toast(e.message, 'error'))
  }
  const [label, tone] = STATUS[s?.status] || ['', 'gray']
  const b = billing.data

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
      {unconfirmed && busy !== 'verify' && (
        <div className="banner warn stack-sm" role="status">
          <span>Your payment (reference {unconfirmed}) has not been confirmed yet. Your plan changes only once Paystack confirms it. If you paid, this can take a few minutes.</span>
          <span><button className="btn sm" onClick={() => { tries.current = 0; verify(unconfirmed) }}>Check payment status</button></span>
        </div>
      )}
      {status.data && !status.data.configured && <div className="banner">Online payment for plans is not switched on for this server yet. Contact ShopScale Support to activate your plan.</div>}
      {b && s && s.planCode !== 'FREE' && s.status !== 'TRIALING' && (
        <section className="section" aria-label="Automatic renewal">
          <div className="kv"><span className="k">Automatic renewal</span><span className={`badge ${b.autoRenew ? 'ok' : s.status === 'CANCELLED' ? 'gray' : 'warn'}`}>{b.autoRenew ? 'On' : s.status === 'CANCELLED' ? 'Cancelled' : 'Not active'}</span></div>
          {b.autoRenew && <div className="kv"><span className="k">Next renewal</span><span className="v">{dateOnly(b.nextRenewalAt)}{b.nextRenewalAmount != null ? ` · ${money(b.nextRenewalAmount)} (${b.cycle === 'ANNUAL' ? 'yearly' : 'monthly'})` : ''}</span></div>}
          {b.paymentMethod && <div className="kv"><span className="k">Payment method</span><span className="v">{[b.paymentMethod.brand, b.paymentMethod.bank].filter(Boolean).join(' ') || 'Card'} •••• {b.paymentMethod.last4}{b.paymentMethod.expMonth ? ` (exp ${b.paymentMethod.expMonth}/${b.paymentMethod.expYear})` : ''}</span></div>}
          {b.lastPayment && <div className="kv"><span className="k">Last successful payment</span><span className="v">{dateOnly(b.lastPayment.paidAt)} · {money(b.lastPayment.amount)}</span></div>}
          {b.lastRenewal?.status === 'FAILED' && s.status !== 'CANCELLED' && (
            <div className="pad"><div className="banner warn">
              The last automatic renewal failed{b.lastRenewal.failureReason ? ` (${b.lastRenewal.failureReason})` : ''}. {b.lastRenewal.nextRetryAt ? `We will try again on ${dateOnly(b.lastRenewal.nextRetryAt)}. ` : 'We will not try again automatically. '}You can pay now below, with a new card if needed.
            </div></div>
          )}
          {b.lastRenewal?.status === 'PENDING' && <div className="pad"><div className="banner">An automatic renewal is being processed or is waiting for your bank to confirm it.</div></div>}
          {s.status === 'CANCELLED' && <div className="kv"><span className="k">Access until</span><span className="v">{dateOnly(s.periodEnd)}</span></div>}
          {s.status === 'CANCELLED' && <div className="pad"><div className="banner">Your subscription is cancelled. You will not be charged again, and you keep full access until {dateOnly(s.periodEnd)}.</div></div>}
          {!b.autoRenew && s.status !== 'CANCELLED' && can('SUBSCRIPTION_MANAGE') && <div className="pad"><div className="banner warn">{b.paymentMethod ? 'Automatic renewal is not active right now.' : 'No payment method is saved, so this plan cannot renew automatically.'} Your plan ends on {dateOnly(s.periodEnd)} unless you pay below, which saves your card and turns automatic renewal on.</div></div>}
          {can('SUBSCRIPTION_MANAGE') && (
            <div className="pad row">
              {s.status === 'CANCELLED' && b.paymentMethod && s.writable && <button className="btn" onClick={resumePlan}>Resume subscription</button>}
              {b.autoRenewAvailable && s.status !== 'CANCELLED' && <button className="btn" onClick={updateMethod}>{b.paymentMethod ? 'Update payment method' : 'Add payment method'}</button>}
              {['ACTIVE', 'PAST_DUE', 'GRACE_PERIOD'].includes(s.status) && <button className="btn danger" onClick={cancelPlan}>Cancel subscription</button>}
            </div>
          )}
        </section>
      )}
      {!b && s?.status === 'ACTIVE' && s.planCode !== 'FREE' && can('SUBSCRIPTION_MANAGE') && <button className="btn danger" onClick={cancelPlan}>Cancel subscription</button>}
      {quote && (
        <section className="section pad stack">
          <h2>{quote.kind === 'RENEWAL' ? 'Renew' : 'Pay for'} {quote.planName} ({quote.cycle === 'ANNUAL' ? 'yearly' : 'monthly'})</h2>
          <div className="kv"><span className="k">Plan price</span><span className="v num">{money(quote.listPrice)}</span></div>
          {Number(quote.credit) > 0 && <div className="kv"><span className="k">Credit for unused time on your current plan</span><span className="v num">-{money(quote.credit)}</span></div>}
          <div className="kv"><span className="k"><b>Pay now</b></span><span className="v num"><b>{money(quote.amount)}</b></span></div>
          {quote.kind === 'RENEWAL' && <p className="muted small">This adds one more {quote.cycle === 'ANNUAL' ? 'year' : 'month'} after your current period ends.</p>}
          <p className="muted small">Paid securely with Paystack. Your plan becomes active only after Paystack confirms the payment.</p>
          <div className="banner" role="note">
            <b>Renews automatically.</b> The card you pay with is saved securely by Paystack, and ShopScale charges it {money(quote.listPrice)} every {quote.cycle === 'ANNUAL' ? 'year' : 'month'} for the {quote.planName} plan, starting when this period ends. You are not asked again. Cancel any time on this page to stop future charges; you keep access until the period you paid for ends.
          </div>
          {b && !b.autoRenewAvailable && <p className="form-error" role="alert">Subscription billing is not fully set up on this server yet, so payment cannot start. Contact ShopScale Support.</p>}
          <div className="row"><button className="btn primary" disabled={busy === 'pay' || !status.data?.configured || (!!b && !b.autoRenewAvailable)} onClick={pay}>{busy === 'pay' ? 'Opening Paystack…' : 'Pay with Paystack'}</button><button className="btn" onClick={() => setQuote(null)}>Back</button></div>
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
          {pays.data.map((x) => <div key={x.id} className="list-item"><div className="grow"><div className="title">{x.planCode} {x.cycle === 'ANNUAL' ? 'yearly' : 'monthly'}{x.source === 'AUTO' ? ' · automatic renewal' : ''}</div><div className="meta">{dateOnly(x.paidAt || x.createdAt)}{x.periodEnd && x.status === 'SUCCESS' ? ` · covers until ${dateOnly(x.periodEnd)}` : ''}{x.note ? ` - ${x.note}` : ''}</div></div><div style={{ textAlign: 'right' }}><div className="num">{money(x.amount)}</div><span className={`badge ${x.status === 'SUCCESS' ? 'ok' : x.status === 'PENDING' ? 'warn' : 'danger'}`}>{x.status.toLowerCase()}</span>{x.status === 'PENDING' && can('SUBSCRIPTION_MANAGE') && <div><button className="btn sm" onClick={() => verify(x.reference)}>Check status</button></div>}</div></div>)}
        </section>
      )}
    </div>
  )
}
