import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { ShoppingBag, Banknote, Package, Receipt, Wallet } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Empty, ErrorBox, RangePicker, Skeleton, useLoad } from '../components.jsx'
import { AreaChart, COLORS, ChartEmpty, Donut, HBars } from '../charts.jsx'
import { changeInfo } from '../lib/chartMath.js'
import { trendPoints } from '../lib/trend.js'
import { dateOnly, dateTime, money, rangeQuery } from '../lib/format.js'
import { timeAgo } from '../lib/permissions.js'
import { Kpi, SubscriptionBanner } from './homeParts.jsx'

const METHOD = { CASH: 'Cash', TRANSFER: 'Bank transfer', CARD: 'Card' }
const METHOD_COLOR = { CASH: COLORS.teal, TRANSFER: COLORS.blue, CARD: COLORS.navy }
const TXN_ICON = { SALE: ShoppingBag, REPAYMENT: Banknote, EXPENSE: Receipt, STOCK_RECEIPT: Package }
const TXN_TONE = { SALE: '', REPAYMENT: 'money', EXPENSE: 'expense', STOCK_RECEIPT: '' }
const pct = (n) => (n == null ? '' : `${Number(n).toLocaleString('en-NG', { maximumFractionDigits: 1 })}%`)
function Card({ title, sub, action, children, wide }) {
  return (
    <section className={`dash-card${wide ? ' wide' : ''}`}>
      <header><div><h2>{title}</h2>{sub && <p className="sub">{sub}</p>}</div>{action}</header>
      {children}
    </section>
  )
}

function Loading() {
  return (
    <div className="stack">
      <div className="kpis six">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="kpi"><Skeleton height={12} width="50%" /><Skeleton height={24} style={{ marginTop: 8 }} /></div>)}</div>
      <div className="dash-card"><Skeleton height={220} /></div>
    </div>
  )
}

/** Plan-locked card body. The server does not send this data on plans without it; this only says why it is empty. */
function LockedNote({ children }) {
  return <div className="chart-empty" role="status"><p style={{ margin: 0 }}>{children}</p><p style={{ margin: '8px 0 0' }}><Link to="/more/plan" className="small"><strong>See plans</strong></Link></p></div>
}

