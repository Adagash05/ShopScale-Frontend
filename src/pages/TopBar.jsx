import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { api } from '../lib/api'
import { useToast } from '../components.jsx'
import { useOnline } from '../pwa/useOnline.js'
import { usePendingCount, useOfflineSync, useSyncStatus } from '../lib/useOfflineSync.js'

/** Bell with the unread count, plus a one-line banner while the owner's email is still unconfirmed. */
export default function TopBar() {
  const toast = useToast()
  const online = useOnline()
  const queue = usePendingCount()
  useOfflineSync()
  const sync = useSyncStatus()
  const [unread, setUnread] = useState(0)
  const [ver, setVer] = useState(null)
  useEffect(() => {
    let live = true
    const poll = () => api.get('/notifications', { size: 1 }).then((r) => { if (live) setUnread(r.unread) }).catch(() => {})
    poll()
    const t = setInterval(poll, 60000)
    api.get('/auth/verification-status').then((v) => { if (live) setVer(v) }).catch(() => {})
    return () => { live = false; clearInterval(t) }
  }, [])
  async function resend() {
    try { await api.post('/auth/resend-verification'); toast('Confirmation email sent') } catch (e) { toast(e.message, 'error') }
  }
  return (
    <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, padding: '8px 16px' }}>
      {ver && !ver.verified && (
        <span className="muted small" style={{ marginRight: 'auto' }}>Please confirm your email address. {ver.emailConfigured && <button className="btn sm" onClick={resend}>Send the email again</button>}</span>
      )}
      <span className={`badge ${online ? 'ok' : 'warn'}`} role="status">{online ? 'Online' : 'Offline'}</span>
      {(queue.pending > 0 || queue.failed > 0) && <Link to="/more/pending-sales" className="badge warn">{sync.running ? `Sending ${sync.done}/${sync.total}…` : `${queue.pending + queue.failed} unsent ${queue.pending + queue.failed === 1 ? 'record' : 'records'}`}</Link>}
      <Link to="/more/notifications" className="icon-btn" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} style={{ position: 'relative' }}>
        <Bell size={20} />
        {unread > 0 && <span className="badge red" style={{ position: 'absolute', top: -4, right: -4 }}>{unread > 99 ? '99+' : unread}</span>}
      </Link>
    </div>
  )
}
