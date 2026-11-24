import { useEffect, useState } from 'react'
import { SmartLink as Link } from '../lib/SmartLink.jsx'
import { Check, Minus } from 'lucide-react'
import { api } from '../lib/api'
import { ErrorBox, Skeleton, useLoad } from '../components.jsx'
import { track } from '../analytics/analytics.js'
import { money } from '../lib/format.js'
import { useSeo } from '../marketing/Seo.jsx'
import { FEATURE_LABELS, advertised, allFeatureKeys, annualSavings, limitText, newFeatures } from '../lib/plans.js'
import { expenseLimitText, reminderLimitText, supplierLimitText } from '../lib/entitlements.js'
import { V1_SCOPE } from '../config/scope.js'
import { CtaBand, Faq, Section, SectionHead } from '../marketing/ui.jsx'

export function PlanCards({ plans, annual, renderAction }) {
  return (
    <div className="plans">
      {plans.map((p, i) => {
        const gained = newFeatures(p, plans[i - 1])
        const price = annual ? p.annualPrice : p.monthlyPrice
        return (
          <section key={p.code} className={`section plan ${p.recommended ? 'pop' : ''}`}>
            <div className="row between"><h2>{p.name}</h2>{p.recommended && <span className="badge rec">Recommended</span>}</div>
            <div><span className="price num">{money(price)}</span><span className="muted"> /{annual ? 'year' : 'month'}</span>
              {!annual && Number(p.monthlyPrice) === 0 && <p className="small muted">Free forever. No card needed.</p>}
              {annual && annualSavings(p) > 0 && <p className="small" style={{ color: 'var(--ok)' }}>You save {money(annualSavings(p))} a year</p>}</div>
            <ul>
              <li>{p.maxUsers} {p.maxUsers === 1 ? 'user' : 'users'}</li>
              <li>{p.maxItems == null ? 'Unlimited' : `Up to ${p.maxItems}`} active products</li>
              {!V1_SCOPE && <li>{p.maxLocations} {p.maxLocations === 1 ? 'location' : 'locations'}</li>}
              <li>{p.maxCustomers == null ? 'Unlimited' : `Up to ${p.maxCustomers}`} customers</li>
              <li>{p.maxExpenses == null ? 'Unlimited' : `Up to ${p.maxExpenses}`} expense records{p.maxExpenses != null && p.expensePeriod === 'MONTH' ? ' per month' : ''}</li>
              <li>{p.maxSuppliers == null ? 'Unlimited suppliers' : Number(p.maxSuppliers) === 0 ? 'No supplier records' : `Up to ${p.maxSuppliers} suppliers`}</li>
              <li>{p.maxWhatsappReminders == null ? 'Unlimited' : Number(p.maxWhatsappReminders) === 0 ? 'No' : `${p.maxWhatsappReminders}`} WhatsApp invoice reminders{p.maxWhatsappReminders != null && Number(p.maxWhatsappReminders) > 0 ? ' per month' : ''}</li>
              {Number(p.monthlyPrice) === 0 && <li>Unlimited sales and printable receipts</li>}
              {i > 0 && Number(plans[i - 1].monthlyPrice) > 0 && <li>Everything in {plans[i - 1].name}, plus:</li>}
              {i > 0 && Number(plans[i - 1].monthlyPrice) === 0 && <li>Everything in Free, with higher limits, plus:</li>}
              {/* WhatsApp reminders already have their own line above with the exact allowance, so they are not repeated here. */}
              {gained.filter((f) => FEATURE_LABELS[f] && f !== 'WHATSAPP_REMINDERS' && advertised(f, V1_SCOPE)).slice(0, 10).map((f) => <li key={f}>{FEATURE_LABELS[f]}</li>)}
              {i === 0 && Number(p.monthlyPrice) === 0 && <li>Sales, stock, customers and expenses</li>}
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
          {!V1_SCOPE && <tr><th scope="row">Locations</th>{plans.map((p) => <td key={p.code}>{p.maxLocations}</td>)}</tr>}
          <tr><th scope="row">Customers</th>{plans.map((p) => <td key={p.code}>{limitText(p.maxCustomers)}</td>)}</tr>
          <tr><th scope="row">Expense records</th>{plans.map((p) => <td key={p.code}>{expenseLimitText(p)}</td>)}</tr>
          <tr><th scope="row">Suppliers</th>{plans.map((p) => <td key={p.code}>{supplierLimitText(p)}</td>)}</tr>
          <tr><th scope="row">WhatsApp invoice reminders</th>{plans.map((p) => <td key={p.code}>{reminderLimitText(p)}</td>)}</tr>
          {keys.filter((k) => FEATURE_LABELS[k] && k !== 'WHATSAPP_REMINDERS' && advertised(k, V1_SCOPE)).map((k) => (
            <tr key={k}><th scope="row">{FEATURE_LABELS[k]}</th>
              {plans.map((p) => <td key={p.code}>{p.features.includes(k)
                ? <Check size={18} color="var(--ok)" aria-label="Included" /> : <Minus size={18} color="var(--muted)" aria-label="Not included" />}</td>)}</tr>
          ))}
        </tbody>
      </table>
      <p className="muted small pad">*Unlimited is subject to a fair-use policy.</p>
    </div>
  )
}

const PRICING_FAQ = [
  ['Do I need a card to start?', 'No. Your 14-day trial starts when you create your business, with full Business plan access. No card is asked for.'],
  ['What happens when my trial ends?', 'Your data is kept safe and nothing is deleted. Your business moves to the Free plan so you can keep selling. Features and limits beyond Free need a paid plan.'],
  ['Will I be charged automatically?', 'Paid plans renew automatically each month or year through Paystack until you cancel. You can cancel from Plan and billing in the app and keep access until the end of the period you paid for.'],
  ['What if I go over a limit after changing plan?', 'Nothing is deleted. You keep everything you have, and you can add more once you are back within the plan allowance or upgrade.'],
  ['Which plans include Ask ShopScale, CSV export and online orders?', 'Growth and Business. WhatsApp invoice reminders start on Essential.'],
]

export default function Pricing() {
  const [annual, setAnnual] = useState(false)
  const plans = useLoad(() => api.public.get('/subscriptions/plans'), [])
  useEffect(() => { track('view_pricing', { source: 'public' }) }, [])
  useSeo({ title: 'Pricing', description: 'Simple ShopScale pricing: a free plan forever, plus Essential, Growth and Business plans, monthly or yearly with two months free.', path: '/pricing' })
  return (
    <>
      <section className="mkx-page-hero"><div className="mkx-wrap">
        <h1>Simple pricing for your business</h1>
        <p className="mkx-lead">Start free and stay free, or try every feature for 14 days. No card needed. Every plan includes sales recording and stock management.</p>
        <div className="mkx-toggle" role="group" aria-label="Billing period">
          <button type="button" className={!annual ? 'on' : ''} aria-pressed={!annual} onClick={() => setAnnual(false)}>Monthly</button>
          <button type="button" className={annual ? 'on' : ''} aria-pressed={annual} onClick={() => setAnnual(true)}>Yearly · 2 months free</button>
        </div>
      </div></section>
      <Section>
        <div className="mkx-pricing">
          <ErrorBox error={plans.error} onRetry={plans.reload} />
          {plans.loading && <Skeleton height={320} />}
          {plans.data && <PlanCards plans={plans.data} annual={annual} renderAction={(p) => <Link to="/register" className="btn primary block">{Number(p.monthlyPrice) === 0 ? 'Start free' : 'Start 14-day free trial'}</Link>} />}
        </div>
        <p className="mkx-fine" style={{ textAlign: 'center', marginTop: 18 }}>Paid plans renew automatically until you cancel. Cancel any time and keep access until the period you paid for ends.</p>
      </Section>
      {plans.data && (
        <Section tone="tint" labelledBy="cmp-h"><SectionHead id="cmp-h" center title="Compare plans" /><div className="mkx-pricing"><CompareTable plans={plans.data} /></div></Section>
      )}
      <Section labelledBy="pq-h"><SectionHead id="pq-h" center title="Pricing questions" /><Faq items={PRICING_FAQ} /></Section>
      <CtaBand />
    </>
  )
}
