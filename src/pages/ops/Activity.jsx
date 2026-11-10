import { useState } from 'react'
import { api } from '../../lib/api'
import { Empty, ErrorBox, ListSkeleton, useLoad } from '../../components.jsx'
import { dateTime } from '../../lib/format.js'

const words = (s) => (s || '').toLowerCase().replace(/_/g, ' ')

export default function Activity() {
  const [page, setPage] = useState(0)
  const [entity, setEntity] = useState('')
  const [userId, setUserId] = useState('')
  const team = useLoad(() => api.get('/team/members').catch(() => []), [])
  const h = useLoad(() => api.get('/activity/history', { page, size: 30, entity: entity || undefined, userId: userId || undefined }), [page, entity, userId])
  const members = Array.isArray(team.data) ? team.data : team.data?.members || []
  const pages = h.data ? Math.max(1, Math.ceil(h.data.total / h.data.size)) : 1
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Activity history</h1><p className="sub">Who did what, and when</p></div></div>
      <div className="row">
        <select className="input" aria-label="Filter by person" value={userId} onChange={(e) => { setUserId(e.target.value); setPage(0) }}>
          <option value="">Everyone</option>
          {members.map((m) => <option key={m.userId || m.id} value={m.userId || m.id}>{m.fullName || m.name}</option>)}
        </select>
        <select className="input" aria-label="Filter by type" value={entity} onChange={(e) => { setEntity(e.target.value); setPage(0) }}>
          <option value="">Everything</option>
          {['sale', 'expense', 'product', 'customer', 'purchase', 'stock_transfer', 'sales_document', 'branch', 'member', 'invitation', 'price_tier', 'variant'].map((x) => <option key={x} value={x}>{words(x)}</option>)}
        </select>
      </div>
      <ErrorBox error={h.error} onRetry={h.reload} />
      {h.loading && <ListSkeleton />}
      {h.data?.items.length === 0 && <div className="section"><Empty title="No activity found" /></div>}
      <div className="section list">
        {h.data?.items.map((a) => (
          <div className="list-item" key={a.id} style={{ cursor: 'default' }}>
            <div className="grow"><div className="title">{words(a.action)}{a.detail ? ` · ${a.detail}` : ''}</div><div className="meta">{a.userName || 'System'} · {dateTime(a.createdAt)}</div></div>
          </div>
        ))}
      </div>
      <div className="row between">
        <button className="btn" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
        <span className="muted small">Page {page + 1} of {pages}</span>
        <button className="btn" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  )
}
