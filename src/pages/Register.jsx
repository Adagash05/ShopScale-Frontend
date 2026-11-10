import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { Field } from '../components.jsx'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.fullName.trim()) errs.fullName = 'Enter your name'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address'
    if (form.password.length < 8) errs.password = 'Use at least 8 characters'
    setErrors(errs)
    setFormError('')
    if (Object.keys(errs).length) return
    setBusy(true)
    try { await register({ ...form, phone: form.phone || null }) } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(err.message)
    } finally { setBusy(false) }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit} noValidate>
        <div className="brand"><img className="brand-logo" src="/brand/logo-96.png" alt="" width="29" height="32" />ShopScale</div>
        <div><h1>Start your free trial</h1><p className="muted">14 days free. No card needed.</p></div>
        <Field label="Your name" htmlFor="fullName" error={errors.fullName}>
          <input id="fullName" className="input" autoComplete="name" value={form.fullName} aria-invalid={!!errors.fullName} onChange={set('fullName')} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <input id="email" className="input" type="email" autoComplete="email" inputMode="email" value={form.email} aria-invalid={!!errors.email} onChange={set('email')} />
        </Field>
        <Field label="Phone (optional)" htmlFor="phone">
          <input id="phone" className="input" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters">
          <input id="password" className="input" type="password" autoComplete="new-password" value={form.password} aria-invalid={!!errors.password} onChange={set('password')} />
        </Field>
        {formError && !Object.keys(errors).length && <p className="form-error" role="alert">{formError}</p>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="muted small">Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  )
}
