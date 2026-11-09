import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Minus } from 'lucide-react'
import { api } from '../lib/api'
import { ErrorBox, Skeleton, useLoad } from '../components.jsx'
import { money } from '../lib/format.js'
import { useSeo } from '../marketing/Seo.jsx'
import { FEATURE_LABELS, allFeatureKeys, annualSavings, limitText, newFeatures } from '../lib/plans.js'

export function PlanCards({ plans, annual, renderAction }) {
  return (
    <div className="plans">
      {plans.map((p, i) => {
        const gained = newFeatures(p, plans[i - 1])
        const price = annual ? p.annualPrice : p.monthlyPrice
        return (
          <section key={p.code} className={`section plan ${p.code === 'GROWTH' ? 'pop' : ''}`}>
            <div className="row between"><h2>{p.name}</h2>{p.code === 'GROWTH' && <span className="badge">Most popular</span>}</div>
            <div><span className="price num">{money(price)}</span><span className="muted"> /{annual ? 'year' : 'month'}</span>
              {annual && annualSavings(p) > 0 && <p className="small" style={{ color: 'var(--ok)' }}>You save {money(annualSavings(p))} a year</p>}</div>
            <ul>
              <li>{p.maxUsers} {p.maxUsers === 1 ? 'user' : 'users'}</li>
              <li>{limitText(p.maxItems)} products</li>
              <li>{p.maxLocations} {p.maxLocations === 1 ? 'location' : 'locations'}</li>
              {i > 0 && <li>Everything in {plans[i - 1].name}, plus:</li>}
              {gained.filter((f) => FEATURE_LABELS[f]).slice(0, 6).map((f) => <li key={f}>{FEATURE_LABELS[f]}</li>)}
              {i === 0 && <li>Sales, stock, customers and expenses</li>}
            </ul>
            {renderAction?.(p)}
          </section>
        )
      })}
    </div>
  )
}

export function CompareTable({ plans }) {
  const keys = allFeatureKeys(plans)
  return (
    <div className="section scroll-x">
      <table className="compare">
        <thead><tr><th scope="col">What you get</th>{plans.map((p) => <th scope="col" key={p.code}>{p.name}</th>)}</tr></thead>
        <tbody>
          <tr><th scope="row">Users</th>{plans.map((p) => <td key={p.code}>{p.maxUsers}</td>)}</tr>
          <tr><th scope="row">Products</th>{plans.map((p) => <td key={p.code}>{limitText(p.maxItems)}</td>)}</tr>
          <tr><th scope="row">Locations</th>{plans.map((p) => <td key={p.code}>{p.maxLocations}</td>)}</tr>
          {keys.filter((k) => FEATURE_LABELS[k]).map((k) => (
            <tr key={k}><th scope="row">{FEATURE_LABELS[k]}</th>
              {plans.map((p) => <td key={p.code}>{p.features.includes(k)
                ? <Check size={18} color="var(--ok)" aria-label="Included" /> : <Minus size={18} color="var(--muted)" aria-label="Not included" />}</td>)}</tr>
          ))}
        </tbody>
      </table>
      <p className="muted small pad">*Unlimited products are subject to a fair-use policy.</p>
    </div>
  )
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false)
  const plans = useLoad(() => api.public.get('/subscriptions/plans'), [])
  useSeo({ title: 'Pricing', description: 'Simple ShopScale pricing: Essential, Growth and Business plans, monthly or yearly with two months free. Start with a 14-day free trial.', path: '/pricing' })
  return (
    <section className="mk-section"><div className="mk-wrap"><div className="stack">
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem' }}>Simple pricing for your business</h1>
        <p className="muted">Try everything free for 14 days. No card needed. Every plan includes sales recording and stock management.</p>
      </div>
      <div className="seg" style={{ maxWidth: 340, margin: '0 auto', width: '100%' }} role="group" aria-label="Billing period">
        <button className={`chip ${!annual ? 'on' : ''}`} aria-pressed={!annual} onClick={() => setAnnual(false)}>Monthly</button>
        <button className={`chip ${annual ? 'on' : ''}`} aria-pressed={annual} onClick={() => setAnnual(true)}>Yearly · 2 months free</button>
      </div>
      <ErrorBox error={plans.error} onRetry={plans.reload} />
      {plans.loading && <Skeleton height={320} />}
      {plans.data && (
        <>
          <PlanCards plans={plans.data} annual={annual} renderAction={() => <Link to="/register" className="btn primary block">Start 14-day free trial</Link>} />
          <h2>Compare plans</h2>
          <CompareTable plans={plans.data} />
        </>
      )}
      <h2>Questions</h2>
      <div className="section">
        <details className="pad"><summary><strong>Do I need a card to start?</strong></summary><p className="muted">No. Your 14-day trial starts when you create your business, with full Business plan access.</p></details>
        <details className="pad"><summary><strong>What happens when my trial ends?</strong></summary><p className="muted">Your data is kept safe. You can still sign in and look at your records, but you need a plan to record new activity.</p></details>
        <details className="pad"><summary><strong>Will you charge me automatically?</strong></summary><p className="muted">Never without your clear permission.</p></details>
      </div>
    </div></div></section>
  )
}
