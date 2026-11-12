import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { ChevronRight, Printer } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Confirm, Empty, ErrorBox, ListSkeleton, Modal, RangePicker, Skeleton, useLoad, useToast } from '../components.jsx'
import { dateTime, money, qtyText, rangeQuery } from '../lib/format.js'
import { Field } from '../components.jsx'

const METHOD = { CASH: 'Cash', TRANSFER: 'Bank transfer', CARD: 'Card' }

function ReturnItems({ sale, onClose, onDone }) {
  const toast = useToast()
  const [qty, setQty] = useState({})
  const [back, setBack] = useState({})
  const [method, setMethod] = useState('CASH')
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const open = sale.items.filter((i) => Number(i.quantity) > Number(i.quantityRefunded))
  async function save() {
    const lines = []
    for (const i of open) {
      const raw = qty[i.id]
      if (raw === undefined || raw === '') continue
      const n = Number(raw)
      const left = Number(i.quantity) - Number(i.quantityRefunded)
      if (!(n > 0) || n > left) { setErr(`Enter a quantity up to ${qtyText(left)} for ${i.productName}`); return }
      lines.push({ saleItemId: i.id, quantity: n, returnToStock: back[i.id] !== false })
    }
    if (lines.length === 0) { setErr('Enter how many of each item are coming back'); return }
    setBusy(true); setErr('')
    try { const r = await api.post(`/sales/${sale.id}/refund-items`, { lines, method, reason: reason || null }); toast('Return recorded'); onDone(r); onClose() }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Return items" onClose={onClose}>
      <p className="muted">Choose what the customer is bringing back. Anything they still owe on this sale is cleared first; the rest is paid back to them.</p>
      {open.map((i) => (
        <div className="row" key={i.id}>
          <div className="grow"><div className="title">{i.variantLabel ? `${i.productName} (${i.variantLabel})` : i.productName}</div>
            <div className="meta">Bought {qtyText(i.quantity)}{Number(i.quantityRefunded) > 0 ? ` · already returned ${qtyText(i.quantityRefunded)}` : ''}</div>
            <label className="check small"><input type="checkbox" checked={back[i.id] !== false} onChange={(e) => setBack({ ...back, [i.id]: e.target.checked })} /> Put back in stock</label></div>
          <input className="input" style={{ width: 80 }} aria-label={`Returning ${i.productName}`} type="number" inputMode="decimal" min="0" step="any" value={qty[i.id] ?? ''} onChange={(e) => setQty({ ...qty, [i.id]: e.target.value })} />
        </div>
      ))}
      <div className="seg" role="group" aria-label="Pay back with">
        {Object.entries(METHOD).map(([id, label]) => <button key={id} className={`chip ${method === id ? 'on' : ''}`} aria-pressed={method === id} onClick={() => setMethod(id)}>{label}</button>)}
      </div>
      <Field label="Reason (optional)" htmlFor="rt-reason" error={err}><input id="rt-reason" className="input" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <button className="btn primary block" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Record return'}</button>
    </Modal>
  )
}

function VoidSale({ sale, onClose, onDone }) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    if (reason.trim().length < 3) { setErr('Say why this sale is being voided'); return }
    setBusy(true)
    try { const r = await api.post(`/sales/${sale.id}/void`, { reason }); toast('Sale voided'); onDone(r); onClose() } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Void this sale" onClose={onClose}>
      <p className="muted">Use this for a sale entered by mistake. Stock is put back, the money is returned and the sale is taken out of your reports.</p>
      <Field label="Reason" htmlFor="vd-reason" error={err}><input id="vd-reason" className="input" autoFocus maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <button className="btn danger block" disabled={busy} onClick={save}>{busy ? 'Voiding…' : 'Void sale'}</button>
    </Modal>
  )
}

