import { Link, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Empty, ErrorBox, ListSkeleton, useDebounced, useLoad } from '../../components.jsx'
import { dateOnly, money } from '../../lib/format.js'
import { STATUS, TONE } from './cshared.js'
import { useState } from 'react'

export default function Events() {
  const { can } = useAuth()
  const [sp, setSp] = useSearchParams()
  const status = sp.get('status') || ''
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const list = useLoad(() => api.get('/catering/events', { status: status || undefined, q: dq || undefined }), [status, dq])
  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>All events</h1><p className="sub">Search by event, customer or number</p></div>
        {can('CATERING_MANAGE') && <Link className="btn primary" to="/events/new"><Plus size={18} /> New enquiry</Link>}
      </div>
      <input className="input" placeholder="Search events" aria-label="Search events" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="pill-bar" role="group" aria-label="Status">
        <button className={`chip ${status === '' ? 'on' : ''}`} aria-pressed={status === ''} onClick={() => setSp({}, { replace: true })}>All</button>
        {Object.entries(STATUS).map(([id, label]) => <button key={id} className={`chip ${status === id ? 'on' : ''}`} aria-pressed={status === id} onClick={() => setSp({ status: id }, { replace: true })}>{label}</button>)}
      </div>
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && <ListSkeleton />}
      {list.data && list.data.length === 0 && <div className="section"><Empty title="No events found">{status || dq ? 'Try a different filter.' : 'Capture your first enquiry to get started.'}</Empty></div>}
      {list.data && list.data.length > 0 && (
        <div className="section list">
          {list.data.map((e) => (
            <Link className="list-item" key={e.id} to={`/events/${e.id}`}>
              <div className="grow"><div className="title">#{e.number} · {e.title}</div><div className="meta">{e.customerName} · {dateOnly(e.eventDate)} · {e.guests} guests</div></div>
              <div style={{ textAlign: 'right' }}><span className={`badge ${TONE[e.status]}`}>{STATUS[e.status]}</span>{e.total != null && <div className="meta num">{money(e.total)}{Number(e.balance) > 0 ? ` · owes ${money(e.balance)}` : ''}</div>}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
