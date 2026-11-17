import { useState } from 'react'
import { useDebounced, useLoad } from '../../components.jsx'
import { loadProducts, variantName } from './shared.js'

/** Search-and-choose for one product variant. `kinds` limits the types shown (for example ['INGREDIENT']). */
export default function ItemPicker({ kinds, value, onChange, label = 'Item', id = 'item-pick' }) {
  const all = useLoad(async () => {
    const ps = await loadProducts()
    return ps.filter((p) => !kinds || kinds.includes(p.kind)).flatMap((p) => p.variants.map((v) => ({ id: v.id, name: variantName(p, v), unit: v.unit, kind: p.kind, allowDecimal: v.allowDecimal })))
  }, [(kinds || []).join(',')])
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const items = all.data || []
  const chosen = items.find((i) => i.id === value)
  const matches = dq ? items.filter((i) => i.name.toLowerCase().includes(dq.toLowerCase())).slice(0, 8) : []
  if (chosen) {
    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <div className="row"><strong className="grow" id={id}>{chosen.name}</strong><button type="button" className="btn sm" onClick={() => { onChange(null, null); setQ('') }}>Change</button></div>
      </div>
    )
  }
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" placeholder={all.loading ? 'Loading…' : 'Type to search'} value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      {all.error && <span className="err" role="alert">{all.error.message}</span>}
      {dq && matches.length === 0 && !all.loading && <span className="hint">Nothing found. Add it in Products first.</span>}
      {matches.map((m) => <button type="button" key={m.id} className="btn block" style={{ marginTop: 6, justifyContent: 'flex-start' }} onClick={() => onChange(m.id, m)}>{m.name} <span className="muted">· {m.unit}</span></button>)}
    </div>
  )
}
