import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { api } from '../../lib/api'
import { newRequestId } from '../../lib/cart.js'
import { Empty, ErrorBox, Field, ListSkeleton, Modal, RangePicker, useLoad, useToast } from '../../components.jsx'
import { dateTime, money, qtyText, rangeQuery } from '../../lib/format.js'
import ItemPicker from './ItemPicker.jsx'

const REASONS = { SPOILAGE: 'Spoiled', EXPIRED: 'Expired', DAMAGE: 'Damaged or dropped', PREP_WASTE: 'Cooking or preparation waste', THEFT: 'Missing or stolen', OTHER: 'Other' }

function Record({ onClose, onDone }) {
  const toast = useToast()
  const [requestId] = useState(newRequestId)
  const [item, setItem] = useState(null)
  const [meta, setMeta] = useState(null)
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('SPOILAGE')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save() {
    if (!item) { setError('Choose what was wasted'); return }
    if (!(Number(qty) > 0)) { setError('Enter how much was wasted'); return }
    setBusy(true); setError('')
    try {
      await api.post('/wastage', { variantId: item, quantity: Number(qty), reason, note: note || null, clientRequestId: requestId })
      toast('Wastage recorded and stock updated'); onDone(); onClose()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Record wastage" onClose={onClose}>
      <ItemPicker value={item} onChange={(id, m) => { setItem(id); setMeta(m) }} label="What was wasted?" id="w-item" />
      <Field label={`How much${meta ? ` (${meta.unit})` : ''}`} htmlFor="w-qty"><input id="w-qty" className="input" type="number" inputMode="decimal" min="0" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
      <Field label="Why" htmlFor="w-reason"><select id="w-reason" className="select" value={reason} onChange={(e) => setReason(e.target.value)}>{Object.entries(REASONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
      <Field label="Note (optional)" htmlFor="w-note"><input id="w-note" className="input" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <p className="muted">This takes the item out of your stock. A dish with a recipe uses up its ingredients.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Record wastage'}</button>
    </Modal>
  )
}

export default function Wastage() {
  const [sp, setSp] = useSearchParams()
  const range = sp.get('range') || 'last7'
  const from = sp.get('from') || ''
  const to = sp.get('to') || ''
  const ready = range !== 'custom' || (from && to)
  const list = useLoad(() => (ready ? api.get('/wastage', rangeQuery(range, from, to)) : Promise.resolve(null)), [range, from, to])
  const [adding, setAdding] = useState(false)
  const d = list.data
  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Wastage</h1><p className="sub">Food and ingredients thrown away or lost</p></div>
        <button className="btn primary" onClick={() => setAdding(true)}><Plus size={18} /> Record wastage</button>
      </div>
      <RangePicker value={range} from={from} to={to} onChange={({ range: r, from: f, to: t }) => setSp(r === 'custom' ? { range: r, ...(f ? { from: f } : {}), ...(t ? { to: t } : {}) } : { range: r }, { replace: true })} />
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && <ListSkeleton />}
      {d && (
        <>
          <section className="section"><div className="kv"><span className="k">Value wasted</span><span className="v num">{money(d.totalValue)}</span></div>
            {Object.entries(d.valueByReason).map(([r, v]) => <div className="kv" key={r}><span className="k">{REASONS[r] || r}</span><span className="v num">{money(v)}</span></div>)}</section>
          {d.items.length === 0 && <div className="section"><Empty title="No wastage in this period">Good news, or nothing has been recorded yet.</Empty></div>}
          {d.items.length > 0 && (
            <div className="section list">
              {d.items.map((w) => (
                <div className="list-item" key={w.id} style={{ cursor: 'default' }}>
                  <div className="grow"><div className="title">{w.itemName} × {qtyText(w.quantity)}</div><div className="meta">{REASONS[w.reason] || w.reason} · {dateTime(w.createdAt)}{w.note ? ` · ${w.note}` : ''}</div></div>
                  <div className="num">{money(w.value)}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {adding && <Record onClose={() => setAdding(false)} onDone={list.reload} />}
    </div>
  )
}
