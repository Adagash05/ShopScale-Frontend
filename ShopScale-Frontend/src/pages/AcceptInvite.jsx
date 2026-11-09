import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { ErrorBox, Field, Skeleton, useLoad } from '../components.jsx'

export default function AcceptInvite() {
  const [sp] = useSearchParams()
  const token = sp.get('token') || ''
  const nav = useNavigate()
  const { acceptInvite } = useAuth()
  const preview = useLoad(() => (token ? api.public.get('/team/invitations/preview', { token }) : Promise.reject(new Error('This invitation link is incomplete.'))), [token])
  const [form, setForm] = useState({ fullName: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const p = preview.data

  async function submit(e) {
    e.preventDefault()
    if (form.password.length < 8) { setError('Use at least 8 characters'); return }
    setBusy(true); setError('')
    try { await acceptInvite({ token, fullName: form.fullName || null, password: form.password }); nav('/dashboard', { replace: true }) }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit} noValidate>
        <div className="brand"><span className="brand-mark">S</span>ShopScale</div>
        {preview.loading && <Skeleton height={120} />}
        {preview.error && <><ErrorBox error={preview.error} /><Link className="btn" to="/login">Go to sign in</Link></>}
        {p && (
          <>
            <div><h1>Join {p.businessName}</h1><p className="muted">You have been invited as <strong>{p.roleName}</strong> using {p.email}.</p></div>
            {!p.accountExists && <Field label="Your name" htmlFor="aname"><input id="aname" className="input" defaultValue={p.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>}
            <Field label={p.accountExists ? 'Your ShopScale password' : 'Choose a password'} htmlFor="apass" hint={p.accountExists ? 'You already have an account, so enter its password to join.' : 'At least 8 characters'}>
              <input id="apass" className="input" type="password" autoComplete={p.accountExists ? 'current-password' : 'new-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="btn primary block" disabled={busy}>{busy ? 'Joining…' : 'Join the team'}</button>
          </>
        )}
      </form>
    </div>
  )
}
