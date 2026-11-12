import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { useLoad, useToast } from '../components.jsx'
import { dateTime } from '../lib/format.js'

/** Devices signed in to this account, with sign-out for each and for all of them. Data comes from GET /auth/sessions. */
export default function DeviceSessions() {
  const { logout } = useAuth()
  const toast = useToast()
  const list = useLoad(() => api.get('/auth/sessions'), [])

  async function revoke(s) {
    if (!window.confirm(`Sign out ${s.device}?`)) return
    try { await api.del(`/auth/sessions/${s.id}`); toast('Signed out'); list.reload() } catch (e) { toast(e.message, 'error') }
  }
  async function all() {
    if (!window.confirm('Sign out of every device, including this one?')) return
    try { await api.post('/auth/logout-all', {}) } catch (e) { toast(e.message, 'error'); return }
    await logout()
  }
  return (
    <div className="section pad stack-sm">
      <div className="row between"><strong>Devices signed in</strong><button type="button" className="btn sm" onClick={all}>Sign out everywhere</button></div>
      {list.error && <p className="form-error">{list.error.message || 'Could not load devices'}</p>}
      {list.data?.map((s) => (
        <div className="row between" key={s.id}>
          <div><div>{s.device}{s.current ? ' (this device)' : ''}</div><div className="muted small">Signed in {dateTime(s.signedInAt)} · last used {dateTime(s.lastUsedAt)}</div></div>
          {!s.current && <button type="button" className="btn sm" onClick={() => revoke(s)}>Sign out</button>}
        </div>
      ))}
    </div>
  )
}
