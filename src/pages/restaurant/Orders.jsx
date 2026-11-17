import { useCallback, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Empty, ErrorBox, Field, ListSkeleton, Modal, useLoad, useToast } from '../../components.jsx'
import { dateTime, money } from '../../lib/format.js'
import OrderComposer from './OrderComposer.jsx'
import PayOrder from './PayOrder.jsx'
import { ITEM_LABEL, ORDER_TYPES, PAY_LABEL, PAY_TONE, STAGE_LABEL, STAGE_TONE, elapsed, useNow, usePolling } from './shared.js'

function Badges({ o }) {
  return (
    <>
      <span className={`badge ${STAGE_TONE[o.stage] || ''}`}>{STAGE_LABEL[o.stage]}</span>{' '}
      {o.status !== 'CANCELLED' && <span className={`badge ${PAY_TONE[o.paymentStatus] || ''}`}>{PAY_LABEL[o.paymentStatus]}</span>}
    </>
  )
}

/** Cancel an item or a whole order. Once cooking started a reason is needed, and the manager can record the food as wasted. */
function CancelDialog({ title, needReason, canWaste, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [wasted, setWasted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function go() {
    if (needReason && reason.trim().length < 3) { setError('Say why it is being cancelled'); return }
    setBusy(true); setError('')
    try { await onConfirm({ reason: reason.trim() || null, wasted }) } catch (e) { setError(e.message); setBusy(false) }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <Field label={needReason ? 'Reason' : 'Reason (optional)'} htmlFor="c-reason"><input id="c-reason" className="input" autoFocus maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      {needReason && canWaste && <label className="row"><input type="checkbox" checked={wasted} onChange={(e) => setWasted(e.target.checked)} /><span>The food was already made. Record the ingredients as wasted.</span></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="row"><button className="btn grow" onClick={onClose} disabled={busy}>Keep it</button><button className="btn danger solid grow" onClick={go} disabled={busy}>{busy ? 'Please wait…' : 'Cancel it'}</button></div>
    </Modal>
  )
}

function ReverseDialog({ order, onClose, onDone }) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [restock, setRestock] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function go() {
    if (reason.trim().length < 3) { setError('Say why this order is being reversed'); return }
    setBusy(true); setError('')
    try { const res = await api.post(`/restaurant/orders/${order.id}/reverse`, { reason: reason.trim(), restock }); toast('Order reversed and money returned'); onDone(res) } catch (e) { setError(e.message); setBusy(false) }
  }
  return (
    <Modal title={`Reverse order #${order.number}`} onClose={onClose}>
      <p>This cancels the sale and returns the money. Use it for a wrong order that was paid.</p>
      <Field label="Reason" htmlFor="r-reason"><input id="r-reason" className="input" autoFocus maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <label className="row"><input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} /><span>Put back the ingredients for items the kitchen has not started. Food already made is not put back.</span></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="row"><button className="btn grow" onClick={onClose} disabled={busy}>Close</button><button className="btn danger solid grow" onClick={go} disabled={busy}>{busy ? 'Please wait…' : 'Reverse order'}</button></div>
    </Modal>
  )
}

function OrderDetail({ id, tables, onClose, onChanged }) {
  const toast = useToast()
  const { can } = useAuth()
  const now = useNow()
  const load = useLoad(() => api.get(`/restaurant/orders/${id}`), [id])
  const o = load.data
  const [dlg, setDlg] = useState(null)
  const [busy, setBusy] = useState(false)

  const apply = (res) => { load.setData(res); onChanged() }
  async function run(fn, ok) {
    setBusy(true)
    try { const res = await fn(); apply(res); if (ok) toast(ok) } catch (e) { toast(e.message, 'error') } finally { setBusy(false) }
  }
  const open = o?.status === 'OPEN'
  const showMoney = o && o.total != null

  return (
    <Modal title={o ? `Order #${o.number}` : 'Order'} onClose={onClose}>
      {load.loading && <ListSkeleton rows={3} />}
      <ErrorBox error={load.error} onRetry={load.reload} />
      {o && (
        <>
          <div className="row wrap"><Badges o={o} /><span className="muted">{ORDER_TYPES[o.orderType]}{o.tableName ? ` · ${o.tableName}` : ''}{o.customerName ? ` · ${o.customerName}` : ''}</span></div>
          <div className="muted">Started {dateTime(o.createdAt)} · {elapsed(o.createdAt, now)} ago</div>
          {o.note && <div className="banner">{o.note}</div>}
          {o.cancelReason && <div className="banner warn">Cancelled: {o.cancelReason}</div>}
          {o.reversed && <div className="banner warn">This order was reversed and the money returned.</div>}
          <div className="section list">
            {o.items.map((i) => (
              <div className="list-item" key={i.id} style={{ cursor: 'default', alignItems: 'flex-start' }}>
                <div className="grow">
                  <div className="title">{i.quantity} × {i.name} <span className={`badge ${i.status === 'READY' ? 'ok' : i.status === 'PREPARING' ? 'teal' : 'gray'}`}>{ITEM_LABEL[i.status]}</span></div>
                  {i.modifiers.length > 0 && <div className="meta">{i.modifiers.join(', ')}</div>}
                  {i.note && <div className="meta">Note: {i.note}</div>}
                  {i.cancelReason && <div className="meta">Cancelled: {i.cancelReason}</div>}
                  {open && (
                    <div className="row wrap" style={{ marginTop: 6 }}>
                      {i.status === 'NEW' && <button className="btn sm" disabled={busy} onClick={() => setDlg({ kind: 'qty', item: i })}>Change</button>}
                      {i.status === 'READY' && <button className="btn sm primary" disabled={busy} onClick={() => run(() => api.post(`/restaurant/items/${i.id}/status?status=SERVED`), 'Marked served')}>Served</button>}
                      {i.status === 'NEW' && <button className="btn sm danger" disabled={busy} onClick={() => setDlg({ kind: 'item', item: i })}>Remove</button>}
                      {['PREPARING', 'READY'].includes(i.status) && can('SALES_VOID') && <button className="btn sm danger" disabled={busy} onClick={() => setDlg({ kind: 'item', item: i })}>Cancel…</button>}
                    </div>
                  )}
                </div>
                {showMoney && i.status !== 'CANCELLED' && <div className="num">{money(i.lineTotal)}</div>}
              </div>
            ))}
          </div>
          {showMoney && (
            <div className="section">
              <div className="kv"><span className="k">Total</span><span className="v num">{money(o.total)}</span></div>
              {o.saleId && <div className="kv"><span className="k">Paid</span><span className="v num">{money(o.amountPaid)}</span></div>}
              {o.saleId && Number(o.amountOwed) > 0 && <div className="kv"><span className="k">On customer's account</span><span className="v num">{money(o.amountOwed)}</span></div>}
            </div>
          )}
          <div className="row wrap">
            {open && <button className="btn" disabled={busy} onClick={() => setDlg({ kind: 'add' })}><Plus size={16} /> Add items</button>}
            {open && o.stage === 'PENDING' && (can('KITCHEN_STATUS_UPDATE') || can('SALES_CREATE')) && <button className="btn" disabled={busy} onClick={() => run(() => api.post(`/restaurant/orders/${o.id}/accept`), 'Sent to the kitchen')}>Send to kitchen</button>}
            {open && showMoney && can('SALES_CREATE') && <button className="btn primary" disabled={busy} onClick={() => setDlg({ kind: 'pay' })}>Take payment</button>}
            {open && <button className="btn danger" disabled={busy} onClick={() => setDlg({ kind: 'order' })}>Cancel order</button>}
            {o.status === 'PAID' && !o.reversed && can('SALES_VOID') && <button className="btn danger" disabled={busy} onClick={() => setDlg({ kind: 'reverse' })}>Reverse payment</button>}
          </div>
        </>
      )}
      {dlg?.kind === 'add' && <OrderComposer order={o} tables={tables} onClose={() => setDlg(null)} onDone={(res) => { setDlg(null); apply(res) }} />}
      {dlg?.kind === 'pay' && <PayOrder order={o} onClose={() => setDlg(null)} onDone={(res) => { setDlg(null); apply(res) }} />}
      {dlg?.kind === 'reverse' && <ReverseDialog order={o} onClose={() => setDlg(null)} onDone={(res) => { setDlg(null); apply(res) }} />}
      {dlg?.kind === 'order' && (
        <CancelDialog title={`Cancel order #${o.number}`} needReason={o.items.some((i) => ['PREPARING', 'READY'].includes(i.status))} canWaste={can('STOCK_WASTAGE')} onClose={() => setDlg(null)}
          onConfirm={async (body) => { const res = await api.post(`/restaurant/orders/${o.id}/cancel`, body); toast('Order cancelled'); setDlg(null); apply(res) }} />
      )}
      {dlg?.kind === 'item' && (
        <CancelDialog title={`Cancel ${dlg.item.name}`} needReason={dlg.item.status !== 'NEW'} canWaste={can('STOCK_WASTAGE')} onClose={() => setDlg(null)}
          onConfirm={async (body) => { const res = await api.post(`/restaurant/items/${dlg.item.id}/cancel`, body); toast('Item cancelled'); setDlg(null); apply(res) }} />
      )}
      {dlg?.kind === 'qty' && <QtyDialog item={dlg.item} onClose={() => setDlg(null)} onDone={(res) => { setDlg(null); apply(res) }} />}
    </Modal>
  )
}

function QtyDialog({ item, onClose, onDone }) {
  const [qty, setQty] = useState(String(item.quantity))
  const [note, setNote] = useState(item.note || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function go() {
    if (!(Number(qty) > 0)) { setError('Enter a quantity above zero'); return }
    setBusy(true); setError('')
    try { onDone(await api.put(`/restaurant/items/${item.id}`, { quantity: Number(qty), note })) } catch (e) { setError(e.message); setBusy(false) }
  }
  return (
    <Modal title={item.name} onClose={onClose}>
      <Field label="Quantity" htmlFor="q-qty"><input id="q-qty" className="input" type="number" inputMode="decimal" min="0" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
      <Field label="Note for the kitchen" htmlFor="q-note"><input id="q-note" className="input" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn primary block" onClick={go} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
    </Modal>
  )
}

export default function Orders() {
  const { can } = useAuth()
  const now = useNow()
  const [tab, setTab] = useState('open')
  const open = useLoad(() => api.get('/restaurant/orders'), [])
  const tables = useLoad(() => api.get('/restaurant/tables'), [])
  const recent = useLoad(() => (tab === 'recent' ? api.get('/restaurant/orders/recent') : Promise.resolve(null)), [tab])
  const [composer, setComposer] = useState(null)
  const [viewing, setViewing] = useState(null)
  const refresh = useCallback(() => { open.reload(); if (tab === 'recent') recent.reload() }, [open, recent, tab])
  usePolling(open.reload, 20000)

  const orders = open.data || []
  const byTable = new Map(orders.filter((o) => o.tableId).map((o) => [o.tableId, o]))
  const others = orders.filter((o) => !o.tableId)
  const active = (tables.data || []).filter((t) => t.active)

  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Orders</h1><p className="sub">Tables, takeaway and delivery</p></div>
        <div className="row">
          <button className="icon-btn" aria-label="Refresh orders" onClick={refresh}><RefreshCw size={18} /></button>
          {can('SALES_CREATE') && <button className="btn primary" onClick={() => setComposer({})}><Plus size={18} /> New order</button>}
        </div>
      </div>
      <div className="tabs" role="tablist">
        <button role="tab" className="tab" aria-selected={tab === 'open'} onClick={() => setTab('open')}>Open now</button>
        <button role="tab" className="tab" aria-selected={tab === 'recent'} onClick={() => setTab('recent')}>Recent orders</button>
      </div>
      <ErrorBox error={open.error || tables.error} onRetry={refresh} />
      {tab === 'open' && (
        <>
          {open.loading && !open.data && <ListSkeleton />}
          {active.length > 0 && (
            <section className="stack-sm"><h2 className="section-title">Tables</h2>
              <div className="tile-grid">
                {active.map((t) => {
                  const o = byTable.get(t.id)
                  return (
                    <button key={t.id} className={`tile ${o ? (o.stage === 'READY' ? 'ready' : 'busy') : ''}`} onClick={() => (o ? setViewing(o.id) : setComposer({ table: t.id }))}>
                      <span className="t-title">{t.name}</span>
                      <span className="t-meta">{o ? `#${o.number} · ${STAGE_LABEL[o.stage]}` : `Free · ${t.seats} seats`}</span>
                      {o && <span className="t-meta">{elapsed(o.createdAt, now)}{o.total != null ? ` · ${money(o.total)}` : ''}</span>}
                    </button>
                  )
                })}
              </div>
            </section>
          )}
          {open.data && active.length === 0 && tables.data && <div className="banner">No tables yet. Add your tables in Menu and tables, or take takeaway orders below.</div>}
          <section className="stack-sm"><h2 className="section-title">Takeaway and delivery</h2>
            {open.data && others.length === 0 && <div className="section"><Empty title="No open takeaway or delivery orders">Press New order to start one.</Empty></div>}
            {others.length > 0 && (
              <div className="section list">
                {others.map((o) => (
                  <button key={o.id} className="list-item" onClick={() => setViewing(o.id)}>
                    <div className="grow"><div className="title">#{o.number} · {ORDER_TYPES[o.orderType]}{o.customerName ? ` · ${o.customerName}` : ''}</div><div className="meta"><Badges o={o} /> {elapsed(o.createdAt, now)} ago</div></div>
                    {o.total != null && <strong className="num">{money(o.total)}</strong>}
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}
      {tab === 'recent' && (
        <>
          {recent.loading && <ListSkeleton />}
          <ErrorBox error={recent.error} onRetry={recent.reload} />
          {recent.data && recent.data.length === 0 && <div className="section"><Empty title="No orders yet" /></div>}
          {recent.data && recent.data.length > 0 && (
            <div className="section list">
              {recent.data.map((o) => (
                <button key={o.id} className="list-item" onClick={() => setViewing(o.id)}>
                  <div className="grow"><div className="title">#{o.number} · {ORDER_TYPES[o.orderType]}{o.tableName ? ` · ${o.tableName}` : ''}</div><div className="meta"><Badges o={o} /> {dateTime(o.createdAt)}</div></div>
                  {o.total != null && <strong className="num">{money(o.total)}</strong>}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {composer && <OrderComposer tables={tables.data} presetTable={composer.table} onClose={() => setComposer(null)} onDone={(res) => { setComposer(null); refresh(); setViewing(res.id) }} />}
      {viewing && <OrderDetail id={viewing} tables={tables.data} onClose={() => setViewing(null)} onChanged={refresh} />}
    </div>
  )
}