export default function Home() {
  const { business, can } = useAuth()
  const [sp, setSp] = useSearchParams()
  const [view, setView] = useState('day')
  const range = sp.get('range') || 'today'
  const from = sp.get('from') || ''
  const to = sp.get('to') || ''
  const allowed = can('DASHBOARD_VIEW')
  const ready = allowed && (range !== 'custom' || (from && to))
  const dash = useLoad(() => (ready ? api.get('/dashboard/overview', rangeQuery(range, from, to)) : Promise.resolve(null)), [range, from, to, allowed])
  const sub = useLoad(() => (can('SUBSCRIPTION_VIEW') ? api.get('/subscriptions/current') : Promise.resolve(null)), [])
  const o = dash.data
  const d = o?.current
  const carry = new URLSearchParams({ range, ...(range === 'custom' ? { from, to } : {}) }).toString()
  const canSales = can('SALES_VIEW') || can('SALES_HISTORY_VIEW')

  if (!allowed) return <Navigate to={can('SALES_CREATE') ? '/sell' : '/more'} replace />

  function pick({ range: r, from: f, to: t }) {
    const next = { range: r }
    if (r === 'custom') { if (f) next.from = f; if (t) next.to = t }
    setSp(next, { replace: true })
  }

  const cmp = o?.comparison
  const delta = (c, badUp) => { const i = cmp?.available && c ? changeInfo(c.changePercent) : null; return i ? { ...i, badUp } : null }
  const points = trendPoints(o?.trend, view)
  const hasSales = points.some((p) => p.value > 0)
  const views = [['day', 'Daily'], ['week', 'Weekly'], ['month', 'Monthly']].filter(([k]) => k === 'day' || (o?.trend?.[k === 'week' ? 'weekly' : 'monthly'] || []).length > 1)
  const fin = o?.financial

  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>{business?.name}</h1><p className="sub">How your business is doing</p></div>
        {can('SALES_CREATE') && <Link to="/sell" className="btn primary">Record a sale</Link>}
      </div>
      <SubscriptionBanner sub={sub.data} />
      <RangePicker value={range} from={from} to={to} onChange={pick} />
      <ErrorBox error={dash.error} onRetry={dash.reload} />
      {dash.loading && !o && <Loading />}

      {o && (
        <>
          <div className="kpis six">
            <Kpi label="Total sales" value={money(d.salesTotal)} hint={`${d.salesCount} ${d.salesCount === 1 ? 'sale' : 'sales'}`} delta={delta(cmp?.sales)} to={`/more/sales?${carry}`}
              tip="The value of completed sales in this period, after refunds. Credit sales count when they are made." />
            {fin && <Kpi label="Money received" value={money(d.moneyReceived)} tone="teal" delta={delta(cmp?.moneyReceived)} to={`/more/sales?${carry}`}
              tip="Cash, transfer and card payments actually recorded in this period, including customers paying off what they owed. Credit not yet paid is not included." />}
            {fin && <Kpi label="Gross profit" value={money(d.estimatedGrossProfit)} tone="navy" delta={delta(cmp?.grossProfit)}
              hint={o.costDataComplete ? 'Sales minus product cost' : 'Some items have no cost price, so this is incomplete'}
              tip="Sales minus what the products cost you. It depends on the cost prices you entered." />}
            {fin && <Kpi label="Business expenses" value={money(d.expensesTotal)} tone="warn" delta={delta(cmp?.expenses, true)} to={`/expenses?${carry}`}
              tip="Running costs you recorded in this period, such as rent, transport and wages." />}
            {fin && <Kpi label="Customers owing you" value={money(d.customersOweYou)} hint={`${o.debts?.customersOwing ?? 0} ${o.debts?.customersOwing === 1 ? 'customer' : 'customers'} · today`} to="/customers?owing=1"
              tip="Total unpaid credit across all your customers as of today, whatever period is selected." />}
            <Kpi label="Total products" value={String(o.stock.totalProducts)} hint="Active products" to="/products" />
          </div>
          {fin && <p className="note-line">Estimated profit after expenses: <strong>{money(d.estimatedOperatingProfit)}</strong> (an estimate: it leaves out costs you have not recorded).{cmp && !cmp.available ? ' Not enough earlier data to compare with the previous period.' : ''}</p>}
          {!fin && cmp && !cmp.available && <p className="note-line">Not enough earlier data to compare with the previous period.</p>}

          <Card title="Sales trend" sub={view === 'day' && cmp?.available ? `Dotted line: ${dateOnly(cmp.from)} to ${dateOnly(cmp.to)}` : 'Touch or hover to see the amount'}
            action={views.length > 1 && <div className="seg" role="group" aria-label="Trend view">{views.map(([k, l]) => <button key={k} aria-pressed={view === k} onClick={() => setView(k)}>{l}</button>)}</div>}>
            {hasSales ? <AreaChart points={points} ariaLabel="Sales over time" /> : <ChartEmpty>No sales in this period yet. Record a sale and it will show here.</ChartEmpty>}
          </Card>

          <div className="dash-grid two">
            <Card title="Best-selling products" sub="Ranked by sales value" action={<Link to="/products" className="small">All products</Link>}>
              {o.bestProductsAvailable === false ? <LockedNote>Best-selling product reports are included in the Growth and Business plans.</LockedNote> : o.bestProducts.length === 0 ? <ChartEmpty>Nothing sold in this period.</ChartEmpty> : (
                <ol className="rank">{o.bestProducts.slice(0, 6).map((p, i) => (
                  <li key={p.name}>
                    <span className="n">{i + 1}</span>
                    {p.imageUrl ? <img className="thumb" src={p.imageUrl} alt="" loading="lazy" /> : <span className="thumb" aria-hidden="true">{p.name.slice(0, 1).toUpperCase()}</span>}
                    <div style={{ minWidth: 0 }}><Link className="name" to={`/products?q=${encodeURIComponent(p.name)}`}>{p.name}</Link><div className="meta">{Number(p.units)} sold{p.shareOfSales != null ? ` · ${pct(p.shareOfSales)} of sales` : ''}</div>
                      {p.shareOfSales != null && <div className="share-bar"><i style={{ width: `${Math.min(100, Number(p.shareOfSales))}%` }} /></div>}</div>
                    <span className="amt">{money(p.revenue)}</span>
                  </li>))}</ol>)}
            </Card>
            <Card title="Best customers" sub={o.customersServed ? `${o.customersServed} named ${o.customersServed === 1 ? 'customer' : 'customers'} bought` : 'Named customers only'} action={<Link to="/customers" className="small">All customers</Link>}>
              {o.bestCustomersAvailable === false ? <LockedNote>Best-selling customer reports are included in the Growth and Business plans.</LockedNote> : o.bestCustomers.length === 0 ? <ChartEmpty>No sales to named customers in this period. Add a customer when you sell to see them here.</ChartEmpty> : (
                <ol className="rank people">{o.bestCustomers.slice(0, 6).map((c, i) => (
                  <li key={c.id}>
                    <span className="n">{i + 1}</span>
                    <div style={{ minWidth: 0 }}><Link className="name" to={`/customers/${c.id}`}>{c.name}</Link>
                      <div className="meta">{c.transactions} {c.transactions === 1 ? 'purchase' : 'purchases'}{c.paid != null ? ` · paid ${money(c.paid)}` : ''}{c.outstanding != null && Number(c.outstanding) > 0 ? ` · owes ${money(c.outstanding)}` : ''}</div></div>
                    <span className="amt">{money(c.purchases)}</span>
                  </li>))}</ol>)}
            </Card>
          </div>

          {fin && (
            <div className="dash-grid two">
              <Card title="How customers paid" sub="Money actually received from sales">
                {o.payments.methods.length === 0 ? <ChartEmpty>No payments in this period.</ChartEmpty> : (
                  <>
                    <Donut ariaLabel="Payments by method" centerLabel="Received" centerValue={money(o.payments.received).replace('.00', '')}
                      segments={o.payments.methods.map((m) => ({ label: `${METHOD[m.method] || m.method} · ${pct(m.percent)}`, value: m.amount, color: METHOD_COLOR[m.method] }))} />
                  </>)}
                {Number(o.payments.notYetPaid) > 0 && <p className="note-line" style={{ marginTop: 10 }}><strong>{money(o.payments.notYetPaid)}</strong> was sold on credit in this period and is not yet paid. It is not counted as money received.</p>}
              </Card>
              <Card title="Business expenses" sub={`${money(o.expenses.total)} in this period`} action={<Link to={`/expenses?${carry}`} className="small">All expenses</Link>}>
                {o.expenses.categories.length === 0 ? <ChartEmpty>No expenses recorded in this period.</ChartEmpty> : (
                  <>
                    <HBars items={o.expenses.categories.map((c) => ({ label: c.name, value: c.amount, note: pct(c.percent) }))} color={COLORS.amber} />
                    <ul className="txn" style={{ marginTop: 8 }}>{o.expenses.recent.slice(0, 3).map((e) => (
                      <li key={e.id}><span className="ico expense"><Receipt size={16} aria-hidden="true" /></span>
                        <div style={{ minWidth: 0 }}><div className="name">{e.description || e.category}</div><div className="meta muted small">{e.category} · {dateOnly(e.date)}</div></div><span className="amt">{money(e.amount)}</span></li>))}</ul>
                  </>)}
              </Card>
            </div>
          )}

          <div className="dash-grid two">
            <Card title="Products running low" action={<Link to="/more/stock" className="small">See stock</Link>}>
              <div className="stat-row"><div><b>{o.stock.lowStock}</b><span>running low</span></div><div><b>{o.stock.outOfStock}</b><span>out of stock</span></div><div><b>{o.stock.totalProducts}</b><span>active products</span></div></div>
              {o.stock.attention.length === 0 ? <p className="note-line">Nothing needs restocking right now.</p> : (
                <ul className="txn">{o.stock.attention.map((s) => (
                  <li key={s.variantId}><span className="ico expense"><Package size={16} aria-hidden="true" /></span><div style={{ minWidth: 0 }}><div className="name">{s.name}</div></div><span className="amt">{Number(s.quantity)} left</span></li>))}</ul>)}
              {o.stock.recentReceipts.length > 0 && <p className="note-line" style={{ marginTop: 10 }}>Last stock received: {o.stock.recentReceipts[0].supplier || 'No supplier'} · {timeAgo(o.stock.recentReceipts[0].at)}</p>}
            </Card>
            {fin && (
              <Card title="Money owed">
                <Link className="kv" to="/customers?owing=1"><span className="k">Customers owing you<br /><span className="muted small">{o.debts.customersOwing} {o.debts.customersOwing === 1 ? 'customer' : 'customers'}{o.debts.oldestUnpaidCreditDays != null ? ` · oldest unpaid credit ${o.debts.oldestUnpaidCreditDays} ${o.debts.oldestUnpaidCreditDays === 1 ? 'day' : 'days'} old` : ''}</span></span><span className="v num">{money(o.debts.customersOweYou)}</span></Link>
                {Number(o.debts.invoicesOpen) > 0 && <Link className="kv" to="/more/invoices"><span className="k">Unpaid invoices<br /><span className="muted small">{o.debts.invoicesOpen} {o.debts.invoicesOpen === 1 ? 'invoice' : 'invoices'}{o.debts.invoicesOverdueCount > 0 ? ` · ${o.debts.invoicesOverdueCount} overdue (${money(o.debts.invoicesOverdue)})` : ''}</span></span><span className="v num">{money(o.debts.invoicesOutstanding)}</span></Link>}
                <Link className="kv" to="/suppliers"><span className="k">Money you owe suppliers<br /><span className="muted small">{o.debts.suppliersOwed} {o.debts.suppliersOwed === 1 ? 'supplier' : 'suppliers'}</span></span><span className="v num">{money(o.debts.youOweSuppliers)}</span></Link>
                <p className="note-line" style={{ marginTop: 10 }}>Balances are as of today.</p>
              </Card>
            )}
          </div>

          <Card title="Recent transactions" action={canSales && <Link to={`/more/sales?${carry}`} className="small">View all sales</Link>}>
            {o.recent.length === 0 ? <Empty title="Nothing yet" action={can('SALES_CREATE') && <Link className="btn primary" to="/sell">Record a sale</Link>}>Sales, payments, expenses and stock received will appear here.</Empty> : (
              <ul className="txn">{o.recent.map((t, i) => {
                const Icon = TXN_ICON[t.type] || Wallet
                const inner = (
                  <>
                    <span className={`ico ${TXN_TONE[t.type] || ''}`}><Icon size={16} aria-hidden="true" /></span>
                    <div style={{ minWidth: 0 }}><div className="name">{t.title}</div><div className="meta muted small">{t.detail}{t.detail ? ' · ' : ''}{dateTime(t.at)}{t.status ? ` · ${t.status}` : ''}</div></div>
                    <span className="amt">{t.amount != null ? `${t.type === 'EXPENSE' ? '−' : ''}${money(t.amount)}` : ''}</span>
                  </>)
                return <li key={`${t.type}-${i}`}>{t.link ? <Link to={t.link} style={{ display: 'contents', color: 'inherit' }}>{inner}</Link> : inner}</li>
              })}</ul>)}
          </Card>
        </>
      )}
    </div>
  )
}
