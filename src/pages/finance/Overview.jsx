import { useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { ErrorBox, ListSkeleton, RangePicker, useLoad } from '../../components.jsx'
import { money, rangeQuery } from '../../lib/format.js'
import { Link } from 'react-router-dom'

const LABEL = {
  SALE: 'Sales', CUSTOMER_PAYMENT: 'Customers paying what they owe', INVOICE_PAYMENT: 'Invoice payments', REFUND: 'Refunds', EXPENSE: 'Expenses', EXPENSE_REVERSAL: 'Expenses removed',
  SUPPLIER_PAYMENT: 'Paid to suppliers', PURCHASE: 'Stock bought', DEPOSIT: 'Money added', WITHDRAWAL: 'Money taken out', CATERING_DEPOSIT: 'Catering deposits', ONLINE_ORDER: 'Online orders',
}

export default function Overview() {
  const [sp, setSp] = useSearchParams()
  const range = sp.get('range') || 'thisMonth'
  const from = sp.get('from') || ''
  const to = sp.get('to') || ''
  const ready = range !== 'custom' || (from && to)
  const s = useLoad(() => (ready ? api.get('/finance/summary', rangeQuery(range, from, to)) : Promise.resolve(null)), [range, from, to])
  const debtors = useLoad(() => api.get('/finance/debtors'), [])
  const payables = useLoad(() => api.get('/finance/payables'), [])
  const d = s.data
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Money overview</h1><p className="sub">What came in, what went out, and who owes whom</p></div></div>
      <RangePicker value={range} from={from} to={to} onChange={({ range: r, from: f, to: t }) => setSp(r === 'custom' ? { range: r, ...(f ? { from: f } : {}), ...(t ? { to: t } : {}) } : { range: r }, { replace: true })} />
      <ErrorBox error={s.error} onRetry={s.reload} />
      {s.loading && <ListSkeleton rows={3} />}
      {d && (
        <>
          <section className="section pad stack-sm">
            <div className="kv"><span className="k">Money received</span><span className="v num">{money(d.moneyIn)}</span></div>
            <div className="kv"><span className="k">Money paid out</span><span className="v num">{money(d.moneyOut)}</span></div>
            <div className="kv"><strong>Net</strong><strong className="num">{money(d.net)}</strong></div>
            <div className="kv"><span className="k">Money you hold now</span><span className="v num">{money(d.totalOnHand)}</span></div>
            <p className="muted small">Moving money between your own accounts is not counted as received or paid out. <Link to="/more/accounts">See accounts</Link></p>
          </section>
          <section className="section pad stack-sm">
            <h2>Where it came from</h2>
            {d.inBy.length === 0 && <p className="muted">Nothing received in this period.</p>}
            {d.inBy.map((l) => <div className="kv" key={l.kind}><span className="k">{LABEL[l.kind] || l.kind}</span><span className="num">{money(l.amount)}</span></div>)}
            <h2>Where it went</h2>
            {d.outBy.length === 0 && <p className="muted">Nothing paid out in this period.</p>}
            {d.outBy.map((l) => <div className="kv" key={l.kind}><span className="k">{LABEL[l.kind] || l.kind}</span><span className="num">{money(l.amount)}</span></div>)}
          </section>
          <section className="section pad stack-sm">
            <div className="kv"><span className="k">Customers owing you ({d.customersOwing})</span><span className="v num">{money(d.customersOwe)}</span></div>
            <div className="kv"><span className="k">You owe suppliers ({d.suppliersOwed})</span><span className="v num">{money(d.youOweSuppliers)}</span></div>
          </section>
        </>
      )}
      <section className="section">
        <div className="section-title"><h2>Customers who owe you</h2></div>
        <div className="list">
          {debtors.data?.length === 0 && <p className="pad muted">Nobody owes you money.</p>}
          {debtors.data?.map((c) => <Link key={c.id} to={`/customers/${c.id}`} className="list-item"><div className="grow"><div className="title">{c.name}</div><div className="meta">{c.phone || 'No phone'}</div></div><div className="num title">{money(c.balance)}</div></Link>)}
        </div>
      </section>
      <section className="section">
        <div className="section-title"><h2>Suppliers you owe</h2></div>
        <div className="list">
          {payables.data?.length === 0 && <p className="pad muted">You do not owe any supplier.</p>}
          {payables.data?.map((c) => <Link key={c.id} to={`/suppliers/${c.id}`} className="list-item"><div className="grow"><div className="title">{c.name}</div><div className="meta">{c.phone || 'No phone'}</div></div><div className="num title">{money(c.balance)}</div></Link>)}
        </div>
      </section>
    </div>
  )
}
