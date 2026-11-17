import { useCallback, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Empty, ErrorBox, Field, ListSkeleton, Modal, useLoad, useToast } from '../../components.jsx'
import { ORDER_TYPES, STAGE_LABEL, STAGE_TONE, elapsed, minutesSince, useNow, usePolling } from './shared.js'

function CancelItem({ item, order, canWaste, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [wasted, setWasted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function go() {
    if (reason.trim().length < 3) { setError('Say why it is being cancelled'); return }
    setBusy(true); setError('')
    try { await api.post(`/restaurant/items/${item.id}/cancel`, { reason: reason.trim(), wasted }); onDone() } catch (e) { setError(e.message); setBusy(false) }
  }
  return (
    <Modal title={`Cancel ${item.name}`} onClose={onClose}>
      <p>Order #{order.number}</p>
      <Field label="Reason" htmlFor="k-reason"><input id="k-reason" className="input" autoFocus maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      {canWaste && <label className="row"><input type="checkbox" checked={wasted} onChange={(e) => setWasted(e.target.checked)} /><span>The food was already made. Record the ingredients as wasted.</span></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="row"><button className="btn grow" onClick={onClose} disabled={busy}>Keep it</button><button className="btn danger solid grow" onClick={go} disabled={busy}>{busy ? 'Please wait…' : 'Cancel item'}</button></div>
    </Modal>
  )
}

function Ticket({ order, now, can, run, setCancelling }) {
  const waited = minutesSince(order.acceptedAt || order.createdAt, now)
  const tone = waited >= 25 ? 'late' : waited >= 15 ? 'warn' : ''
  const pending = order.stage === 'PENDING'
  return (
    <article className={`ticket ${tone}`} aria-label={`Order ${order.number}`}>
      <div className="row between">
        <strong>#{order.number} · {order.tableName || ORDER_TYPES[order.orderType]}</strong>
        <span className={`badge ${STAGE_TONE[order.stage] || ''}`}>{STAGE_LABEL[order.stage]}</span>
      </div>
      <div className="muted">{ORDER_TYPES[order.orderType]}{order.customerName ? ` · ${order.customerName}` : ''} · waiting {elapsed(order.createdAt, now)}{order.paymentStatus === 'PAID' ? ' · paid' : ''}</div>
      {order.note && <div className="t-note">Order note: {order.note}</div>}
      {order.items.map((i) => (
        <div className="t-line" key={i.id}>
          <div className="grow">
            <strong>{i.quantity} × {i.name}</strong>
            {i.modifiers.length > 0 && <div className="muted">{i.modifiers.join(', ')}</div>}
            {i.note && <div className="t-note">{i.note}</div>}
          </div>
          <div className="stack-sm" style={{ justifyItems: 'end' }}>
            {i.status === 'NEW' && can('KITCHEN_STATUS_UPDATE') && <button className="btn sm primary" onClick={() => run(i.id, 'PREPARING')}>Start</button>}
            {i.status === 'PREPARING' && can('KITCHEN_MARK_READY') && <button className="btn sm primary" onClick={() => run(i.id, 'READY')}>Ready</button>}
            {i.status === 'READY' && <><span className="badge ok">Ready</span>{(can('SALES_CREATE') || can('KITCHEN_STATUS_UPDATE')) && <button className="btn sm" onClick={() => run(i.id, 'SERVED')}>Served</button>}</>}
            {['PREPARING', 'READY'].includes(i.status) && can('SALES_VOID') && <button className="btn sm danger" onClick={() => setCancelling({ order, item: i })}>Cancel</button>}
          </div>
        </div>
      ))}
      {pending && (can('KITCHEN_STATUS_UPDATE') || can('SALES_CREATE')) && <button className="btn primary block" onClick={() => run(null, 'ACCEPT', order.id)}>Accept order</button>}
    </article>
  )
}

export default function Kitchen() {
  const toast = useToast()
  const { can } = useAuth()
  const now = useNow(20000)
  const board = useLoad(() => api.get('/restaurant/kitchen'), [])
  const [cancelling, setCancelling] = useState(null)
  usePolling(board.reload, 10000)

  const run = useCallback(async (itemId, status, orderId) => {
    try {
      if (status === 'ACCEPT') await api.post(`/restaurant/orders/${orderId}/accept`)
      else await api.post(`/restaurant/items/${itemId}/status?status=${status}`)
      board.reload()
    } catch (e) { toast(e.message, 'error'); board.reload() }
  }, [board, toast])

  const orders = board.data || []
  const cols = [
    ['Waiting to start', orders.filter((o) => ['PENDING', 'ACCEPTED'].includes(o.stage))],
    ['Being made', orders.filter((o) => o.stage === 'PREPARING')],
    ['Ready to serve', orders.filter((o) => o.stage === 'READY')],
  ]
  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Kitchen</h1><p className="sub">Updates every few seconds. Oldest orders first.</p></div>
        <button className="icon-btn" aria-label="Refresh kitchen" onClick={board.reload}><RefreshCw size={18} /></button>
      </div>
      <ErrorBox error={board.error} onRetry={board.reload} />
      {board.loading && !board.data && <ListSkeleton />}
      {board.data && orders.length === 0 && <div className="section"><Empty title="Nothing to cook right now">New orders appear here as soon as they are created.</Empty></div>}
      {cols.map(([title, list]) => list.length > 0 && (
        <section key={title} className="stack-sm"><h2 className="section-title">{title} ({list.length})</h2>
          <div className="kds">{list.map((o) => <Ticket key={o.id} order={o} now={now} can={can} run={run} setCancelling={setCancelling} />)}</div>
        </section>
      ))}
      {cancelling && <CancelItem {...cancelling} canWaste={can('STOCK_WASTAGE')} onClose={() => setCancelling(null)} onDone={() => { setCancelling(null); toast('Item cancelled'); board.reload() }} />}
    </div>
  )
}
