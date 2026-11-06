import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Empty, ErrorBox, Field, Modal, Skeleton, useLoad, useToast } from '../components.jsx'
import { dateTime, money } from '../lib/format.js'
import { CustomerForm } from './Customers.jsx'

const METHOD = { CASH: 'Cash', TRANSFER: 'Bank transfer', CARD: 'Card' }

function PayModal({ customer, onClose, onDone }) {
  const toast = useToast()
  const [amount, setAmount] = useState(String(customer.balance))
  const [method, setMethod] = useState('CASH')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    const n = Number(amount)
    if (!(n > 0)) { setErr('Enter an amount above zero'); return }
    if (n > Number(customer.balance)) { setErr(`That is more than ${customer.name} owes`); return }
    setBusy(true); setErr('')
    try { onDone(await api.post(`/customers/${customer.id}/payments`, { amount: n, method })); toast('Payment recorded'); onClose() }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Record a payment" onClose={onClose}>
      <p className="muted">{customer.name} owes <strong>{money(customer.balance)}</strong></p>
      <Field label="Amount received (₦)" htmlFor="payamt" error={err}><input id="payamt" className="input" type="number" inputMode="decimal" min="0" value={amount} autoFocus onChange={(e) => setAmount(e.target.value)} /></Field>
      <div className="seg" role="group" aria-label="Payment method">
        {Object.entries(METHOD).map(([id, label]) => <button key={id} className={`chip ${method === id ? 'on' : ''}`} aria-pressed={method === id} onClick={() => setMethod(id)}>{label}</button>)}
      </div>
      {method === 'TRANSFER' && <p className="muted small">Only record a transfer after the money has reached your account.</p>}
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save payment'}</button>
    </Modal>
  )
}

export default function CustomerDetail() {
  const { id } = useParams()
  const { can } = useAuth()
  const d = useLoad(() => api.get(`/customers/${id}`), [id])
  const [paying, setPaying] = useState(false)
  const [editing, setEditing] = useState(false)
  if (d.error) return <div className="stack"><Link to="/customers" className="btn sm">Back</Link><ErrorBox error={d.error} onRetry={d.reload} /></div>
  if (!d.data) return <div className="stack"><Skeleton height={28} width="40%" /><Skeleton height={120} /></div>
  const { customer: c, payments, recentSales } = d.data
  const owes = Number(c.balance) > 0

  return (
    <div className="stack">
      <div className="page-head">
        <div className="row"><Link to="/customers" className="icon-btn" aria-label="Back to customers"><ArrowLeft size={20} /></Link><div><h1>{c.name}</h1><p className="sub">{[c.phone, c.email].filter(Boolean).join(' · ') || 'No contact details'}</p></div></div>
        {can('CUSTOMERS_EDIT') && <button className="btn sm" onClick={() => setEditing(true)}>Edit</button>}
      </div>
      <section className="section">
        <div className="hero-figure"><div className="label">{owes ? 'Amount remaining to pay you' : 'Nothing owed'}</div><div className="value num" style={{ color: owes ? 'var(--danger)' : 'var(--ok)' }}>{money(c.balance)}</div></div>
        {owes && can('REPAYMENTS_RECORD') && <div className="pad" style={{ paddingTop: 0 }}><button className="btn primary block" onClick={() => setPaying(true)}>Record a payment</button></div>}
        {(c.address || c.notes) && <div className="pad small muted" style={{ borderTop: '1px solid var(--line)' }}>{c.address && <p>{c.address}</p>}{c.notes && <p>{c.notes}</p>}</div>}
      </section>
      <section className="section">
        <div className="section-title"><h2>Payments received</h2></div>
        {payments.length === 0 ? <Empty title="No payments yet" /> : payments.map((p) => (
          <div className="kv" key={p.id}><span className="k">{dateTime(p.createdAt)} · {METHOD[p.method]}</span><span className="v num">{money(p.amount)}</span></div>))}
      </section>
      <section className="section">
        <div className="section-title"><h2>Purchases</h2></div>
        {recentSales.length === 0 ? <Empty title="No purchases yet" /> : recentSales.map((s) => (
          <div className="kv" key={s.id}><span className="k">Sale #{s.saleNumber} · {dateTime(s.createdAt)} {s.status === 'REFUNDED' && <span className="badge danger">Refunded</span>}</span><span className="v num">{money(s.total)}</span></div>))}
      </section>
      {paying && <PayModal customer={c} onClose={() => setPaying(false)} onDone={d.setData} />}
      {editing && <CustomerForm title="Edit customer" initial={c} onClose={() => setEditing(false)} onSaved={d.reload} />}
    </div>
  )
}
