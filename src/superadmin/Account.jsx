import { useState } from 'react'
import { api } from '../lib/api.js'
import { Field, useToast } from '../components.jsx'
import { fmtTime } from '../partners/ui.jsx'
import { Head } from './kit.jsx'
import { useAdmin } from './AdminAuth.jsx'

/** My Account: identity and password change. With {forced} it is the only screen available until a new password is set. */
export function Account({ forced }) {
  const admin = useAdmin()
  const toast = useToast()
  const [v, setV] = useState({ currentPassword: '', newPassword: '', again: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function go(e) {
    e.preventDefault(); setErr('')
    if (v.newPassword.length < 12) { setErr('Use at least 12 characters.'); return }
    if (v.newPassword !== v.again) { setErr('The two new passwords do not match.'); return }
    setBusy(true)
    try {
      const r = await api.post('/super-admin/auth/change-password', { currentPassword: v.currentPassword, newPassword: v.newPassword })
      toast(r.otherSessionsEnded > 0 ? `Password changed. ${r.otherSessionsEnded} other session(s) were ended.` : 'Password changed')
      setV({ currentPassword: '', newPassword: '', again: '' })
      await admin.reload()
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const me = admin.me
  return (
    <div className="stack" style={{ maxWidth: 520, margin: '0 auto' }}>
      <Head title={forced ? 'Set a new password' : 'My Account'} sub={forced ? 'You must replace the temporary password before using the console.' : undefined} />
      {!forced && me && <div className="pt-card stack"><div><b>{me.fullName}</b></div><div className="small">{me.email}</div><div className="small muted">Last sign-in {fmtTime(me.lastLoginAt) || 'n/a'} · password changed {fmtTime(me.passwordChangedAt) || 'never'}</div></div>}
      <form className="pt-card stack" onSubmit={go} noValidate>
        <h2>Change password</h2>
        <Field label="Current password" htmlFor="sa-cur"><input id="sa-cur" className="input" type="password" autoComplete="current-password" value={v.currentPassword} onChange={(e) => setV({ ...v, currentPassword: e.target.value })} /></Field>
        <Field label="New password" htmlFor="sa-new" hint="At least 12 characters."><input id="sa-new" className="input" type="password" autoComplete="new-password" value={v.newPassword} onChange={(e) => setV({ ...v, newPassword: e.target.value })} /></Field>
        <Field label="New password again" htmlFor="sa-new2"><input id="sa-new2" className="input" type="password" autoComplete="new-password" value={v.again} onChange={(e) => setV({ ...v, again: e.target.value })} /></Field>
        {err && <p className="form-error" role="alert">{err}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
        <p className="small muted">Changing your password signs out your other sessions.</p>
      </form>
      {forced && <button className="btn" onClick={admin.logout}>Logout</button>}
    </div>
  )
}
