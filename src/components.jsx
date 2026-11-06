import { useEffect, useState, createContext, useContext, useCallback, useRef } from 'react'
import { X } from 'lucide-react'

export function Skeleton({ height = 16, width = '100%', style }) {
  return <div className="skeleton" style={{ height, width, ...style }} aria-hidden="true" />
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="section" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="list-item" key={i} style={{ cursor: 'default' }}>
          <div className="grow stack-sm"><Skeleton width="55%" /><Skeleton width="35%" height={12} /></div>
          <Skeleton width={64} />
        </div>
      ))}
    </div>
  )
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null
  return (
    <div className="banner danger" role="alert">
      <p>{error.message || 'Something went wrong.'}</p>
      {onRetry && <button className="btn sm" style={{ marginTop: 8 }} onClick={onRetry}>Try again</button>}
    </div>
  )
}

export function Field({ label, hint, error, children, htmlFor }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="err" role="alert">{error}</span>}
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}>
        <div className="row between">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Confirm({ title, message, confirmLabel = 'Yes, continue', danger, busy, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p>{message}</p>
      <div className="row">
        <button className="btn grow" onClick={onClose} disabled={busy}>Cancel</button>
        <button className={`btn grow ${danger ? 'danger solid' : 'primary'}`} onClick={onConfirm} disabled={busy}>
          {busy ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((message, kind = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setItems((s) => [...s, { id, message, kind }])
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3500)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (<div key={t.id} className={`toast ${t.kind === 'error' ? 'error' : ''}`}>{t.message}</div>))}
      </div>
    </ToastCtx.Provider>
  )
}

/** Small data-loading hook: { data, error, loading, reload, setData } */
export function useLoad(fn, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const run = useCallback(() => {
    let live = true
    setState((s) => ({ ...s, loading: true, error: null }))
    fn().then(
      (data) => { if (live) setState({ data, error: null, loading: false }) },
      (error) => { if (live) setState({ data: null, error, loading: false }) },
    )
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => run(), [run])
  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) }
}

export function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function RangePicker({ value, from, to, onChange }) {
  const RANGES = [
    ['today', 'Today'], ['yesterday', 'Yesterday'], ['last7', 'Last 7 days'], ['last30', 'Last 30 days'],
    ['thisMonth', 'This month'], ['lastMonth', 'Last month'], ['custom', 'Choose dates'],
  ]
  return (
    <div className="stack-sm">
      <div className="chips" role="group" aria-label="Date range">
        {RANGES.map(([id, label]) => (
          <button key={id} className={`chip ${value === id ? 'on' : ''}`} aria-pressed={value === id}
            onClick={() => onChange({ range: id, from, to })}>{label}</button>
        ))}
      </div>
      {value === 'custom' && (
        <div className="row">
          <input className="input" type="date" aria-label="From date" value={from || ''} max={to || undefined}
            onChange={(e) => onChange({ range: 'custom', from: e.target.value, to })} />
          <input className="input" type="date" aria-label="To date" value={to || ''} min={from || undefined}
            onChange={(e) => onChange({ range: 'custom', from, to: e.target.value })} />
        </div>
      )}
    </div>
  )
}
