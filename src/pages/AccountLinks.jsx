import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SmartLink as Link } from '../lib/SmartLink.jsx'
import { api } from '../lib/api'
import { Field } from '../components.jsx'

function Shell({ title, sub, children }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand"><img className="brand-logo" src="/brand/logo-96.png" alt="" width="29" height="32" />ShopScale</div>
        <div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>
        {children}
      </div>
    </div>
  )
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('Enter a valid email address'); return }
    setBusy(true); setErr('')
    try { await api.post('/auth/forgot-password', { email }); setSent(true) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  if (sent) return <Shell title="Check your email" sub="If an account exists for that address, a reset link is on its way. The link works for one hour."><Link className="btn block" to="/login">Back to sign in</Link></Shell>
  return (
    <Shell title="Forgot your password?" sub="Enter your email and we will send you a link to choose a new one.">
      <form className="stack" onSubmit={submit} noValidate>
        <Field label="Email" htmlFor="fp-email" error={err}><input id="fp-email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <button className="btn primary block" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
        <Link to="/login" className="muted small">Back to sign in</Link>
      </form>
    </Shell>
  )
}

export function ResetPassword() {
  const [sp] = useSearchParams()
  const token = sp.get('token') || ''
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault()
    if (pw.length < 8) { setErr('Use at least 8 characters'); return }
    if (pw !== pw2) { setErr('The two passwords are different'); return }
    setBusy(true); setErr('')
    try { await api.post('/auth/reset-password', { token, password: pw }); setDone(true) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  if (!token) return <Shell title="Link not valid" sub="This reset link is incomplete."><Link className="btn block" to="/forgot-password">Ask for a new link</Link></Shell>
  if (done) return <Shell title="Password changed" sub="You have been signed out everywhere. Sign in with your new password."><Link className="btn primary block" to="/login">Sign in</Link></Shell>
  return (
    <Shell title="Choose a new password">
      <form className="stack" onSubmit={submit} noValidate>
        <Field label="New password" htmlFor="rp-1"><input id="rp-1" className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Field label="Repeat password" htmlFor="rp-2" error={err}><input id="rp-2" className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
        <button className="btn primary block" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
      </form>
    </Shell>
  )
}

export function VerifyEmail() {
  const [sp] = useSearchParams()
  const token = sp.get('token') || ''
  const [state, setState] = useState(token ? 'working' : 'bad')
  const [msg, setMsg] = useState('')
  const started = useRef(false)   // a link is single-use: never submit it twice (StrictMode, re-renders)
  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    api.post('/auth/verify-email', { token }).then(() => setState('ok')).catch((e) => { setMsg(e.message); setState('bad') })
  }, [token])
  if (state === 'working') return <Shell title="Confirming your email…" />
  if (state === 'ok') return <Shell title="Email confirmed" sub="Thank you. Your email address is now confirmed."><Link className="btn primary block" to="/dashboard">Continue</Link></Shell>
  return <Shell title="Link not valid" sub={msg || 'This confirmation link is not valid.'}><Link className="btn block" to="/dashboard">Go to ShopScale</Link></Shell>
}
