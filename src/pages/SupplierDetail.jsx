import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Empty, ErrorBox, Field, Modal, Skeleton, useLoad, useToast } from '../components.jsx'
import { dateOnly, dateTime, money } from '../lib/format.js'
import { SupplierForm } from './Suppliers.jsx'

const METHOD = { CASH: 'Cash', TRANSFER: 'Bank transfer', CARD: 'Card' }

function PayModal({ supplier, onClose, onDone }) {
  const toast = useToast()
  const [amount, setAmount] = useState(String(supplier.balance))
  const [method, setMethod] = useState('TRANSFER')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    const n = Number(amount)
    if (!(n > 0)) { setErr('Enter an amount above zero'); return }
    if (n > Number(supplier.balance)) { setErr(`That is more than you owe ${supplier.name}`); return }
    setBusy(true); setErr('')
    try { onDone(await api.post(`/suppliers/${supplier.id}/payments`, { amount: n, method })); toast('Payment recorded'); onClose() }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Pay supplier" onClose={onClose}>
      <p className="muted">You owe {supplier.name} <strong>{money(supplier.balance)}</strong></p>
      <Field label="Amount paid (₦)" htmlFor="spay" error={err}><input id="spay" className="input" type="number" inputMode="decimal" min="0" value={amount} autoFocus onChange={(e) => setAmount(e.target.value)} /></Field>
      <div className="seg" role="group" aria-label="Payment method">
        {Object.entries(METHOD).map(([id, label]) => <button key={id} className={`chip ${method === id ? 'on' : ''}`} aria-pressed={method === id} onClick={() => setMethod(id)}>{label}</button>)}
      </div>
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save payment'}</button>
    </Modal>
  )
}

export default function SupplierDetail() {
  const { id } = useParams()
  const { can } = useAuth()
  const d = useLoad(() => api.get(`/suppliers/${id}`), [id])
  const [paying, setPaying] = useState(false)
  const [editing, setEditing] = useState(false)
  if (d.error) return <div className="stack"><Link to="/suppliers" className="btn sm">Back</Link><ErrorBox error={d.error} onRetry={d.reload} /></div>
  if (!d.data) return <div className="stack"><Skeleton height={28} width="40%" /><Skeleton height={120} /></div>
  const { supplier: s, payments, purchases } = d.data
  const owes = s.balance != null && Number(s.balance) > 0

  return (
    <div className="stack">
      <div className="page-head">
        <div className="row"><Link to="/suppliers" className="icon-btn" aria-label="Back to suppliers"><ArrowLeft size={20} /></Link><div><h1>{s.name}</h1><p className="sub">{[s.phone, s.email].filter(Boolean).join(' · ') || 'No contact details'}</p></div></div>
        {can('SUPPLIERS_MANAGE') && <button className="btn sm" onClick={() => setEditing(true)}>Edit</button>}
      </div>
      {s.balance != null && (
        <section className="section">
          <div className="hero-figure"><div className="label">{owes ? 'You owe this supplier' : 'Nothing owed'}</div><div className="value num" style={{ color: owes ? 'var(--danger)' : 'var(--ok)' }}>{money(s.balance)}</div></div>
          {owes && can('SUPPLIER_PAYMENTS_RECORD') && <div className="pad" style={{ paddingTop: 0 }}><button className="btn primary block" onClick={() => setPaying(true)}>Record a payment</button></div>}
        </section>
      )}
      {(s.address || s.notes) && <div className="section pad small muted">{s.address && <p>{s.address}</p>}{s.notes && <p>{s.notes}</p>}</div>}
      {payments.length > 0 && (
        <section className="section"><div className="section-title"><h2>Payments you made</h2></div>
          {payments.map((p) => <div className="kv" key={p.id}><span className="k">{dateTime(p.createdAt)} · {METHOD[p.method]}</span><span className="v num">{money(p.amount)}</span></div>)}</section>
      )}
      <section className="section"><div className="section-title"><h2>Purchases</h2></div>
        {purchases.length === 0 ? <Empty title="No purchases yet" /> : purchases.map((p) => (
          <div className="kv" key={p.id}><span className="k">#{p.purchaseNumber} · {dateOnly(p.createdAt)}{Number(p.amountOwed) > 0 && <> <span className="badge warn">Owe {money(p.amountOwed)}</span></>}</span><span className="v num">{money(p.total)}</span></div>))}
      </section>
      {paying && <PayModal supplier={s} onClose={() => setPaying(false)} onDone={d.setData} />}
      {editing && <SupplierForm title="Edit supplier" initial={s} onClose={() => setEditing(false)} onSaved={d.reload} />}
    </div>
  )
}
