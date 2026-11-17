import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Confirm, ErrorBox, Field, ListSkeleton, Modal, useLoad, useToast } from '../../components.jsx'
import { dateOnly, dateTime, money, qtyText } from '../../lib/format.js'
import { newRequestId } from '../../lib/cart.js'
import { Kpi } from '../../partners/ui.jsx'
import ItemPicker from '../restaurant/ItemPicker.jsx'
import { METHODS, STATUS, TONE, USAGE, timeText } from './cshared.js'

function PaymentModal({ ev, onClose, onDone }) {
  const toast = useToast()
  const [rid] = useState(() => newRequestId())
  const [amount, setAmount] = useState(String(Number(ev.balance) > 0 ? ev.balance : ''))
  const [method, setMethod] = useState('TRANSFER')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save() {
    if (!(Number(amount) > 0)) { setError('Enter the amount received'); return }
    if (Number(amount) > Number(ev.balance)) { setError(`This is more than the ${money(ev.balance)} still owed`); return }
    setBusy(true); setError('')
    try { onDone(await api.post(`/catering/events/${ev.id}/payments`, { amount: Number(amount), method, note: note || null, clientRequestId: rid })); toast('Payment recorded'); onClose() }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Record a payment" onClose={onClose}>
      <p className="muted">Still owed: <strong>{money(ev.balance)}</strong></p>
      <Field label="Amount received (₦)" htmlFor="cp-amt"><input id="cp-amt" className="input" type="number" inputMode="decimal" min="0" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      <div className="seg" role="group" aria-label="Paid by">{Object.entries(METHODS).map(([k, l]) => <button key={k} type="button" className={`chip ${method === k ? 'on' : ''}`} aria-pressed={method === k} onClick={() => setMethod(k)}>{l}</button>)}</div>
      <Field label="Note (optional)" htmlFor="cp-note"><input id="cp-note" className="input" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Record payment'}</button>
    </Modal>
  )
}

function CancelModal({ ev, onClose, onDone }) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [refund, setRefund] = useState('')
  const [method, setMethod] = useState('TRANSFER')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const paid = Number(ev.received) > 0
  async function save() {
    if (reason.trim().length < 3) { setError('Say why this event is being cancelled'); return }
    if (Number(refund) > Number(ev.received)) { setError('You cannot refund more than was received'); return }
    setBusy(true); setError('')
    try { onDone(await api.post(`/catering/events/${ev.id}/cancel`, { reason: reason.trim(), refundAmount: Number(refund) || 0, refundMethod: Number(refund) > 0 ? method : null })); toast('Event cancelled'); onClose() }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Cancel this event" onClose={onClose}>
      <Field label="Reason" htmlFor="cc-r"><input id="cc-r" className="input" autoFocus maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      {paid && (
        <>
          <p className="muted">The customer has paid {money(ev.received)}. Enter how much you are giving back, or leave empty to keep it.</p>
          <Field label="Refund (₦)" htmlFor="cc-ref"><input id="cc-ref" className="input" type="number" inputMode="decimal" min="0" value={refund} onChange={(e) => setRefund(e.target.value)} /></Field>
          {Number(refund) > 0 && <div className="seg" role="group" aria-label="Refund by">{Object.entries(METHODS).map(([k, l]) => <button key={k} type="button" className={`chip ${method === k ? 'on' : ''}`} aria-pressed={method === k} onClick={() => setMethod(k)}>{l}</button>)}</div>}
        </>
      )}
      {ev.stockIssued && <div className="banner warn">Ingredients were already taken out of stock. Record anything unused under Preparation so stock stays right.</div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="row"><button className="btn" onClick={onClose}>Keep event</button><button className="btn danger grow" onClick={save} disabled={busy}>{busy ? 'Cancelling…' : 'Cancel event'}</button></div>
    </Modal>
  )
}

