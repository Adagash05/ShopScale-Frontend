import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, ShoppingBag, Banknote, Package, User, Store, Circle } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Empty, ErrorBox, RangePicker, Skeleton, useLoad } from '../components.jsx'
import { BarChart, COLORS, ChartEmpty, Donut, HBars, Legend, StackBar } from '../charts.jsx'
import { daysLeft, dateOnly, dateTime, money, rangeQuery } from '../lib/format.js'
import { describeActivity, timeAgo } from '../lib/permissions.js'
import Insights from './Insights.jsx'

const METHOD = { CASH: 'Cash', TRANSFER: 'Bank transfer', CARD: 'Card' }
const METHOD_COLOR = { CASH: COLORS.teal, TRANSFER: COLORS.blue, CARD: COLORS.navy }
const ICONS = { sale: ShoppingBag, money: Banknote, box: Package, user: User, store: Store, dot: Circle }

function SubscriptionBanner({ sub }) {
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

function Kpi({ label, value, hint, to, tone = '' }) {
  const body = <><div className="label">{label}</div><div className="value num">{value}</div>{hint && <div className="hint">{hint}</div>}</>
  return to ? <Link to={to} className={`kpi accent ${tone}`}>{body}</Link> : <div className={`kpi accent ${tone}`}>{body}</div>
}

function Activity() {
  const feed = useLoad(() => api.get('/activity', { size: 12 }), [])
  return (
    <section className="section">
      <div className="section-title"><h2>What is happening</h2></div>
      <ErrorBox error={feed.error} onRetry={feed.reload} />
      {feed.loading && <div className="pad stack-sm"><Skeleton height={14} /><Skeleton height={14} width="70%" /></div>}
      {feed.data && feed.data.length === 0 && <Empty title="Nothing yet">Sales, stock changes and new customers will appear here as they happen.</Empty>}
      {feed.data && feed.data.length > 0 && (
        <div className="feed">
          {feed.data.map((a) => {
            const [label, tone, icon] = describeActivity(a)
            const Icon = ICONS[icon] || Circle
            return (
              <div className="feed-item" key={a.id}>
                <span className={`feed-icon ${tone === 'blue' ? '' : tone}`}><Icon size={18} aria-hidden="true" /></span>
                <div><div className="title">{label}</div><div className="meta small muted">{a.userName || 'System'}{a.detail ? ` · ${a.detail}` : ''}</div></div>
                <span className="muted small">{timeAgo(a.createdAt)}</span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default function Home() {
  const { business, can } = useAuth()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const range = sp.get('range') || 'today'
  const from = sp.get('from') || ''
  const to = sp.get('to') || ''
  const allowed = can('DASHBOARD_VIEW')
  const ready = allowed && (range !== 'custom' || (from && to))
  const dash = useLoad(() => (ready ? api.get('/dashboard', rangeQuery(range, from, to)) : Promise.resolve(null)), [range, from, to, allowed])
  const sub = useLoad(() => (can('SUBSCRIPTION_VIEW') ? api.get('/subscriptions/current') : Promise.resolve(null)), [])
  const d = dash.data
  const carry = new URLSearchParams({ range, ...(range === 'custom' ? { from, to } : {}) }).toString()

  if (!allowed) return <Navigate to={can('SALES_CREATE') ? '/sell' : '/more'} replace />

  function pick({ range: r, from: f, to: t }) {
    const next = { range: r }
    if (r === 'custom') { if (f) next.from = f; if (t) next.to = t }
    setSp(next, { replace: true })
  }

  const series = d?.financial
    ? [{ key: 'sales', label: 'Sales', color: COLORS.blue }, { key: 'expenses', label: 'Expenses', color: COLORS.amber }]
    : [{ key: 'sales', label: 'Sales', color: COLORS.blue }]
  const days = (d?.daily || []).map((p) => ({
    label: new Date(p.date + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }),
    title: `${dateOnly(p.date)}: sales ${money(p.sales)}${p.expenses != null ? `, expenses ${money(p.expenses)}` : ''}`,
    values: { sales: p.sales, expenses: p.expenses },
    onClick: can('SALES_VIEW') || can('SALES_HISTORY_VIEW') ? () => nav(`/more/sales?range=custom&from=${p.date}&to=${p.date}`) : undefined,
  }))
  const hasDaily = d && d.daily.some((p) => Number(p.sales) > 0 || Number(p.expenses) > 0)
  const profitTrend = d?.financial ? d.daily.filter((p) => p.grossProfit != null) : []
  const showProfitTrend = profitTrend.length > 1 && profitTrend.some((p) => Number(p.grossProfit) !== 0)
  const sh = d?.stockHealth
  const shTotal = sh ? sh.outOfStock + sh.low + sh.healthy : 0

  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>{business?.name}</h1><p className="sub">How your business is doing</p></div>
        {can('SALES_CREATE') && <Link to="/sell" className="btn primary">Record a sale</Link>}
      </div>
      <SubscriptionBanner sub={sub.data} />
      <RangePicker value={range} from={from} to={to} onChange={pick} />
      <ErrorBox error={dash.error} onRetry={dash.reload} />
      {dash.loading && <div className="kpis">{[0, 1, 2, 3].map((i) => <div key={i} className="kpi"><Skeleton height={12} width="50%" /><Skeleton height={24} style={{ marginTop: 8 }} /></div>)}</div>}

      {d && (
        <>
          <Insights range={range} from={from} to={to} />

          <div className="headline" aria-label="Sales so far">
            <span>Sales today <b>{money(d.headline.today)}</b></span>
            <span>Last 7 days <b>{money(d.headline.last7Days)}</b></span>
            <span>This month <b>{money(d.headline.thisMonth)}</b></span>
          </div>

          <div className="kpis">
            <Kpi label="Sales" value={money(d.salesTotal)} hint={`${d.salesCount} ${d.salesCount === 1 ? 'sale' : 'sales'}`} to={`/more/sales?${carry}`} />
            {d.financial && <Kpi label="Money received" value={money(d.moneyReceived)} hint="Payments and repayments" tone="teal" to={`/more/sales?${carry}`} />}
            {d.financial && <Kpi label="Expenses" value={money(d.expensesTotal)} hint="Recorded costs" tone="warn" to={`/expenses?${carry}`} />}
            {d.financial && <Kpi label="Estimated profit" value={money(d.estimatedOperatingProfit)} hint={`Gross ${money(d.estimatedGrossProfit)}`} tone="navy" />}
            {!d.financial && <Kpi label="Stock running low" value={d.lowStockCount} hint="Items to restock" tone="warn" to="/more/stock" />}
          </div>

          <section className="chart-card">
            <div className="head">
              <div><h2>{d.financial ? 'Sales and expenses' : 'Sales'}</h2><p className="sub">By day · tap a bar to see that day's sales</p></div>
              <Legend items={series} />
            </div>
            {hasDaily
              ? <BarChart data={days} series={series} ariaLabel="Sales by day" />
              : <ChartEmpty>No sales or expenses in this period yet. Record a sale and it will show here.</ChartEmpty>}
          </section>

          {showProfitTrend && (
            <section className="chart-card">
              <div className="head"><div><h2>Gross profit by day</h2><p className="sub">Sales minus what the products cost you</p></div></div>
              <BarChart data={profitTrend.map((p) => ({ label: new Date(p.date + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }), title: `${dateOnly(p.date)}: ${money(p.grossProfit)}`, values: { profit: Math.max(Number(p.grossProfit), 0) } }))}
                series={[{ key: 'profit', label: 'Gross profit', color: COLORS.teal }]} height={160} ariaLabel="Gross profit by day" />
            </section>
          )}

          <div className="two-col">
            {d.financial && (
              <section className="chart-card">
                <div className="head"><h2>How customers paid</h2></div>
                {d.paymentBreakdown.length === 0 ? <ChartEmpty>No payments in this period.</ChartEmpty>
                  : <Donut ariaLabel="Payments by method" centerLabel="Received" centerValue={money(d.moneyReceivedFromSales).replace('.00', '')}
                      segments={d.paymentBreakdown.map((m) => ({ label: METHOD[m.method] || m.method, value: m.amount, color: METHOD_COLOR[m.method] }))} />}
              </section>
            )}
            <section className="chart-card">
              <div className="head"><h2>Sales by category</h2></div>
              {d.salesByCategory.length === 0 ? <ChartEmpty>No category sales in this period.</ChartEmpty>
                : <HBars items={d.salesByCategory.slice(0, 6).map((c) => ({ label: c.name, value: c.revenue }))} color={COLORS.teal} />}
            </section>
            <section className="chart-card">
              <div className="head"><h2>Best sellers</h2><span className="sub">By items sold</span></div>
              {d.topProducts.length === 0 ? <ChartEmpty>Nothing sold in this period.</ChartEmpty>
                : <HBars items={d.topProducts.map((t) => ({ label: t.name, value: t.quantity, note: `${t.quantity} sold`, onClick: () => nav(`/products?q=${encodeURIComponent(t.name)}`) }))} color={COLORS.blue} />}
            </section>
            <section className="chart-card">
              <div className="head"><h2>Stock health</h2><Link to="/more/stock" className="small">See stock</Link></div>
              {shTotal === 0 ? <ChartEmpty>Add products to see how your stock is doing.</ChartEmpty> : (
                <>
                  <StackBar ariaLabel="Stock health" parts={[{ label: 'Healthy', value: sh.healthy, color: COLORS.teal }, { label: 'Running low', value: sh.low, color: COLORS.amber }, { label: 'Out of stock', value: sh.outOfStock, color: COLORS.red }]} />
                  <Legend items={[{ label: `${sh.healthy} healthy`, color: COLORS.teal }, { label: `${sh.low} running low`, color: COLORS.amber }, { label: `${sh.outOfStock} out of stock`, color: COLORS.red }]} />
                </>
              )}
              {d.slowMoving.length > 0 && <div className="stack-sm"><strong className="small">In stock but not selling</strong>
                {d.slowMoving.map((s) => <div className="kv" style={{ padding: '4px 0', border: 0 }} key={s.name}><span className="k">{s.name}</span><span className="v num">{s.quantity} left</span></div>)}</div>}
            </section>
          </div>

          {d.financial && (
            <section className="section">
              <Link className="kv" to="/customers?owing=1"><span className="k">Customers who owe you</span><span className="v num">{money(d.customersOweYou)}</span></Link>
              <Link className="kv" to="/more/stock"><span className="k">Stock running low</span><span className="v">{d.lowStockCount} {d.lowStockCount === 1 ? 'item' : 'items'}</span></Link>
              <div className="kv"><span className="k">Value of your stock (at cost)</span><span className="v num">{money(d.stockValue)}</span></div>
              <details className="pad small muted"><summary style={{ cursor: 'pointer' }}>How are these worked out?</summary>
                <p style={{ marginTop: 8 }}>Estimated profit = sales {money(d.salesTotal)} − what products cost you {money(d.costOfProductsSold)} − expenses {money(d.expensesTotal)}. It depends on the cost prices you entered. Refunded sales are left out. Credit sales count when made; the money appears in "Money received" when the customer pays.</p></details>
            </section>
          )}

          <div className="two-col">
            <Activity />
            <section className="section">
              <div className="section-title row between"><h2>Latest sales</h2>{(can('SALES_VIEW') || can('SALES_HISTORY_VIEW')) && <Link to={`/more/sales?${carry}`} className="small">See all</Link>}</div>
              {d.recentSales.length === 0 ? <Empty title="No sales in this period" action={can('SALES_CREATE') && <Link className="btn primary" to="/sell">Record a sale</Link>} />
                : <div className="list">{d.recentSales.map((s) => (
                  <Link key={s.id} to={`/more/sales?${carry}`} className="list-item">
                    <div className="grow"><div className="title">Sale #{s.saleNumber}{s.customerName ? ` · ${s.customerName}` : ''}</div><div className="meta">{dateTime(s.createdAt)}</div></div>
                    <div className="right"><div className="num title">{money(s.total)}</div>{s.status === 'REFUNDED' && <span className="badge danger">Refunded</span>}{Number(s.amountOwed) > 0 && s.status !== 'REFUNDED' && <span className="badge warn">Owes {money(s.amountOwed)}</span>}</div>
                    <ChevronRight size={18} className="chev" />
                  </Link>))}</div>}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
