import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { Empty, ErrorBox, ListSkeleton, useLoad, useToast } from '../../components.jsx'
import { dateTime } from '../../lib/format.js'

export default function Notifications() {
  const toast = useToast()
  const inbox = useLoad(() => api.get('/notifications', { size: 60 }), [])
  async function readAll() {
    try { await api.post('/notifications/read-all'); inbox.reload() } catch (e) { toast(e.message, 'error') }
  }
  async function open(n) {
    if (!n.read) api.post(`/notifications/${n.id}/read`).then(inbox.reload).catch(() => {})
  }
  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Notifications</h1><p className="sub">{inbox.data ? `${inbox.data.unread} unread` : ' '}</p></div>
        {inbox.data?.unread > 0 && <button className="btn" onClick={readAll}>Mark all as read</button>}
      </div>
      <ErrorBox error={inbox.error} onRetry={inbox.reload} />
      {inbox.loading && <ListSkeleton />}
      {inbox.data?.items.length === 0 && <div className="section"><Empty title="Nothing new" /></div>}
      <div className="section list">
        {inbox.data?.items.map((n) => {
          const body = (
            <div className="grow">
              <div className="title" style={{ fontWeight: n.read ? 400 : 700 }}>{n.title}</div>
              {n.body && <div className="meta">{n.body}</div>}
              <div className="meta">{dateTime(n.createdAt)}</div>
            </div>
          )
          return n.link
            ? <Link key={n.id} to={n.link} className="list-item" onClick={() => open(n)}>{body}</Link>
            : <button key={n.id} className="list-item" onClick={() => open(n)}>{body}</button>
        })}
      </div>
    </div>
  )
}
