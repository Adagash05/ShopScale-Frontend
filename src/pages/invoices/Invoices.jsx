import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Empty, ErrorBox, ListSkeleton, useDebounced, useLoad } from '../../components.jsx'
import { money, dateOnly } from '../../lib/format.js'
import { STATUS_BADGE, STATUS_LABEL } from '../../lib/invoiceShare.js'

const FILTERS = ['', 'DRAFT', 'SENT', 'PARTIALLY_PAID', 'OVERDUE', 'PAID', 'CANCELLED']

export default function Invoices() {
  const { can } = useAuth()
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const list = useLoad(() => api.get('/invoices', { status, q: dq, size: 50 }), [status, dq])
  const rows = list.data?.content

  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Invoices</h1><p className="sub">Bills you send to customers</p></div>
        {can('CUSTOMER_INVOICES_MANAGE') && <Link to="/more/invoices/new" className="btn primary"><Plus size={18} /> New invoice</Link>}
      </div>
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--muted)' }} aria-hidden="true" />
        <input className="input" style={{ paddingLeft: 38 }} placeholder="Search by number, customer or phone" aria-label="Search invoices" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="chips" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => <button key={f || 'all'} className={`chip ${status === f ? 'on' : ''}`} aria-pressed={status === f} onClick={() => setStatus(f)}>{f ? STATUS_LABEL[f] : 'All'}</button>)}
      </div>
      {list.loading && <ListSkeleton />}
      {list.error && <ErrorBox error={list.error} onRetry={list.reload} />}
      {rows && rows.length === 0 && <Empty title="No invoices found">{status || dq ? 'Try a different search or filter.' : 'Create your first invoice, or make one from a sale.'}</Empty>}
      {rows && rows.length > 0 && (
        <div className="section list">
          {rows.map((i) => (
            <Link key={i.id} to={`/more/invoices/${i.id}`} className="list-item">
              <div className="grow">
                <div className="title">{i.number} <span className={`badge ${STATUS_BADGE[i.status]}`}>{STATUS_LABEL[i.status]}</span></div>
                <div className="meta">{i.customerName} · {dateOnly(i.issueDate)}{i.dueDate ? ` · due ${dateOnly(i.dueDate)}` : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong className="num">{money(i.total)}</strong>
                {Number(i.balance) > 0 && Number(i.amountPaid) > 0 && <div className="meta">{money(i.balance)} left</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
