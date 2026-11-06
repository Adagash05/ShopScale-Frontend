import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Empty, ErrorBox, Field, ListSkeleton, Modal, useLoad, useToast } from '../components.jsx'
import { dateOnly, money } from '../lib/format.js'

export function SupplierForm({ initial, onClose, onSaved, title }) {
  const toast = useToast()
  const [f, setF] = useState({ name: initial?.name || '', phone: initial?.phone || '', email: initial?.email || '', address: initial?.address || '', notes: initial?.notes || '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    if (!f.name.trim()) { setErr('Enter the supplier name'); return }
    setBusy(true); setErr('')
    const body = { name: f.name, phone: f.phone || null, email: f.email || null, address: f.address || null, notes: f.notes || null }
    try { const s = initial ? await api.put(`/suppliers/${initial.id}`, body) : await api.post('/suppliers', body); toast('Supplier saved'); onSaved(s); onClose() }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <Field label="Supplier name" htmlFor="sn" error={err}><input id="sn" className="input" value={f.name} autoFocus onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Phone" htmlFor="sp"><input id="sp" className="input" type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
      <Field label="Email" htmlFor="se"><input id="se" className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <Field label="Address" htmlFor="sa"><input id="sa" className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
      <Field label="Notes" htmlFor="sno"><textarea id="sno" className="textarea" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save supplier'}</button>
    </Modal>
  )
}

function PurchaseModal({ id, onClose }) {
  const d = useLoad(() => api.get(`/purchases/${id}`), [id])
  const p = d.data
  return (
    <Modal title={p ? `Purchase #${p.purchaseNumber}` : 'Purchase'} onClose={onClose}>
      <ErrorBox error={d.error} onRetry={d.reload} />
      {p && (
        <>
          <p className="muted small">{dateOnly(p.createdAt)}{p.supplierName ? ` · ${p.supplierName}` : ''}{p.reference ? ` · Ref ${p.reference}` : ''}</p>
          <div className="receipt">
            {p.items.map((i, k) => <div className="line" key={k}><span>{i.quantity} × {i.variantLabel ? `${i.productName} (${i.variantLabel})` : i.productName} @ {money(i.unitCost)}</span><span>{money(i.lineTotal)}</span></div>)}
            <hr style={{ border: 0, borderTop: '1px dashed var(--line)', margin: '10px 0' }} />
            <div className="line"><strong>Total</strong><strong>{money(p.total)}</strong></div>
            <div className="line"><span>Paid</span><span>{money(p.amountPaid)}</span></div>
            {Number(p.amountOwed) > 0 && <div className="line"><span>Still owed to supplier</span><strong>{money(p.amountOwed)}</strong></div>}
          </div>
          <p className="muted small">The stock was added to your inventory when this was recorded.</p>
        </>
      )}
    </Modal>
  )
}

export default function Suppliers() {
  const nav = useNavigate()
  const { can } = useAuth()
  const [tab, setTab] = useState(can('PURCHASES_VIEW') ? 'purchases' : 'suppliers')
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(null)
  const suppliers = useLoad(() => (can('SUPPLIERS_VIEW') ? api.get('/suppliers', { size: 100 }) : Promise.resolve(null)), [])
  const purchases = useLoad(() => (can('PURCHASES_VIEW') ? api.get('/purchases', { size: 50 }) : Promise.resolve(null)), [])

  return (
    <div className="stack">
      <div className="page-head">
        <div className="row"><Link to="/more" className="icon-btn" aria-label="Back"><ArrowLeft size={20} /></Link><div><h1>Suppliers</h1><p className="sub">Buy stock and track what you owe</p></div></div>
        {can('PURCHASES_CREATE') && <Link to="/purchases/new" className="btn primary"><Plus size={18} /> Receive stock</Link>}
      </div>
      <div className="tabs" role="tablist" aria-label="Suppliers">
        {can('PURCHASES_VIEW') && <button role="tab" className="tab" aria-selected={tab === 'purchases'} onClick={() => setTab('purchases')}>Purchases</button>}
        {can('SUPPLIERS_VIEW') && <button role="tab" className="tab" aria-selected={tab === 'suppliers'} onClick={() => setTab('suppliers')}>Suppliers</button>}
      </div>

      {tab === 'purchases' && (
        <>
          <ErrorBox error={purchases.error} onRetry={purchases.reload} />
          {purchases.loading && <ListSkeleton />}
          {purchases.data && purchases.data.content.length === 0 && <div className="section"><Empty title="No purchases yet" action={can('PURCHASES_CREATE') && <Link className="btn primary" to="/purchases/new">Receive stock</Link>}>When you buy stock, record it here. It adds to your stock and updates what each item costs you.</Empty></div>}
          {purchases.data && purchases.data.content.length > 0 && (
            <div className="section list">
              {purchases.data.content.map((p) => (
                <button key={p.id} className="list-item" onClick={() => setOpen(p.id)}>
                  <div className="grow"><div className="title">Purchase #{p.purchaseNumber}{p.supplierName ? ` · ${p.supplierName}` : ''}</div><div className="meta">{dateOnly(p.createdAt)}{p.reference ? ` · Ref ${p.reference}` : ''}</div></div>
                  <div className="right"><div className="num title">{money(p.total)}</div>{Number(p.amountOwed) > 0 ? <span className="badge warn">Owe {money(p.amountOwed)}</span> : <span className="badge ok">Paid</span>}</div>
                  <ChevronRight size={18} className="chev" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'suppliers' && (
        <>
          {can('SUPPLIERS_MANAGE') && <button className="btn" onClick={() => setAdding(true)}><Plus size={18} /> Add supplier</button>}
          <ErrorBox error={suppliers.error} onRetry={suppliers.reload} />
          {suppliers.loading && <ListSkeleton />}
          {suppliers.data && suppliers.data.content.length === 0 && <div className="section"><Empty title="No suppliers yet">Add the people you buy from so you can see what you owe each one.</Empty></div>}
          {suppliers.data && suppliers.data.content.length > 0 && (
            <div className="section list">
              {suppliers.data.content.map((s) => (
                <button key={s.id} className="list-item" onClick={() => nav(`/suppliers/${s.id}`)}>
                  <div className="grow"><div className="title">{s.name}</div><div className="meta">{s.phone || 'No phone'}</div></div>
                  {s.balance != null && (Number(s.balance) > 0 ? <span className="badge warn num">You owe {money(s.balance)}</span> : <span className="muted small">Settled</span>)}
                  <ChevronRight size={18} className="chev" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {adding && <SupplierForm title="Add supplier" onClose={() => setAdding(false)} onSaved={(s) => nav(`/suppliers/${s.id}`)} />}
      {open && <PurchaseModal id={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