function UsageModal({ ev, onClose, onDone }) {
  const toast = useToast()
  const [rid] = useState(() => newRequestId())
  const [variantId, setVariantId] = useState(null)
  const [kind, setKind] = useState('EXTRA')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save() {
    if (!variantId) { setError('Choose the ingredient'); return }
    if (!(Number(qty) > 0)) { setError('Enter the quantity'); return }
    setBusy(true); setError('')
    try { onDone(await api.post(`/catering/events/${ev.id}/usage`, { variantId, kind, quantity: Number(qty), note: note || null, clientRequestId: rid })); toast('Recorded'); onClose() }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Record ingredient use" onClose={onClose}>
      <ItemPicker id="us-item" label="Ingredient" kinds={['INGREDIENT', 'FINISHED', 'GOODS']} value={variantId} onChange={(id) => setVariantId(id)} />
      <div className="stack-sm">{Object.entries(USAGE).map(([k, l]) => <label className="row" key={k}><input type="radio" name="us-kind" checked={kind === k} onChange={() => setKind(k)} /><span>{l}</span></label>)}</div>
      <Field label="Quantity" htmlFor="us-qty"><input id="us-qty" className="input" type="number" inputMode="decimal" min="0" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
      <Field label="Note (optional)" htmlFor="us-note"><input id="us-note" className="input" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
    </Modal>
  )
}

