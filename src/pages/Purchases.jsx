import { useState } from 'react'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { Empty, ErrorBox, Field, ListSkeleton, Modal, useDebounced, useLoad, useToast } from '../components.jsx'
import { dateOnly, money } from '../lib/format.js'

const STATUS = { DRAFT: 'Draft', ORDERED: 'Ordered', PARTIALLY_RECEIVED: 'Part delivered', RECEIVED: 'Fully received', CANCELLED: 'Cancelled' }

function NewOrder({ onClose, onSaved }) {
  const toast = useToast()
  const suppliers = useLoad(() => api.get('/suppliers', { size: 100 }), [])
  const [supplierId, setSupplierId] = useState('')
  const [lines, setLines] = useState([])
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const found = useLoad(() => (dq ? api.get('/products/sellable', { q: dq }) : Promise.resolve([])), [dq])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const total = lines.reduce((t, l) => t + Number(l.quantity || 0) * Number(l.unitCost || 0), 0)

  function add(v) {
    if (lines.some((l) => l.variantId === v.variantId)) return
    setLines([...lines, { variantId: v.variantId, name: v.label ? `${v.productName} (${v.label})` : v.productName, quantity: 1, unitCost: v.cost ?? 0 }])
    setQ('')
  }
  const set = (i, patch) => setLines(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)))

  async function save(placeNow) {
    if (!supplierId) { setErr('Choose a supplier'); return }
    if (lines.length === 0) { setErr('Add at least one item'); return }
    if (lines.some((l) => !(Number(l.quantity) >= 1))) { setErr('Every item needs a quantity of at least 1'); return }
    setBusy(true); setErr('')
    try {
      await api.post('/purchases', { supplierId, placeNow, items: lines.map((l) => ({ variantId: l.variantId, quantity: Number(l.quantity), unitCost: Number(l.unitCost || 0) })) })
      toast(placeNow ? 'Order placed' : 'Draft saved'); onSaved(); onClose()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="New purchase order" onClose={onClose}>
      <Field label="Supplier" htmlFor="posup">
        <select id="posup" className="select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="">Choose a supplier</option>
          {suppliers.data?.content.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <Field label="Add a product" htmlFor="poq"><input id="poq" className="input" placeholder="Search your products" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
      {(found.data || []).slice(0, 6).map((v) => (
        <button key={v.variantId} className="list-item" onClick={() => add(v)}><div className="grow title">{v.label ? `${v.productName} (${v.label})` : v.productName}</div></button>
      ))}
      {lines.map((l, i) => (
        <div key={l.variantId} className="row between" style={{ gap: 8 }}>
          <div className="grow">{l.name}</div>
          <input aria-label={`Quantity for ${l.name}`} className="input" style={{ width: 70 }} inputMode="numeric" value={l.quantity} onChange={(e) => set(i, { quantity: e.target.value })} />
          <input aria-label={`Cost for ${l.name}`} className="input" style={{ width: 100 }} inputMode="decimal" value={l.unitCost} onChange={(e) => set(i, { unitCost: e.target.value })} />
          <button className="btn" aria-label={`Remove ${l.name}`} onClick={() => setLines(lines.filter((_, k) => k !== i))}><Trash2 size={16} /></button>
        </div>
      ))}
      <p><strong>Order value: <span className="num">{money(total)}</span></strong></p>
      {err && <p role="alert" style={{ color: 'var(--danger)' }}>{err}</p>}
      <div className="row">
        <button className="btn primary" disabled={busy} onClick={() => save(true)}>Place order</button>
        <button className="btn" disabled={busy} onClick={() => save(false)}>Save as draft</button>
      </div>
    </Modal>
  )
}

function Receive({ order, onClose, onSaved }) {
  const toast = useToast()
  const [qty, setQty] = useState({})
  const [invoice, setInvoice] = useState('')
  const [pay, setPay] = useState('')
  const [method, setMethod] = useState('TRANSFER')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [requestId] = useState(() => crypto.randomUUID())
  async function save() {
    const lines = order.items.map((i) => ({ itemId: i.id, quantity: Number(qty[i.id] || 0) })).filter((l) => l.quantity > 0)
    if (lines.length === 0) { setErr('Enter how many of each item arrived'); return }
    const bad = order.items.find((i) => Number(qty[i.id] || 0) > i.remaining)
    if (bad) { setErr(`${bad.productName}: only ${bad.remaining} still to arrive`); return }
    setBusy(true); setErr('')
    try {
      await api.post(`/purchases/${order.id}/receive`, {
        lines, supplierInvoiceNumber: invoice || null, clientRequestId: requestId,
        paidNow: Number(pay) > 0 ? { amount: Number(pay), method } : null,
      })
      toast('Stock received'); onSaved(); onClose()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={`Receive goods · PO-${order.poNumber}`} onClose={onClose}>
      {order.items.filter((i) => i.remaining > 0).map((i) => (
        <div key={i.id} className="row between" style={{ gap: 8 }}>
          <div className="grow">{i.productName}{i.variantLabel ? ` (${i.variantLabel})` : ''}<div className="meta">{i.remaining} still to arrive</div></div>
          <input aria-label={`Received ${i.productName}`} className="input" style={{ width: 80 }} inputMode="numeric" value={qty[i.id] ?? ''} onChange={(e) => setQty({ ...qty, [i.id]: e.target.value })} />
        </div>
      ))}
      <Field label="Supplier invoice number (optional)" htmlFor="rinv"><input id="rinv" className="input" value={invoice} onChange={(e) => setInvoice(e.target.value)} /></Field>
      <Field label="Paid on delivery (optional)" htmlFor="rpay" hint="Leave empty to pay later; it is added to what you owe the supplier."><input id="rpay" className="input" inputMode="decimal" value={pay} onChange={(e) => setPay(e.target.value)} /></Field>
      {Number(pay) > 0 && (
        <Field label="Paid by" htmlFor="rmeth"><select id="rmeth" className="select" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="CASH">Cash</option><option value="TRANSFER">Bank transfer</option><option value="CARD">Card</option></select></Field>
      )}
      {err && <p role="alert" style={{ color: 'var(--danger)' }}>{err}</p>}
      <button className="btn primary block" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Add to stock'}</button>
    </Modal>
  )
}

function OrderDetail({ id, onClose, onChanged }) {
  const toast = useToast()
  const d = useLoad(() => api.get(`/purchases/${id}`), [id])
  const [receiving, setReceiving] = useState(false)
  const o = d.data
  async function act(path) {
    try { await api.post(`/purchases/${id}/${path}`); d.reload(); onChanged() } catch (e) { toast(e.message) }
  }
  return (
    <Modal title={o ? `PO-${o.poNumber} · ${o.supplierName}` : 'Purchase order'} onClose={onClose}>
      <ErrorBox error={d.error} onRetry={d.reload} />
      {o && (
        <div className="stack">
          <div><span className="badge">{STATUS[o.status]}</span> {o.expectedDate && <span className="muted">Expected {dateOnly(o.expectedDate)}</span>}</div>
          {o.items.map((i) => (
            <div key={i.id} className="row between">
              <span>{i.productName}{i.variantLabel ? ` (${i.variantLabel})` : ''}</span>
              <span className="num">{i.received}/{i.ordered} · {money(i.lineTotal)}</span>
            </div>
          ))}
          <div className="row between"><span>Ordered</span><span className="num">{money(o.orderedValue)}</span></div>
          <div className="row between"><span>Delivered so far</span><span className="num">{money(o.receivedValue)}</span></div>
          <div className="row between"><span>Paid</span><span className="num">{money(o.paid)}</span></div>
          <div className="row between"><strong>Still owed on this order</strong><strong className="num">{money(o.stillOwed)}</strong></div>
          <div className="row">
            {o.status === 'DRAFT' && <button className="btn primary" onClick={() => act('place')}>Place order</button>}
            {(o.status === 'ORDERED' || o.status === 'PARTIALLY_RECEIVED') && <button className="btn primary" onClick={() => setReceiving(true)}>Receive goods</button>}
            {(o.status === 'DRAFT' || o.status === 'ORDERED') && <button className="btn" onClick={() => act('cancel')}>Cancel order</button>}
          </div>
        </div>
      )}
      {receiving && <Receive order={o} onClose={() => setReceiving(false)} onSaved={() => { d.reload(); onChanged() }} />}
    </Modal>
  )
}

export default function Purchases() {
  const [status, setStatus] = useState('')
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(null)
  const list = useLoad(() => api.get('/purchases', { status, size: 50 }), [status])
  const rows = list.data?.content
  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Purchases</h1><p className="sub">Orders to suppliers and goods received</p></div>
        <button className="btn primary" onClick={() => setAdding(true)}><Plus size={18} /> New order</button>
      </div>
      <div className="chips" role="group" aria-label="Filter">
        {[['', 'All'], ['ORDERED', 'Waiting for goods'], ['PARTIALLY_RECEIVED', 'Part delivered'], ['RECEIVED', 'Received']].map(([v, l]) => (
          <button key={v} className={`chip ${status === v ? 'on' : ''}`} onClick={() => setStatus(v)}>{l}</button>
        ))}
      </div>
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && <ListSkeleton />}
      {rows && rows.length === 0 && <div className="section"><Empty title="No purchase orders yet">Create an order when you buy stock from a supplier.</Empty></div>}
      {rows && rows.length > 0 && (
        <div className="section list">
          {rows.map((p) => (
            <button key={p.id} className="list-item" onClick={() => setOpen(p.id)}>
              <div className="grow"><div className="title">PO-{p.poNumber} · {p.supplierName}</div><div className="meta">{dateOnly(p.createdAt)} · {money(p.orderedValue)}</div></div>
              <span className="badge">{STATUS[p.status]}</span><ChevronRight size={18} className="chev" />
            </button>
          ))}
        </div>
      )}
      {adding && <NewOrder onClose={() => setAdding(false)} onSaved={list.reload} />}
      {open && <OrderDetail id={open} onClose={() => setOpen(null)} onChanged={list.reload} />}
    </div>
  )
}
