import { useState } from 'react'
import { api } from '../../lib/api'
import { money, dateTime } from '../../lib/format.js'
import { Empty, ErrorBox, ListSkeleton, Modal, useLoad, useToast } from '../../components.jsx'

const TABS = [['', 'All'], ['NEW', 'New'], ['CONFIRMED', 'Confirmed'], ['READY', 'Ready'], ['COMPLETED', 'Done'], ['CANCELLED', 'Cancelled']]
const TONE = { PENDING_PAYMENT: 'warn', NEW: 'warn', CONFIRMED: '', READY: '', COMPLETED: 'ok', CANCELLED: 'gray' }

export default function StoreOrders() {
  const [tab, setTab] = useState('')
  const list = useLoad(() => api.get('/store/orders', { status: tab }), [tab])
  const [open, setOpen] = useState(null)
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [method, setMethod] = useState('CASH')

  async function act(path, body, ok) {
    setBusy(true)
    try { const o = await api.post(`/store/orders/${open.id}/${path}`, body); setOpen(o); list.reload(); toast(ok) } catch (e) { toast(e.message, 'error'); list.reload() } finally { setBusy(false) }
  }
  const o = open
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Online orders</h1><p className="sub">Orders from your online store</p></div></div>
      <div className="chips">{TABS.map(([k, label]) => <button key={k} className={`chip ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{label}</button>)}</div>
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && !list.data && <ListSkeleton />}
      {list.data?.length === 0 && <div className="section"><Empty title="No orders here yet" /></div>}
      <div className="section list">
        {list.data?.map((x) => (
          <button key={x.id} className="list-item" onClick={() => { setOpen(x); setMethod('CASH') }}>
            <div className="grow"><div className="title">#{x.number} - {x.customerName}</div><div className="meta">{dateTime(x.createdAt)} - {x.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'} - {x.paymentStatus === 'PAID' ? 'Paid online' : 'Pay later'}</div>{x.attention && <div className="meta" style={{ color: 'var(--danger)' }}>Needs attention</div>}</div>
            <div style={{ textAlign: 'right' }}><div className="num">{money(x.total)}</div><span className={`badge ${TONE[x.status] || ''}`}>{x.status.replace('_', ' ').toLowerCase()}</span></div>
          </button>
        ))}
      </div>
      {o && (
        <Modal title={`Order #${o.number}`} onClose={() => setOpen(null)}>
          <div className="stack">
            {o.attention && <div className="banner danger" role="alert">{o.attention} <button className="btn sm" onClick={() => act('dismiss-alert', {}, 'Dismissed')}>Dismiss</button></div>}
            <div><b>{o.customerName}</b><br /><a href={`tel:${o.phone}`}>{o.phone}</a>{o.email && <><br />{o.email}</>}</div>
            <div className="muted small">{o.deliveryMethod === 'DELIVERY' ? `Deliver to: ${o.address}` : 'Customer will pick up'}{o.note && <><br />Note: {o.note}</>}</div>
            <div className="list">{o.items.map((i) => <div key={i.variantId} className="list-item"><div className="grow">{i.name} x {i.quantity}</div><div className="num">{money(i.lineTotal)}</div></div>)}</div>
            {Number(o.deliveryFee) > 0 && <div className="kv"><span className="k">Delivery fee</span><span className="v num">{money(o.deliveryFee)}</span></div>}
            <div className="kv"><span className="k"><b>Total</b></span><span className="v num"><b>{money(o.total)}</b></span></div>
            <div className="kv"><span className="k">Payment</span><span className={`badge ${o.paymentStatus === 'PAID' ? 'ok' : 'warn'}`}>{o.paymentStatus === 'PAID' ? 'Paid online' : o.paymentMode === 'PAY_LATER' ? 'Pay on handover' : 'Not paid'}</span></div>
            {o.saleId && <div className="muted small">A sale has been recorded for this order.</div>}
            {['NEW', 'CONFIRMED', 'READY'].includes(o.status) && (
              <>
                {o.status === 'NEW' && <button className="btn primary block" disabled={busy} onClick={() => act('status/CONFIRMED', {}, 'Order confirmed')}>Confirm order</button>}
                {o.status === 'CONFIRMED' && <button className="btn primary block" disabled={busy} onClick={() => act('status/READY', {}, 'Marked ready')}>Mark as ready</button>}
                {o.paymentStatus !== 'PAID' && (
                  <div className="seg" role="group" aria-label="How the customer paid">
                    {['CASH', 'TRANSFER', 'CARD'].map((m) => <button key={m} className={`chip ${method === m ? 'on' : ''}`} onClick={() => setMethod(m)}>{m[0] + m.slice(1).toLowerCase()}</button>)}
                  </div>
                )}
                <button className="btn block" disabled={busy || o.paymentStatus === 'PENDING'} onClick={() => act('complete', o.paymentStatus === 'PAID' ? {} : { method }, 'Order completed and sale recorded')}>{o.paymentStatus === 'PAID' ? 'Hand over and complete' : 'Payment received - complete'}</button>
                {!o.saleId && <button className="btn danger block" disabled={busy} onClick={() => window.confirm('Cancel this order?') && act('cancel', {}, 'Order cancelled')}>Cancel order</button>}
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
