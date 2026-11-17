import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Field, Modal, useDebounced, useLoad, useToast } from '../../components.jsx'
import { money } from '../../lib/format.js'
import { METHODS } from './shared.js'

/** Take payment for an order. Payments can be split; anything not paid goes on a customer's account. The server works out every amount. */
export default function PayOrder({ order, onClose, onDone }) {
  const toast = useToast()
  const { can } = useAuth()
  const due = Number(order.total)
  const [lines, setLines] = useState([{ method: 'CASH', amount: String(due) }])
  const [discount, setDiscount] = useState('')
  const [customer, setCustomer] = useState(null)
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const found = useLoad(() => (dq.length >= 2 ? api.get('/customers', { q: dq, size: 6 }) : Promise.resolve(null)), [dq])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const disc = Math.min(Number(discount) || 0, due)
  const payable = Math.max(0, due - disc)
  const paid = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0)
  const owed = Math.max(0, payable - paid)
  const over = paid > payable + 0.005

  async function submit() {
    if (over) { setError('The payments add up to more than the bill'); return }
    if (owed > 0.005 && !customer) { setError('Choose a customer to put the unpaid part on their account'); return }
    setBusy(true); setError('')
    try {
      const payments = lines.filter((l) => Number(l.amount) > 0).map((l) => ({ method: l.method, amount: Number(l.amount) }))
      const res = await api.post(`/restaurant/orders/${order.id}/pay`, { payments, discount: disc > 0 ? disc : null, customerId: customer?.id || null })
      toast(`Order #${res.number} paid`)
      onDone(res)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <Modal title={`Pay order #${order.number}`} onClose={onClose}>
      <div className="kv" style={{ padding: 0 }}><span className="k">Bill</span><span className="v num">{money(due)}</span></div>
      {can('SALES_DISCOUNT') && (
        <Field label="Discount (₦)" htmlFor="p-disc" hint="Optional"><input id="p-disc" className="input" type="number" inputMode="decimal" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
      )}
      <div className="stack-sm">
        {lines.map((l, i) => (
          <div className="row" key={i}>
            <select className="select" aria-label={`Payment ${i + 1} method`} value={l.method} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, method: e.target.value } : x)))}>
              {Object.entries(METHODS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <input className="input" type="number" inputMode="decimal" min="0" aria-label={`Payment ${i + 1} amount`} value={l.amount} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
            {lines.length > 1 && <button className="icon-btn" aria-label="Remove this payment" onClick={() => setLines(lines.filter((_, j) => j !== i))}><Trash2 size={18} /></button>}
          </div>
        ))}
        <button className="btn sm" onClick={() => setLines([...lines, { method: 'TRANSFER', amount: owed > 0 ? String(owed) : '' }])}><Plus size={16} /> Split payment</button>
      </div>
      <div className="kv" style={{ padding: 0 }}><span className="k">To pay{disc > 0 ? ' after discount' : ''}</span><span className="v num">{money(payable)}</span></div>
      {owed > 0.005 && (
        <div className="stack-sm">
          <div className="banner warn">{money(owed)} is not paid. It will be added to the customer's account.</div>
          {customer ? (
            <div className="row"><strong className="grow">{customer.name}</strong><button className="btn sm" onClick={() => setCustomer(null)}>Change</button></div>
          ) : (
            <>
              <input className="input" placeholder="Search customer by name or phone" aria-label="Search customer" value={q} onChange={(e) => setQ(e.target.value)} />
              {(found.data?.content || []).map((c) => <button key={c.id} className="btn block" onClick={() => setCustomer(c)}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</button>)}
            </>
          )}
        </div>
      )}
      {over && <p className="form-error" role="alert">The payments add up to more than the bill.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn primary block" onClick={submit} disabled={busy || over}>{busy ? 'Saving…' : owed > 0.005 ? 'Save with balance on account' : 'Confirm payment'}</button>
    </Modal>
  )
}
