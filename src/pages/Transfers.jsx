import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { Empty, ErrorBox, Field, ListSkeleton, Modal, useDebounced, useLoad, useToast } from '../components.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { dateTime } from '../lib/format.js'
import { newRequestId } from '../lib/cart.js'

const STATUS = { IN_TRANSIT: ['On the way', 'warn'], RECEIVED: ['Received', 'teal'], CANCELLED: ['Cancelled', 'gray'] }

function NewTransfer({ branches, onClose, onSaved }) {
  const toast = useToast()
  const [from, setFrom] = useState(branches.find((b) => b.main)?.id || branches[0]?.id || '')
  const [to, setTo] = useState(branches.find((b) => b.id !== (branches.find((x) => x.main)?.id || branches[0]?.id))?.id || '')
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const found = useLoad(() => (from ? api.get('/products/sellable', { q: dq, branchId: from }) : Promise.resolve([])), [dq, from])
  const [lines, setLines] = useState([])
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [requestId] = useState(newRequestId)

  function add(it) {
    setLines((ls) => (ls.some((l) => l.variantId === it.variantId) ? ls : [...ls, { variantId: it.variantId, name: it.label ? `${it.productName} (${it.label})` : it.productName, quantity: '', available: it.quantity, allowDecimal: it.allowDecimal }]))
  }
  async function send() {
    if (!from || !to || from === to) { setErr('Choose two different locations'); return }
    if (lines.length === 0) { setErr('Add at least one product'); return }
    for (const l of lines) {
      const n = Number(l.quantity)
      if (!(n > 0)) { setErr(`Enter how many ${l.name} to send`); return }
      if (!l.allowDecimal && !Number.isInteger(n)) { setErr(`${l.name} is counted in whole numbers`); return }
      if (n > Number(l.available)) { setErr(`Only ${l.available} of ${l.name} at the sending location`); return }
    }
    setBusy(true); setErr('')
    try {
      await api.post('/transfers', { fromBranchId: from, toBranchId: to, note: note || null, clientRequestId: requestId,
        items: lines.map((l) => ({ variantId: l.variantId, quantity: Number(l.quantity) })) })
      toast('Transfer sent'); onSaved(); onClose()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Send stock to another location" onClose={onClose}>
      <div className="form-grid two">
        <Field label="From" htmlFor="tf-from"><select id="tf-from" className="input" value={from} onChange={(e) => { setFrom(e.target.value); setLines([]) }}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
        <Field label="To" htmlFor="tf-to"><select id="tf-to" className="input" value={to} onChange={(e) => setTo(e.target.value)}><option value="">Choose…</option>{branches.filter((b) => b.id !== from).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
      </div>
      <input className="input" placeholder="Search product to add" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="section list" style={{ maxHeight: 160, overflowY: 'auto' }}>
        {found.data?.filter((i) => Number(i.quantity) > 0).map((it) => (
          <button key={it.variantId} className="list-item" onClick={() => add(it)}>
            <div className="grow"><div className="title">{it.label ? `${it.productName} (${it.label})` : it.productName}</div><div className="meta">{it.quantity} available here</div></div><Plus size={18} />
          </button>
        ))}
      </div>
      {lines.map((l) => (
        <div className="row" key={l.variantId}>
          <div className="grow"><div className="title">{l.name}</div><div className="meta">{l.available} available</div></div>
          <input className="input" style={{ width: 90 }} aria-label={`Quantity of ${l.name}`} type="number" inputMode="decimal" min="0" step={l.allowDecimal ? '0.001' : '1'} value={l.quantity} onChange={(e) => setLines((ls) => ls.map((x) => (x.variantId === l.variantId ? { ...x, quantity: e.target.value } : x)))} />
          <button className="icon-btn" aria-label={`Remove ${l.name}`} onClick={() => setLines((ls) => ls.filter((x) => x.variantId !== l.variantId))}><Trash2 size={18} /></button>
        </div>
      ))}
      <Field label="Note (optional)" htmlFor="tf-note" error={err}><input id="tf-note" className="input" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <button className="btn primary block" disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Send stock'}</button>
    </Modal>
  )
}

export default function Transfers() {
  const toast = useToast()
  const { can } = useAuth()
  const list = useLoad(() => api.get('/transfers', { size: 50 }), [])
  const branches = useLoad(() => api.get('/branches'), [])
  const [creating, setCreating] = useState(false)
  const active = useMemo(() => (branches.data || []).filter((b) => b.active), [branches.data])
  async function act(t, what) {
    try { await api.post(`/transfers/${t.id}/${what}`); toast(what === 'receive' ? 'Stock received' : 'Transfer cancelled'); list.reload() } catch (e) { toast(e.message, 'error') }
  }
  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Stock transfers</h1><p className="sub">Move stock between your locations</p></div>
        {can('STOCK_TRANSFER') && active.length > 1 && <button className="btn primary" onClick={() => setCreating(true)}><Plus size={18} /> Send stock</button>}
      </div>
      {active.length === 1 && <div className="banner">You have one location. Add another under Locations to move stock between them.</div>}
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && <ListSkeleton />}
      {list.data && list.data.content.length === 0 && <div className="section"><Empty title="No transfers yet" /></div>}
      <div className="stack-sm">
        {list.data?.content.map((t) => {
          const [label, tone] = STATUS[t.status] || [t.status, 'gray']
          return (
            <div className="section pad stack-sm" key={t.id}>
              <div className="row between"><strong>#{t.transferNumber} · {t.fromBranch} → {t.toBranch}</strong><span className={`badge ${tone}`}>{label}</span></div>
              <div className="meta">{dateTime(t.createdAt)}{t.note ? ` · ${t.note}` : ''}</div>
              {t.items.map((i, k) => <div className="kv" key={k}><span className="k">{i.productName}{i.variantLabel ? ` (${i.variantLabel})` : ''}</span><span className="num">{i.quantity}</span></div>)}
              {t.status === 'IN_TRANSIT' && can('STOCK_TRANSFER') && (
                <div className="row"><button className="btn primary" onClick={() => act(t, 'receive')}>Mark as received</button><button className="btn" onClick={() => act(t, 'cancel')}>Cancel</button></div>
              )}
            </div>
          )
        })}
      </div>
      {creating && <NewTransfer branches={active} onClose={() => setCreating(false)} onSaved={list.reload} />}
    </div>
  )
}
