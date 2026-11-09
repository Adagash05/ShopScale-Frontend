import { useState } from 'react'
import { api } from './lib/api'
import { Field, Modal, useToast } from './components.jsx'
import { useAuth } from './auth/AuthContext.jsx'
import { BranchSelect, useBranch } from './lib/branch.js'

const TYPES = [
  { id: 'RESTOCK', label: 'Add stock', hint: 'You received more items', qtyLabel: 'How many did you receive?' },
  { id: 'DAMAGED', label: 'Damaged', hint: 'Items you cannot sell', qtyLabel: 'How many are damaged?' },
  { id: 'CORRECTION', label: 'Set count', hint: 'You counted the shelf', qtyLabel: 'How many are on the shelf now?' },
]

export default function StockAdjust({ variantId, name, current, onClose, onDone }) {
  const toast = useToast()
  const branch = useBranch()
  const { can } = useAuth()
  const allowed = TYPES.filter((x) => (x.id === 'RESTOCK' ? can('STOCK_RESTOCK') : can('STOCK_ADJUST')))
  const [type, setType] = useState(allowed[0]?.id || 'RESTOCK')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const t = TYPES.find((x) => x.id === type)

  async function save() {
    const n = Number(qty)
    if (!Number.isFinite(n) || qty === '' || (type !== 'CORRECTION' && n <= 0) || n < 0) { setError('Enter a quantity'); return }
    setBusy(true); setError('')
    try {
      const r = await api.post('/inventory/adjust', { variantId, type, quantity: n, note: note || null, branchId: branch.branchId })
      toast('Stock updated')
      onDone?.(r)
      onClose()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <Modal title={`Update stock · ${name}`} onClose={onClose}>
      <p className="muted">In stock now: <strong className="num">{current}</strong></p>
      <BranchSelect branch={branch} label="Location" id="adj-branch" />
      <div className="seg" role="group" aria-label="What happened?">
        {allowed.map((x) => (
          <button key={x.id} className={`chip ${type === x.id ? 'on' : ''}`} aria-pressed={type === x.id} onClick={() => setType(x.id)}>{x.label}</button>
        ))}
      </div>
      <Field label={t.qtyLabel} htmlFor="adj-qty" hint={t.hint} error={error}>
        <input id="adj-qty" className="input" type="number" inputMode="decimal" min="0" step="any" value={qty} autoFocus onChange={(e) => setQty(e.target.value)} />
      </Field>
      <Field label="Note (optional)" htmlFor="adj-note">
        <input id="adj-note" className="input" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
    </Modal>
  )
}
