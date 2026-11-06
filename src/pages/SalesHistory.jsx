import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronRight, Printer } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Confirm, Empty, ErrorBox, ListSkeleton, Modal, RangePicker, Skeleton, useLoad, useToast } from '../components.jsx'
import { dateTime, money, rangeQuery } from '../lib/format.js'

const METHOD = { CASH: 'Cash', TRANSFER: 'Bank transfer', CARD: 'Card' }

function SaleDetail({ id, onClose, onChanged }) {
  const { business, can } = useAuth()
  const toast = useToast()
  const d = useLoad(() => api.get(`/sales/${id}`), [id])
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
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
            <p className="muted small">{dateTime(s.createdAt)}{s.customerName ? ` · ${s.customerName}` : ''} {s.status === 'REFUNDED' && <span className="badge danger">Refunded</span>}</p>
            <hr style={{ border: 0, borderTop: '1px dashed var(--line)', margin: '10px 0' }} />
            {s.items.map((i, idx) => <div className="line" key={idx}><span>{i.quantity} × {i.variantLabel ? `${i.productName} (${i.variantLabel})` : i.productName}</span><span>{money(i.lineTotal)}</span></div>)}
            <hr style={{ border: 0, borderTop: '1px dashed var(--line)', margin: '10px 0' }} />
            {Number(s.discount) > 0 && <div className="line"><span>Discount</span><span>-{money(s.discount)}</span></div>}
            <div className="line"><strong>Total</strong><strong>{money(s.total)}</strong></div>
            {s.payments.map((p, i) => <div className="line" key={i}><span>Paid by {METHOD[p.method]}</span><span>{money(p.amount)}</span></div>)}
            {Number(s.amountOwed) > 0 && <div className="line"><span>Amount remaining</span><strong>{money(s.amountOwed)}</strong></div>}
          </div>
          <div className="row"><button className="btn grow" onClick={() => window.print()}><Printer size={18} /> Print receipt</button>
            {can('SALES_REFUND') && s.status === 'COMPLETED' && <button className="btn danger grow" onClick={() => setConfirm(true)}>Refund sale</button>}</div>
        </>
      )}
      {confirm && <Confirm title="Refund this whole sale?" danger busy={busy} confirmLabel="Refund sale"
        message="The items go back into stock, the sale is removed from your sales and profit, and any amount the customer still owed for it is cleared. Hand any money back to the customer yourself." onConfirm={refund} onClose={() => setConfirm(false)} />}
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
                {s.status === 'REFUNDED' ? <span className="badge danger">Refunded</span> : Number(s.amountOwed) > 0 ? <span className="badge warn">Owes {money(s.amountOwed)}</span> : <span className="badge ok">Paid</span>}</div>
              <ChevronRight size={18} className="chev" />
            </button>
          ))}
        </div>
      )}
      {open && <SaleDetail id={open} onClose={() => setOpen(null)} onChanged={list.reload} />}
    </div>
  )
}