function SaleDetail({ id, onClose, onChanged }) {
  const { business, can } = useAuth()
  const toast = useToast()
  const d = useLoad(() => api.get(`/sales/${id}`), [id])
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [returning, setReturning] = useState(false)
  const [voiding, setVoiding] = useState(false)
  const s = d.data

  async function refund() {
    setBusy(true)
    try { d.setData(await api.post(`/sales/${id}/refund`)); toast('Sale refunded and stock returned'); setConfirm(false); onChanged() }
    catch (e) { toast(e.message, 'error'); setConfirm(false) } finally { setBusy(false) }
  }

  return (
    <Modal title={s ? `Sale #${s.saleNumber}` : 'Sale'} onClose={onClose}>
      <ErrorBox error={d.error} onRetry={d.reload} />
      {!s && !d.error && <Skeleton height={140} />}
      {s && (
        <>
          <div className="receipt receipt-print">
            <h3>{business.name}</h3>
            <p className="muted small">{dateTime(s.createdAt)}{s.customerName ? ` · ${s.customerName}` : ''} {s.status === 'REFUNDED' && <span className="badge danger">Refunded</span>}{s.status === 'VOIDED' && <span className="badge danger">Voided</span>}</p>
            <hr style={{ border: 0, borderTop: '1px dashed var(--line)', margin: '10px 0' }} />
            {s.items.map((i, idx) => <div className="line" key={idx}><span>{i.quantity} × {i.variantLabel ? `${i.productName} (${i.variantLabel})` : i.productName}</span><span>{money(i.lineTotal)}</span></div>)}
            <hr style={{ border: 0, borderTop: '1px dashed var(--line)', margin: '10px 0' }} />
            {Number(s.discount) > 0 && <div className="line"><span>Discount</span><span>-{money(s.discount)}</span></div>}
            <div className="line"><strong>Total</strong><strong>{money(s.total)}</strong></div>
            {s.payments.map((p, i) => <div className="line" key={i}><span>Paid by {METHOD[p.method]}</span><span>{money(p.amount)}</span></div>)}
            {Number(s.amountOwed) > 0 && <div className="line"><span>Amount remaining</span><strong>{money(s.amountOwed)}</strong></div>}
            {Number(s.refundedAmount) > 0 && <div className="line"><span>Returned</span><span>-{money(s.refundedAmount)}</span></div>}
            {s.voidReason && <p className="muted small">Voided: {s.voidReason}</p>}
          </div>
          <div className="row"><button className="btn grow" onClick={() => window.print()}><Printer size={18} /> Print receipt</button>
            {can('CUSTOMER_INVOICES_MANAGE') && s.status === 'COMPLETED' && <Link className="btn grow" to={`/more/invoices/new?sale=${s.id}`}>Create invoice</Link>}
            {can('SALES_REFUND') && s.status === 'COMPLETED' && <button className="btn grow" onClick={() => setReturning(true)}>Return items</button>}</div>
          <div className="row">
            {can('SALES_REFUND') && s.status === 'COMPLETED' && <button className="btn danger grow" onClick={() => setConfirm(true)}>Refund everything</button>}
            {can('SALES_VOID') && s.status === 'COMPLETED' && Number(s.refundedAmount) === 0 && <button className="btn danger grow" onClick={() => setVoiding(true)}>Void sale</button>}</div>
        </>
      )}
      {returning && s && <ReturnItems sale={s} onClose={() => setReturning(false)} onDone={(r) => { d.setData(r); onChanged() }} />}
      {voiding && s && <VoidSale sale={s} onClose={() => setVoiding(false)} onDone={(r) => { d.setData(r); onChanged() }} />}
      {confirm && <Confirm title="Refund this whole sale?" danger busy={busy} confirmLabel="Refund sale"
        message="The items go back into stock, the sale is removed from your sales and profit, and any amount the customer still owed for it is cleared. The money paid for it is recorded as paid back." onConfirm={refund} onClose={() => setConfirm(false)} />}
    </Modal>
  )
}

export default function SalesHistory() {
  const [sp, setSp] = useSearchParams()
  const range = sp.get('range') || 'today'
  const from = sp.get('from') || ''
  const to = sp.get('to') || ''
  const ready = range !== 'custom' || (from && to)
  const list = useLoad(() => (ready ? api.get('/sales', { ...rangeQuery(range, from, to), size: 100 }) : Promise.resolve(null)), [range, from, to])
  const [open, setOpen] = useState(null)
  const rows = list.data?.content

  return (
    <div className="stack">
      <div className="page-head"><div><h1>Sales</h1><p className="sub">Every sale you have recorded</p></div></div>
      <RangePicker value={range} from={from} to={to} onChange={({ range: r, from: f, to: t }) => setSp(r === 'custom' ? { range: r, ...(f ? { from: f } : {}), ...(t ? { to: t } : {}) } : { range: r }, { replace: true })} />
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && <ListSkeleton />}
      {rows && rows.length === 0 && <div className="section"><Empty title="No sales in this period" /></div>}
      {rows && rows.length > 0 && (
        <div className="section list">
          {rows.map((s) => (
            <button key={s.id} className="list-item" onClick={() => setOpen(s.id)}>
              <div className="grow"><div className="title">Sale #{s.saleNumber}{s.customerName ? ` · ${s.customerName}` : ''}</div><div className="meta">{dateTime(s.createdAt)}</div></div>
              <div className="right"><div className="num title">{money(s.total)}</div>
                {s.status === 'REFUNDED' ? <span className="badge danger">Refunded</span> : s.status === 'VOIDED' ? <span className="badge danger">Voided</span> : Number(s.amountOwed) > 0 ? <span className="badge warn">Owes {money(s.amountOwed)}</span> : <span className="badge ok">Paid</span>}</div>
              <ChevronRight size={18} className="chev" />
            </button>
          ))}
        </div>
      )}
      {open && <SaleDetail id={open} onClose={() => setOpen(null)} onChanged={list.reload} />}
    </div>
  )
}
