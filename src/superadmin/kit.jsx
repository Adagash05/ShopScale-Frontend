import { useState } from 'react'
import { Field, Modal, useDebounced } from '../components.jsx'

export const Head = ({ title, sub, children }) => <div className="page-head"><div><h1>{title}</h1>{sub && <p className="sub">{sub}</p>}</div><div className="row wrap">{children}</div></div>

export const num = (n) => Number(n || 0).toLocaleString('en-NG')
export const bytes = (n) => {
  const v = Number(n || 0)
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  if (v < 1024 ** 3) return `${(v / 1024 / 1024).toFixed(1)} MB`
  return `${(v / 1024 ** 3).toFixed(2)} GB`
}

/** Query state for a server-paginated list: changing a filter returns to page 0; typed text is debounced. */
export function useQuery(initial = {}) {
  const [f, setF] = useState({ ...initial, page: 0 })
  const q = useDebounced(f.q, 300)
  return {
    f,
    params: { ...f, q, size: f.size || 25 },
    set: (patch) => setF((s) => ({ ...s, ...patch, page: patch.page ?? 0 })),
  }
}

export function Pager({ data, onPage }) {
  if (!data || data.totalPages <= 1) return data ? <p className="small muted" style={{ padding: '8px 0' }}>{num(data.total)} result{data.total === 1 ? '' : 's'}</p> : null
  return (
    <div className="row between wrap" style={{ padding: '8px 0' }}>
      <span className="small muted">{num(data.total)} results · page {data.page + 1} of {data.totalPages}</span>
      <div className="row"><button className="btn sm" disabled={data.page <= 0} onClick={() => onPage(data.page - 1)}>Previous</button><button className="btn sm" disabled={data.page + 1 >= data.totalPages} onClick={() => onPage(data.page + 1)}>Next</button></div>
    </div>
  )
}

/** A confirmation that must carry a written reason (at least 3 characters). onSubmit(reason) throws to stay open and show the message. */
export function ReasonModal({ title, message, submitLabel, danger, onSubmit, onClose }) {
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function go(e) {
    e.preventDefault()
    if (reason.trim().length < 3) { setErr('Write a reason of at least 3 characters. It is saved in the audit log.'); return }
    setBusy(true); setErr('')
    try { await onSubmit(reason.trim()); onClose() } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <form className="stack" onSubmit={go} noValidate>
        {message && <p>{message}</p>}
        <Field label="Reason" htmlFor="sa-reason" hint="Recorded in the audit log with your name."><textarea id="sa-reason" className="textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} /></Field>
        {err && <p className="form-error" role="alert">{err}</p>}
        <div className="pt-actions"><button className={`btn ${danger ? 'danger solid' : 'primary'}`} disabled={busy}>{busy ? 'Working…' : submitLabel}</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  )
}

export function FilterBar({ children }) { return <div className="sa-filters">{children}</div> }

export function Select({ value, onChange, options, label }) {
  return (
    <select className="select" aria-label={label} value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}</option>
      {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  )
}