function CostModal({ ev, onClose, onDone }) {
  const toast = useToast()
  const [rid] = useState(() => newRequestId())
  const [f, setF] = useState({ category: '', description: '', amount: '', estimated: false, method: 'CASH' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save() {
    if (!f.category.trim()) { setError('Say what the cost is for, for example Transport or Staff'); return }
    if (!(Number(f.amount) > 0)) { setError('Enter the amount'); return }
    setBusy(true); setError('')
    try { onDone(await api.post(`/catering/events/${ev.id}/costs`, { category: f.category.trim(), description: f.description || null, amount: Number(f.amount), estimated: f.estimated, paymentMethod: f.estimated ? null : f.method, clientRequestId: rid })); toast('Cost added'); onClose() }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Add a cost" onClose={onClose}>
      <div className="seg" role="group" aria-label="Type"><button className={`chip ${!f.estimated ? 'on' : ''}`} aria-pressed={!f.estimated} onClick={() => setF({ ...f, estimated: false })}>Already paid</button><button className={`chip ${f.estimated ? 'on' : ''}`} aria-pressed={f.estimated} onClick={() => setF({ ...f, estimated: true })}>Estimate</button></div>
      <p className="muted">{f.estimated ? 'An estimate is only a plan. It does not touch your cash or expenses.' : 'Money you actually spent. It is added to your expenses.'}</p>
      <Field label="What is it for?" htmlFor="co-cat"><input id="co-cat" className="input" autoFocus maxLength={80} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
      <Field label="Details (optional)" htmlFor="co-desc"><input id="co-desc" className="input" maxLength={300} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="Amount (₦)" htmlFor="co-amt"><input id="co-amt" className="input" type="number" inputMode="decimal" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
      {!f.estimated && <div className="seg" role="group" aria-label="Paid from">{Object.entries(METHODS).map(([k, l]) => <button key={k} type="button" className={`chip ${f.method === k ? 'on' : ''}`} aria-pressed={f.method === k} onClick={() => setF({ ...f, method: k })}>{l}</button>)}</div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Add cost'}</button>
    </Modal>
  )
}

export default function EventDetail() {
  const { id } = useParams()
  const { can } = useAuth()
  const toast = useToast()
  const manage = can('CATERING_MANAGE')
  const ld = useLoad(() => api.get(`/catering/events/${id}`), [id])
  const ev = ld.data
  const [tab, setTab] = useState('overview')
  const [dlg, setDlg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [task, setTask] = useState('')

  const set = (d) => ld.setData(d)
  async function act(path, body, okMsg) {
    setBusy(true); setError('')
    try { set(await api.post(`/catering/events/${id}/${path}`, body || {})); if (okMsg) toast(okMsg) }
    catch (e) { setError(e.message); setDlg(null) } finally { setBusy(false) }
  }
  async function toggle(t) {
    try { set(await api.put(`/catering/events/${id}/tasks/${t.id}`, { done: !t.done })) } catch (e) { setError(e.message) }
  }
  async function addTask(e) {
    e.preventDefault()
    if (!task.trim()) return
    try { set(await api.post(`/catering/events/${id}/tasks`, { title: task.trim() })); setTask('') } catch (er) { setError(er.message) }
  }
  async function removeCost(c) {
    try { set(await api.del(`/catering/events/${id}/costs/${c.id}`)) } catch (e) { setError(e.message) }
  }

  if (ld.loading && !ev) return <ListSkeleton />
  if (ld.error && !ev) return <ErrorBox error={ld.error} onRetry={ld.reload} />
  if (!ev) return null
  const money$ = ev.showMoney
  const st = ev.status
  const live = ['BOOKED', 'IN_PREPARATION', 'READY'].includes(st)
  const prep = st === 'IN_PREPARATION' || st === 'READY' || st === 'COMPLETED'
  const tabs = [['overview', 'Overview'], ...(money$ ? [['payments', 'Payments']] : []), ...(prep ? [['prep', 'Preparation']] : []), ...(money$ && st !== 'ENQUIRY' && st !== 'QUOTED' ? [['profit', 'Costs and profit']] : [])]
  const done = ev.tasks.filter((t) => t.done).length

  return (
    <div className="stack">
      <div className="page-head">
        <div className="row"><Link to="/events" className="icon-btn" aria-label="Back to events"><ArrowLeft size={20} /></Link><div><h1>{ev.title}</h1><p className="sub">#{ev.number} · {ev.customerName}{ev.customerPhone ? ` · ${ev.customerPhone}` : ''}</p></div></div>
        <span className={`badge ${TONE[st]}`}>{STATUS[st]}</span>
      </div>
      {error && <div className="banner warn" role="alert">{error}</div>}

      {manage && (
        <div className="row wrap">
          {(st === 'ENQUIRY' || st === 'QUOTED') && <Link className="btn" to={`/events/${id}/edit`}>Edit details and price</Link>}
          {st === 'ENQUIRY' && <button className="btn primary" disabled={busy} onClick={() => act('quote', null, 'Quotation marked as sent')}>Send quotation</button>}
          {(st === 'ENQUIRY' || st === 'QUOTED') && <button className="btn primary" disabled={busy} onClick={() => act('confirm', { allowSameDay: false }, 'Booking confirmed')}>Confirm booking</button>}
          {st === 'BOOKED' && <button className="btn primary" disabled={busy} onClick={() => act('prepare', null, 'Preparation started')}>Start preparation</button>}
          {st === 'IN_PREPARATION' && <button className="btn primary" disabled={busy} onClick={() => act('ready', null, 'Marked ready')}>Food is ready</button>}
          {(st === 'IN_PREPARATION' || st === 'READY') && <button className="btn primary" disabled={busy} onClick={() => setDlg('complete')}>Complete event</button>}
          {st !== 'COMPLETED' && st !== 'CANCELLED' && <button className="btn danger" disabled={busy} onClick={() => setDlg('cancel')}>Cancel</button>}
        </div>
      )}
      {st === 'CANCELLED' && ev.cancelReason && <div className="banner">Cancelled: {ev.cancelReason}</div>}

      <div className="pill-bar" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={`chip ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l}</button>)}</div>

      {tab === 'overview' && (
        <>
          <div className="section">
            <div className="kv"><span className="k">Date</span><span className="v">{dateOnly(ev.eventDate)}{ev.startTime ? ` at ${timeText(ev.startTime)}` : ''}</span></div>
            <div className="kv"><span className="k">Guests</span><span className="v">{ev.guests}</span></div>
            {ev.venue && <div className="kv"><span className="k">Venue</span><span className="v">{ev.venue}</span></div>}
            {ev.packageName && <div className="kv"><span className="k">Package</span><span className="v">{ev.packageName}</span></div>}
            {ev.requirements && <div className="kv"><span className="k">Requirements</span><span className="v">{ev.requirements}</span></div>}
            {ev.quoteValidUntil && (st === 'ENQUIRY' || st === 'QUOTED') && <div className="kv"><span className="k">Quotation valid until</span><span className="v">{dateOnly(ev.quoteValidUntil)}</span></div>}
          </div>
          {money$ && ev.quote && (
            <div className="section">
              {ev.packageName && <div className="kv"><span className="k">{ev.packageName} ({ev.quote.billedGuests} guests)</span><span className="v num">{money(ev.quote.packageTotal)}</span></div>}
              {ev.quote.services.map((s) => <div className="kv" key={s.id}><span className="k">{s.name}{s.quantity > 1 ? ` × ${s.quantity}` : ''}</span><span className="v num">{money(s.lineTotal)}</span></div>)}
              {Number(ev.quote.discount) > 0 && <div className="kv"><span className="k">Discount</span><span className="v num">-{money(ev.quote.discount)}</span></div>}
              <div className="kv"><span className="k"><strong>Total</strong></span><span className="v num"><strong>{money(ev.quote.total)}</strong></span></div>
              <div className="kv"><span className="k">Deposit needed to confirm</span><span className="v num">{money(ev.depositRequired)}</span></div>
              <div className="kv"><span className="k">Received</span><span className="v num">{money(ev.received)}</span></div>
              <div className="kv"><span className="k">Still owed</span><span className="v num">{money(ev.balance)}</span></div>
            </div>
          )}
        </>
      )}

      {tab === 'payments' && money$ && (
        <>
          <div className="kpis"><Kpi label="Total" value={money(ev.quote?.total || 0)} /><Kpi label="Received" value={money(ev.received)} /><Kpi label="Still owed" value={money(ev.balance)} tone={Number(ev.balance) > 0 ? 'warn' : undefined} /></div>
          {manage && st !== 'CANCELLED' && Number(ev.balance) > 0 && st !== 'ENQUIRY' && <button className="btn primary" onClick={() => setDlg('pay')}><Plus size={18} /> Record payment</button>}
          {manage && st === 'ENQUIRY' && <p className="muted">Send the quotation first, then record the deposit.</p>}
          <div className="section list">
            {ev.payments.length === 0 && <div className="list-item"><span className="muted">No payments yet.</span></div>}
            {ev.payments.map((p) => <div className="list-item" key={p.id} style={{ cursor: 'default' }}><div className="grow"><div className="title">{p.kind === 'REFUND' ? 'Refund' : 'Payment'} · {METHODS[p.method] || p.method}</div><div className="meta">{dateTime(p.createdAt)}{p.note ? ` · ${p.note}` : ''}</div></div><strong className="num">{p.kind === 'REFUND' ? '-' : ''}{money(p.amount)}</strong></div>)}
          </div>
        </>
      )}

      {tab === 'prep' && (
        <>
          <section className="section">
            <div className="row between" style={{ padding: '12px 16px' }}><h2 style={{ margin: 0 }}>Checklist <span className="muted">{done}/{ev.tasks.length}</span></h2></div>
            <div className="list">
              {ev.tasks.map((t) => <label className="list-item" key={t.id} style={{ cursor: manage || can('KITCHEN_STATUS_UPDATE') ? 'pointer' : 'default' }}><input type="checkbox" checked={t.done} disabled={!(manage || can('KITCHEN_STATUS_UPDATE')) || st === 'COMPLETED'} onChange={() => toggle(t)} /><span className="grow" style={t.done ? { textDecoration: 'line-through', opacity: 0.7 } : undefined}>{t.title}</span></label>)}
            </div>
            {manage && st !== 'COMPLETED' && <form className="row" onSubmit={addTask} style={{ padding: 12 }}><input className="input grow" aria-label="New checklist item" placeholder="Add a task, e.g. Buy drinks" maxLength={200} value={task} onChange={(e) => setTask(e.target.value)} /><button className="btn">Add</button></form>}
          </section>
          <section className="section">
            <div className="row between" style={{ padding: '12px 16px' }}><h2 style={{ margin: 0 }}>Ingredients</h2>
              <div className="row">
                {manage && !ev.stockIssued && st !== 'COMPLETED' && ev.plan.length > 0 && <button className="btn primary sm" disabled={busy} onClick={() => setDlg('issue')}>Take out of stock</button>}
                {ev.stockIssued && (manage || can('STOCK_WASTAGE')) && st !== 'COMPLETED' && <button className="btn sm" onClick={() => setDlg('usage')}>Extra, returned or wasted</button>}
              </div>
            </div>
            {ev.plan.length === 0 && <p className="muted" style={{ padding: '0 16px 12px' }}>This event's package has no ingredient list, so nothing needs to be taken from stock.</p>}
            {ev.stockIssued && <p className="muted" style={{ padding: '0 16px' }}>Ingredients have been taken out of stock. This happens only once per event.</p>}
            <div className="list">
              {ev.plan.map((p) => (
                <div className="list-item" key={p.variantId} style={{ cursor: 'default' }}>
                  <div className="grow"><div className="title">{p.name}</div>
                    <div className="meta">Need {qtyText(p.planned)} {p.unit}{!ev.stockIssued ? ` · in stock ${qtyText(p.onHand)}` : ''}{Number(p.extra) > 0 ? ` · extra ${qtyText(p.extra)}` : ''}{Number(p.returned) > 0 ? ` · returned ${qtyText(p.returned)}` : ''}{Number(p.wasted) > 0 ? ` · wasted ${qtyText(p.wasted)}` : ''}</div></div>
                  {!ev.stockIssued && Number(p.onHand) < Number(p.planned) && <span className="badge warn">Short by {qtyText(Number(p.planned) - Number(p.onHand))}</span>}
                  {ev.stockIssued && <strong className="num">Used {qtyText(p.used)}</strong>}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {tab === 'profit' && money$ && ev.summary && (
        <>
          <div className="kpis">
            <Kpi label="Revenue" value={money(ev.summary.revenue)} />
            <Kpi label="Estimated cost" value={money(ev.summary.estimatedCost)} />
            <Kpi label="Actual cost" value={money(ev.summary.actualCost)} />
            <Kpi label="Estimated profit" value={money(ev.summary.estimatedProfit)} />
            <Kpi label="Profit so far" value={money(ev.summary.grossProfit)} hint={`${Number(ev.summary.marginPercent).toFixed(1)}% margin`} tone={Number(ev.summary.grossProfit) < 0 ? 'warn' : undefined} />
          </div>
          <div className="section">
            <div className="kv"><span className="k">Ingredients, planned</span><span className="v num">{money(ev.summary.estimatedIngredients)}</span></div>
            <div className="kv"><span className="k">Ingredients, actually used</span><span className="v num">{money(ev.summary.actualIngredients)}</span></div>
            <div className="kv"><span className="k">Other costs, planned</span><span className="v num">{money(ev.summary.estimatedOther)}</span></div>
            <div className="kv"><span className="k">Other costs, paid</span><span className="v num">{money(ev.summary.actualOther)}</span></div>
          </div>
          {manage && st !== 'CANCELLED' && <button className="btn primary" onClick={() => setDlg('cost')}><Plus size={18} /> Add a cost</button>}
          <div className="section list">
            {ev.costs.length === 0 && <div className="list-item"><span className="muted">No other costs yet. Add transport, staff, hire and so on.</span></div>}
            {ev.costs.map((c) => (
              <div className="list-item" key={c.id} style={{ cursor: 'default' }}>
                <div className="grow"><div className="title">{c.category} {c.estimated && <span className="badge warn">Estimate</span>}</div><div className="meta">{c.description || ''}{c.description ? ' · ' : ''}{dateTime(c.createdAt)}</div></div>
                <strong className="num">{money(c.amount)}</strong>
                {manage && c.estimated && st !== 'COMPLETED' && <button className="icon-btn" aria-label={`Remove ${c.category} estimate`} onClick={() => removeCost(c)}><Trash2 size={18} /></button>}
              </div>
            ))}
          </div>
        </>
      )}

      {dlg === 'pay' && <PaymentModal ev={ev} onClose={() => setDlg(null)} onDone={set} />}
      {dlg === 'cancel' && <CancelModal ev={ev} onClose={() => setDlg(null)} onDone={set} />}
      {dlg === 'usage' && <UsageModal ev={ev} onClose={() => setDlg(null)} onDone={set} />}
      {dlg === 'cost' && <CostModal ev={ev} onClose={() => setDlg(null)} onDone={set} />}
      {dlg === 'complete' && <Confirm title="Complete this event?" message={Number(ev.balance) > 0 ? `The customer still owes ${money(ev.balance)}. You can keep recording payments after completing.` : 'This marks the event as done and finalises profit.'} confirmLabel="Complete event" busy={busy} onClose={() => setDlg(null)} onConfirm={async () => { await act('complete', null, 'Event completed'); setDlg(null) }} />}
      {dlg === 'issue' && <Confirm title="Take ingredients out of stock?" message="The ingredients planned for this event will be deducted from stock now. This can only be done once." confirmLabel="Take out of stock" busy={busy} onClose={() => setDlg(null)} onConfirm={async () => { await act('issue-stock', null, 'Stock updated'); setDlg(null) }} />}
    </div>
  )
}
