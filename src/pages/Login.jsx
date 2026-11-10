import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { Field } from '../components.jsx'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    const errs = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Enter a valid email address'
    if (!password) errs.password = 'Enter your password'
    setErrors(errs)
    setFormError('')
    if (Object.keys(errs).length) return
    setBusy(true)
    try { await login(email, password) } catch (err) { setFormError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit} noValidate>
        <div className="brand"><img className="brand-logo" src="/brand/logo-96.png" alt="" width="29" height="32" />ShopScale</div>
        <div><h1>Welcome back</h1><p className="muted">Sign in to run your business.</p></div>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <input id="email" className="input" type="email" autoComplete="email" inputMode="email" value={email}
            aria-invalid={!!errors.email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <input id="password" className="input" type="password" autoComplete="current-password" value={password}
            aria-invalid={!!errors.password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="small"><Link to="/forgot-password">Forgot your password?</Link></p>
        <p className="muted small">New to ShopScale? <Link to="/register">Start your 14-day free trial</Link> · <Link to="/pricing">See pricing</Link></p>
      </form>
    </div>
  )
}
