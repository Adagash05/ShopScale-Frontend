import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { api } from '../../lib/api'
import { newRequestId } from '../../lib/cart.js'
import { Empty, ErrorBox, Field, ListSkeleton, Modal, RangePicker, useLoad, useToast } from '../../components.jsx'
import { dateTime, money, qtyText, rangeQuery } from '../../lib/format.js'
import ItemPicker from './ItemPicker.jsx'

function Record({ onClose, onDone }) {
  const toast = useToast()
  const [requestId] = useState(newRequestId)
  const [item, setItem] = useState(null)
  const [meta, setMeta] = useState(null)
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const recipe = useLoad(() => (item ? api.get(`/recipes/${item}`) : Promise.resolve(null)), [item])
  async function save() {
    if (!item) { setError('Choose what you made'); return }
    if (!(Number(qty) > 0)) { setError('Enter how many you made'); return }
    setBusy(true); setError('')
    try {
      await api.post('/production/runs', { variantId: item, quantity: Number(qty), note: note || null, clientRequestId: requestId })
      toast('Production recorded and stock updated'); onDone(); onClose()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const r = recipe.data
  const times = r && Number(qty) > 0 ? Number(qty) / Number(r.yieldQuantity) : 0
  return (
    <Modal title="Record production" onClose={onClose}>
      <ItemPicker kinds={['FINISHED', 'GOODS']} value={item} onChange={(id, m) => { setItem(id); setMeta(m) }} label="What did you make?" id="p-item" />
      <Field label={`How many${meta ? ` (${meta.unit})` : ''}`} htmlFor="p-qty"><input id="p-qty" className="input" type="number" inputMode="decimal" min="0" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
      {item && r && r.mode === 'PRODUCTION' && (
        <div className="banner">
          This will use up ingredients{times > 0 ? ':' : ' from its recipe.'}
          {times > 0 && <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{r.lines.map((l) => <li key={l.ingredientVariantId}>{l.name}: {qtyText(Number(l.quantity) * times)} {l.unit} (have {qtyText(l.onHand)})</li>)}</ul>}
        </div>
      )}
      {item && !recipe.loading && !r && <div className="muted">No recipe is set for this product, so only the finished stock goes up. Add a recipe in Menu and tables to use ingredients automatically.</div>}
      {item && r && r.mode === 'ON_SALE' && <div className="banner warn">This item is made fresh when it is ordered, so ingredients are used when it sells. Choose a finished product instead.</div>}
      <Field label="Note (optional)" htmlFor="p-note"><input id="p-note" className="input" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Record production'}</button>
    </Modal>
  )
}

export default function Production() {
  const [sp, setSp] = useSearchParams()
  const range = sp.get('range') || 'last7'
  const from = sp.get('from') || ''
  const to = sp.get('to') || ''
  const ready = range !== 'custom' || (from && to)
  const list = useLoad(() => (ready ? api.get('/production/runs', rangeQuery(range, from, to)) : Promise.resolve(null)), [range, from, to])
  const [adding, setAdding] = useState(false)
  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Production</h1><p className="sub">Record what you baked or made. Ingredients go down and finished stock goes up.</p></div>
        <button className="btn primary" onClick={() => setAdding(true)}><Plus size={18} /> Record production</button>
      </div>
      <RangePicker value={range} from={from} to={to} onChange={({ range: r, from: f, to: t }) => setSp(r === 'custom' ? { range: r, ...(f ? { from: f } : {}), ...(t ? { to: t } : {}) } : { range: r }, { replace: true })} />
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && <ListSkeleton />}
      {list.data && list.data.length === 0 && <div className="section"><Empty title="Nothing recorded in this period">Press Record production after each bake or batch.</Empty></div>}
      {list.data && list.data.length > 0 && (
        <div className="section list">
          {list.data.map((r) => (
            <div className="list-item" key={r.id} style={{ cursor: 'default' }}>
              <div className="grow"><div className="title">{r.itemName} × {qtyText(r.quantity)}</div><div className="meta">{dateTime(r.createdAt)}{r.usedRecipe ? ` · cost ${money(r.totalCost)}` : ' · no recipe used'}{r.note ? ` · ${r.note}` : ''}</div></div>
            </div>
          ))}
        </div>
      )}
      {adding && <Record onClose={() => setAdding(false)} onDone={list.reload} />}
    </div>
  )
}
