import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Empty, ErrorBox, Field, ListSkeleton, Modal, useDebounced, useLoad, useToast } from '../components.jsx'
import { money } from '../lib/format.js'

export function CustomerForm({ initial, onSaved, onClose, title }) {
  const toast = useToast()
  const [f, setF] = useState({ name: initial?.name || '', phone: initial?.phone || '', email: initial?.email || '', address: initial?.address || '', notes: initial?.notes || '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    if (!f.name.trim()) { setErr('Enter the customer name'); return }
    setBusy(true); setErr('')
    const body = { name: f.name, phone: f.phone || null, email: f.email || null, address: f.address || null, notes: f.notes || null }
    try {
      const c = initial ? await api.put(`/customers/${initial.id}`, body) : await api.post('/customers', body)
      toast('Customer saved'); onSaved(c); onClose()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <Field label="Name" htmlFor="cname" error={err}><input id="cname" className="input" value={f.name} autoFocus onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Phone" htmlFor="cphone"><input id="cphone" className="input" type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
      <Field label="Email" htmlFor="cemail"><input id="cemail" className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <Field label="Address" htmlFor="caddr"><input id="caddr" className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
      <Field label="Notes" htmlFor="cnotes"><textarea id="cnotes" className="textarea" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save customer'}</button>
    </Modal>
  )
}

export default function Customers() {
  const nav = useNavigate()
  const { can } = useAuth()
  const [sp, setSp] = useSearchParams()
  const owing = sp.get('owing') === '1'
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const [adding, setAdding] = useState(false)
  const list = useLoad(() => api.get('/customers', { q: dq, owingOnly: owing, size: 50 }), [dq, owing])
  const rows = list.data?.content

  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Customers</h1><p className="sub">People you sell to, and who owes you</p></div>
        {can('CUSTOMERS_CREATE') && <button className="btn primary" onClick={() => setAdding(true)}><Plus size={18} /> Add customer</button>}
      </div>
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--muted)' }} aria-hidden="true" />
        <input className="input" style={{ paddingLeft: 38 }} placeholder="Search by name or phone" aria-label="Search customers" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="chips" role="group" aria-label="Filter">
        <button className={`chip ${!owing ? 'on' : ''}`} onClick={() => setSp({})}>Everyone</button>
        <button className={`chip ${owing ? 'on' : ''}`} onClick={() => setSp({ owing: '1' })}>Customers who owe you</button>
      </div>
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && <ListSkeleton />}
      {rows && rows.length === 0 && <div className="section"><Empty title={owing ? 'Nobody owes you money' : dq ? 'No customers found' : 'No customers yet'}>{!owing && !dq && 'Add a customer here, or while recording a sale.'}</Empty></div>}
      {rows && rows.length > 0 && (
        <div className="section list">
          {rows.map((c) => (
            <button key={c.id} className="list-item" onClick={() => nav(`/customers/${c.id}`)}>
              <div className="grow"><div className="title">{c.name}</div><div className="meta">{c.phone || 'No phone'}</div></div>
              {Number(c.balance) > 0 ? <span className="badge warn num">Owes {money(c.balance)}</span> : <span className="muted small">Settled</span>}
              <ChevronRight size={18} className="chev" />
            </button>
          ))}
        </div>
      )}
      {adding && <CustomerForm title="Add customer" onClose={() => setAdding(false)} onSaved={(c) => nav(`/customers/${c.id}`)} />}
    </div>
  )
}
