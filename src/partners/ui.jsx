import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { money } from '../lib/format.js'

export { money }

const TONE = {
  PENDING: 'warn', REQUESTED: 'warn', PROCESSING: 'teal', RESERVED: 'teal', APPROVED: 'ok', AVAILABLE: 'ok', PAID: 'ok', EARNING: 'ok',
  REJECTED: 'danger', SUSPENDED: 'danger', FAILED: 'danger', REVERSED: 'danger', CANCELLED: 'gray', PERIOD_ENDED: 'gray', REGISTERED: 'gray',
  EARNED: 'gray', ADJUSTMENT: 'teal', CLAWBACK: 'danger',
}
const LABEL = { PERIOD_ENDED: 'Period ended', REGISTERED: 'Signed up', EARNING: 'Earning', CLAWBACK: 'Deduction' }

export function label(s) {
  if (!s) return ''
  return LABEL[s] || s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ')
}

export function StatusBadge({ status }) {
  return <span className={`badge ${TONE[status] || ''}`}>{label(status)}</span>
}

export function Kpi({ label: l, value, hint, tone }) {
  return (
    <div className={`kpi accent ${tone || ''}`}>
      <div className="label">{l}</div>
      <div className="value num">{value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}

/** columns: [{ key, label, render?(row), right? }] */
export function DataTable({ columns, rows, rowKey = (r) => r.id, empty = 'Nothing here yet.' }) {
  if (!rows || rows.length === 0) return <p className="muted" style={{ padding: 16 }}>{empty}</p>
  return (
    <div className="scroll-x">
      <table className="pt-table">
        <thead><tr>{columns.map((c) => <th key={c.key} scope="col" className={c.right ? 'r' : ''}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)}>{columns.map((c) => <td key={c.key} className={c.right ? 'r num' : ''}>{c.render ? c.render(r) : r[c.key] ?? ''}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CopyButton({ text, children = 'Copy', className = 'btn sm' }) {
  const [done, setDone] = useState(false)
  async function copy() {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text)
      else {
        const t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'
        document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t)
      }
      setDone(true); setTimeout(() => setDone(false), 1800)
    } catch { /* the link stays visible so it can be copied by hand */ }
  }
  return <button type="button" className={className} onClick={copy}>{done ? <><Check size={16} aria-hidden="true" /> Copied</> : <><Copy size={16} aria-hidden="true" /> {children}</>}</button>
}

export const pct = (rate) => `${Math.round(Number(rate) * 10000) / 100}%`
export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
export const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '')
