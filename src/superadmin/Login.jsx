import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Field } from '../components.jsx'
import { useAdmin } from './AdminAuth.jsx'
import './superadmin.css'

/** Sign-in for the platform owner. There is no registration, no "forgot password" and no link to this page from the merchant app. */
export default function AdminLogin() {
  const admin = useAdmin()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (admin.status === 'in') return <Navigate to="/super-admin/dashboard" replace />
  async function go(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await admin.login(email.trim(), password); nav('/super-admin/dashboard', { replace: true }) }
    catch (x) { setErr(x.message || 'Could not sign in') } finally { setBusy(false) }
  }
  return (
    <div className="sa-login">
      <form className="sa-login-card stack" onSubmit={go} noValidate>
        <div><div className="sa-brand">ShopScale</div><h1>Platform administration</h1><p className="muted small">Authorised platform staff only. Every action is recorded.</p></div>
        <Field label="Email" htmlFor="sa-email"><input id="sa-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password" htmlFor="sa-pass"><input id="sa-pass" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {err && <p className="form-error" role="alert">{err}</p>}
        <button className="btn primary" disabled={busy || !email || !password}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}
