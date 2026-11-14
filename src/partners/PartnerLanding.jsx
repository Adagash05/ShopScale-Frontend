import { useMemo, useState } from 'react'
import { SmartLink as Link } from '../lib/SmartLink.jsx'
import { api } from '../lib/api'
import { ErrorBox, Skeleton, useLoad } from '../components.jsx'
import { useSeo } from '../marketing/Seo.jsx'
import { estimate, paidPlans } from './calc.js'
import { money, pct } from './ui.jsx'
import './partners.css'

/** The public "/partners" page. Every number on it comes from the live programme settings and the real plan prices. */
export default function PartnerLanding() {
  useSeo({ title: 'ShopScale Partners: earn by recommending ShopScale', description: 'Recommend ShopScale to Nigerian businesses and earn a commission on the subscription payments we actually receive from them.', path: '/partners' })
  const programme = useLoad(() => api.public.get('/public/partners/programme'), [])
  const plans = useLoad(() => api.public.get('/subscriptions/plans'), [])
  const p = programme.data
  const paid = useMemo(() => paidPlans(plans.data), [plans.data])

  return (
    <>
      <section className="mk-hero">
        <div className="mk-wrap">
          <span className="pt-tag">ShopScale Partners</span>
          <h1 style={{ marginTop: 14 }}>Recommend ShopScale. Earn when businesses subscribe.</h1>
          <p className="lead">
            If you teach, create content for or work with Nigerian shop owners, restaurants and caterers, join the partner programme.
            {p ? <> You earn <b>{pct(p.commissionRate)}</b> of every subscription payment ShopScale actually receives from the businesses you refer, for their first <b>{p.commissionMonths} months</b>.</> : null}
          </p>
          <div className="row wrap" style={{ marginTop: 22 }}>
            <Link to="/partners/apply" className="btn primary">Apply to become a partner</Link>
            <Link to="/partners/login" className="btn">Partner sign in</Link>
          </div>
          {p && !p.active && <p className="form-error" style={{ marginTop: 12 }} role="status">Applications are closed at the moment. Please check back later.</p>}
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-wrap">
          <h2>How it works</h2>
          <div className="pt-steps" style={{ marginTop: 20 }}>
            <div className="pt-step"><h3>Apply and get approved</h3><p className="muted">Tell us about your audience and how you will share ShopScale. Our team reviews every application. Approved partners get a personal link and code.</p></div>
            <div className="pt-step"><h3>Share your link</h3><p className="muted">When someone signs up through your link and later subscribes, they are attributed to you{p ? <> if they register within {p.attributionDays} days of clicking. If they open more than one partner's link, the most recent one counts</> : null}.</p></div>
            <div className="pt-step"><h3>Get paid</h3><p className="muted">Commission is earned only on real, successful subscription payments. {p ? <>It is held for {p.holdingDays} days, then becomes available. Once you have {money(p.minWithdrawal)} available, request a bank transfer.</> : null}</p></div>
          </div>
        </div>
      </section>

      <section className="mk-section alt">
        <div className="mk-wrap">
          <h2>What you earn on each plan</h2>
          <p className="intro">These are our real plan prices today{p ? <>, at the current commission rate of {pct(p.commissionRate)}</> : null}. Commission is calculated on the amount actually paid, after any discount.</p>
          {(programme.error || plans.error) && <div style={{ marginTop: 16 }}><ErrorBox error={programme.error || plans.error} onRetry={() => { programme.reload(); plans.reload() }} /></div>}
          {(programme.loading || plans.loading) && <div style={{ marginTop: 16 }}><Skeleton height={120} /></div>}
          {p && paid.length > 0 && (
            <div className="pt-card scroll-x" style={{ marginTop: 20, padding: 0 }}>
              <table className="pt-table">
                <thead><tr><th scope="col">Plan</th><th scope="col" className="r">Monthly payment</th><th scope="col" className="r">You earn per month</th><th scope="col" className="r">Yearly payment</th><th scope="col" className="r">You earn per year</th></tr></thead>
                <tbody>
                  {paid.map((pl) => {
                    const m = estimate({ plan: pl, cycle: 'MONTHLY', customers: 1, programme: p })
                    const a = estimate({ plan: pl, cycle: 'ANNUAL', customers: 1, programme: p })
                    return <tr key={pl.code}><td><b>{pl.name}</b></td><td className="r num">{money(pl.monthlyPrice)}</td><td className="r num">{money(m.perPayment)}</td><td className="r num">{money(pl.annualPrice)}</td><td className="r num">{money(a.perPayment)}</td></tr>
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-wrap">
          <h2>Estimate your earnings</h2>
          <p className="intro">Try different numbers. This is arithmetic on our real prices, not a forecast.</p>
          {p && paid.length > 0 ? <Calculator plans={paid} programme={p} /> : <p className="muted" style={{ marginTop: 16 }}>The calculator appears once plans have loaded.</p>}
        </div>
      </section>

      <section className="mk-section alt">
        <div className="mk-wrap">
          <h2>The terms, plainly</h2>
          <div className="pt-two" style={{ marginTop: 18 }}>
            <div className="pt-card"><h2>What earns commission</h2>
              <ul className="stack-sm" style={{ paddingLeft: 18 }}>
                <li>Successful subscription payments received by ShopScale from businesses you referred.</li>
                <li>{p ? <>The first {p.commissionMonths} months of each referred customer's subscription, counted from their first successful payment.</> : 'The first months of each referred customer’s subscription.'}</li>
                <li>Renewals inside that period, on monthly and yearly plans, without counting the same time twice.</li>
              </ul></div>
            <div className="pt-card"><h2>What does not</h2>
              <ul className="stack-sm" style={{ paddingLeft: 18 }}>
                <li>Clicks, sign-ups, free use or trials.</li>
                <li>Failed, unpaid or abandoned payments.</li>
                <li>Refunded or charged-back payments: the matching commission is reversed, and deducted from later earnings if it was already paid.</li>
                <li>Signing yourself or your own business up, or two accounts for one person.</li>
              </ul></div>
            <div className="pt-card"><h2>Payouts</h2>
              <ul className="stack-sm" style={{ paddingLeft: 18 }}>
                <li>{p ? <>Held {p.holdingDays} days after each payment, then available.</> : 'Held briefly after each payment, then available.'}</li>
                <li>{p ? <>Withdraw once you have {money(p.minWithdrawal)} available.</> : 'A minimum balance applies.'}</li>
                <li>Paid by bank transfer in naira after our team approves the request. We record the transfer reference on your account.</li>
              </ul></div>
            <div className="pt-card"><h2>Fair play</h2>
              <ul className="stack-sm" style={{ paddingLeft: 18 }}>
                <li>Show the real product and say that you are a partner.</li>
                <li>Do not promise businesses income or results.</li>
                <li>We may decline or end a partnership that breaks these rules.</li>
              </ul></div>
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-wrap pt-faq">
          <h2>Questions</h2>
          <div style={{ marginTop: 14 }}>
            <details><summary>Does it cost anything to join?</summary><p>No. Applying and being a partner is free.</p></details>
            <details><summary>How do I know a customer came from me?</summary><p>Your dashboard shows clicks, sign-ups, paying customers and every commission, with each customer's name shortened to protect their privacy.</p></details>
            <details><summary>What if a customer cancels or asks for a refund?</summary><p>You keep commission on payments that stay paid. If a payment is refunded, the commission on it is reversed.</p></details>
            <details><summary>Can the terms change?</summary><p>Our team can change the programme settings. A change never alters commission you have already earned, and customers you have already referred keep the terms that applied when they signed up.</p></details>
            <details><summary>Can I promise businesses they will make money with ShopScale?</summary><p>No. Please describe what the product really does and leave out income promises.</p></details>
          </div>
          <div className="row wrap" style={{ marginTop: 24 }}>
            <Link to="/partners/apply" className="btn primary">Apply to become a partner</Link>
            <Link to="/contact" className="btn">Ask us a question</Link>
          </div>
        </div>
      </section>
    </>
  )
}

function Calculator({ plans, programme }) {
  const [code, setCode] = useState(plans[0].code)
  const [cycle, setCycle] = useState('MONTHLY')
  const [customers, setCustomers] = useState(10)
  const plan = plans.find((x) => x.code === code) || plans[0]
  const r = estimate({ plan, cycle, customers, programme })
  return (
    <div className="pt-calc" style={{ marginTop: 20 }}>
      <div className="pt-card stack">
        <div className="field"><label htmlFor="calc-plan">Plan your referred customers choose</label>
          <select id="calc-plan" className="select" value={plan.code} onChange={(e) => setCode(e.target.value)}>
            {plans.map((x) => <option key={x.code} value={x.code}>{x.name}</option>)}
          </select></div>
        <div className="field"><span id="calc-cycle" style={{ fontWeight: 600 }}>They pay</span>
          <div className="chips" role="group" aria-labelledby="calc-cycle">
            <button type="button" className={`chip ${cycle === 'MONTHLY' ? 'on' : ''}`} aria-pressed={cycle === 'MONTHLY'} onClick={() => setCycle('MONTHLY')}>Monthly · {money(plan.monthlyPrice)}</button>
            <button type="button" className={`chip ${cycle === 'ANNUAL' ? 'on' : ''}`} aria-pressed={cycle === 'ANNUAL'} onClick={() => setCycle('ANNUAL')}>Yearly · {money(plan.annualPrice)}</button>
          </div></div>
        <div className="field"><label htmlFor="calc-n">Paying customers you refer: <b>{customers}</b></label>
          <input id="calc-n" type="range" min="1" max="200" value={customers} onChange={(e) => setCustomers(Number(e.target.value))} /></div>
        <p className="pt-note">Illustration only. It assumes every referred customer pays on time for the whole commission period. Real earnings depend on who subscribes, to which plan, and whether they keep paying; they are not guaranteed.</p>
      </div>
      <div className="pt-result" aria-live="polite">
        <small>Commission per payment</small>
        <div className="big">{money(r.perPayment)}</div>
        <small>Per customer over {programme.commissionMonths} months ({r.payments} {r.payments === 1 ? 'payment' : 'payments'})</small>
        <div style={{ fontSize: '1.25rem', fontWeight: 700 }} className="num">{money(r.perCustomer)}</div>
        <small>For {customers} {customers === 1 ? 'customer' : 'customers'} over {programme.commissionMonths} months</small>
        <div className="big">{money(r.total)}</div>
      </div>
    </div>
  )
}
