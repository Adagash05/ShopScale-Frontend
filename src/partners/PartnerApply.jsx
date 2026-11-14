import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { SmartLink as Link } from '../lib/SmartLink.jsx'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { ErrorBox, Field, Skeleton, useLoad } from '../components.jsx'
import { useSeo } from '../marketing/Seo.jsx'
import { pct } from './ui.jsx'
import './partners.css'

export const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X (Twitter)', 'Facebook', 'WhatsApp', 'LinkedIn', 'Telegram', 'Blog / website', 'Other']
export const emptySocial = () => ({ platform: 'Instagram', url: '' })

/** Client-side checks only improve the experience; the server validates everything again. */
export function validateApplication(f, { needAccount }) {
  const e = {}
  if (!f.fullName.trim()) e.fullName = 'Enter your full name'
  if (needAccount) {
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email address'
    if (f.password.length < 8) e.password = 'Use at least 8 characters'
    else if (f.password.length > 72) e.password = 'Use no more than 72 characters'
  }
  if (f.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a phone number we can reach you on'
  if (!f.country.trim()) e.country = 'Enter your country'
  if (!f.niche.trim()) e.niche = 'Tell us what you create or work on'
  const aud = Number(f.audienceSize)
  if (f.audienceSize === '' || !Number.isFinite(aud) || aud < 0 || !Number.isInteger(aud)) e.audienceSize = 'Enter your audience size as a whole number (0 if you have none yet)'
  if (!f.socials.some((s) => s.url.trim())) e.socials = 'Add at least one link where you share content or reach people'
  if (f.reason.trim().length < 20) e.reason = 'Tell us a little more (at least 20 characters)'
  if (!f.acceptTerms) e.acceptTerms = 'Accept the partner terms to apply'
  return e
}

export function applicationBody(f) {
  return {
    fullName: f.fullName.trim(), phone: f.phone.trim(), country: f.country.trim(), location: f.location.trim() || null,
    socials: f.socials.filter((s) => s.url.trim()).map((s) => ({ platform: s.platform, url: s.url.trim() })),
    audienceSize: Number(f.audienceSize), niche: f.niche.trim(), reason: f.reason.trim(), website: f.website.trim() || null, acceptTerms: f.acceptTerms,
  }
}

export function SocialsEditor({ value, onChange, error }) {
  const set = (i, patch) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  return (
    <div className="field">
      <span style={{ fontWeight: 600 }}>Where do you share content or reach people?</span>
      <div className="stack-sm">
        {value.map((s, i) => (
          <div className="pt-social-row" key={i}>
            <select className="select" aria-label={`Platform ${i + 1}`} value={s.platform} onChange={(e) => set(i, { platform: e.target.value })}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select>
            <input className="input" aria-label={`Link ${i + 1}`} placeholder="https://… or @handle" value={s.url} onChange={(e) => set(i, { url: e.target.value })} maxLength={300} />
            {value.length > 1 && <button type="button" className="btn sm" aria-label={`Remove link ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))}><X size={16} /></button>}
          </div>
        ))}
        {value.length < 8 && <button type="button" className="btn sm" style={{ justifySelf: 'start' }} onClick={() => onChange([...value, emptySocial()])}><Plus size={16} aria-hidden="true" /> Add another</button>}
      </div>
      {error && <span className="err" role="alert">{error}</span>}
    </div>
  )
}

export default function PartnerApply() {
  useSeo({ title: 'Apply to ShopScale Partners', description: 'Apply to the ShopScale partner programme.', path: '/partners/apply', noindex: true })
  const { user, register, loading } = useAuth()
  const navigate = useNavigate()
  const programme = useLoad(() => api.public.get('/public/partners/programme'), [])
  const me = useLoad(() => (user ? api.get('/partners/me') : Promise.resolve(null)), [user?.id])
  const [f, setF] = useState({ fullName: '', email: '', password: '', phone: '', country: 'Nigeria', location: '', socials: [emptySocial()], audienceSize: '', niche: '', reason: '', website: '', acceptTerms: false })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  if (loading || (user && me.loading) || programme.loading) return <div className="auth-wrap"><div className="auth-card"><Skeleton height={28} width="50%" /><Skeleton height={220} /></div></div>
  if (user && me.data?.applied) return <Navigate to="/partners/dashboard" replace />
  const p = programme.data
  const needAccount = !user

  async function submit(e) {
    e.preventDefault()
    if (sending.current) return
    const errs = validateApplication(f, { needAccount })
    setErrors(errs); setFormError('')
    if (Object.keys(errs).length) return
    sending.current = true; setBusy(true)
    try {
      // Step 1 (new people only): create the ShopScale account. A partner account needs no business.
      if (needAccount) await register({ fullName: f.fullName.trim(), email: f.email.trim(), password: f.password, phone: f.phone.trim() })
      // Step 2: the partner application itself.
      await api.post('/partners/apply', applicationBody(f))
      navigate('/partners/dashboard', { replace: true })
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(err.message)
      // The account may now exist even though the application failed; show the application-only form next time.
      if (needAccount) me.reload()
    } finally { sending.current = false; setBusy(false) }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" style={{ maxWidth: 640 }} onSubmit={submit} noValidate>
        <div className="brand"><img className="brand-logo" src="/brand/logo-96.png" alt="" width="29" height="32" />ShopScale Partners</div>
        <div><h1>Apply to become a partner</h1>
          <p className="muted">{p ? <>Earn {pct(p.commissionRate)} of the subscription payments we receive from businesses you refer, for their first {p.commissionMonths} months.</> : 'Tell us about yourself and how you will share ShopScale.'}</p></div>
        {p && !p.active && <div className="banner danger" role="alert"><p>Applications are closed at the moment. Please check back later.</p></div>}
        {user && <p className="small muted">Applying as <b>{user.email}</b>. <Link to="/partners/login">Not you?</Link></p>}
        <ErrorBox error={programme.error || me.error} />

        <Field label="Full name" htmlFor="fullName" error={errors.fullName}><input id="fullName" className="input" autoComplete="name" value={f.fullName} onChange={set('fullName')} aria-invalid={!!errors.fullName} /></Field>
        {needAccount && <div className="pt-two">
          <Field label="Email" htmlFor="email" error={errors.email}><input id="email" className="input" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={set('email')} aria-invalid={!!errors.email} /></Field>
          <Field label="Password" htmlFor="password" error={errors.password} hint="8 to 72 characters. This creates your ShopScale account."><input id="password" className="input" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} aria-invalid={!!errors.password} /></Field>
        </div>}
        <div className="pt-two">
          <Field label="Phone / WhatsApp" htmlFor="phone" error={errors.phone}><input id="phone" className="input" type="tel" autoComplete="tel" inputMode="tel" value={f.phone} onChange={set('phone')} aria-invalid={!!errors.phone} /></Field>
          <Field label="Audience size" htmlFor="audienceSize" error={errors.audienceSize} hint="Followers, subscribers, customers or contacts you can reach"><input id="audienceSize" className="input" inputMode="numeric" value={f.audienceSize} onChange={set('audienceSize')} aria-invalid={!!errors.audienceSize} /></Field>
        </div>
        <div className="pt-two">
          <Field label="Country" htmlFor="country" error={errors.country}><input id="country" className="input" autoComplete="country-name" value={f.country} onChange={set('country')} aria-invalid={!!errors.country} /></Field>
          <Field label="City or state (optional)" htmlFor="location"><input id="location" className="input" value={f.location} onChange={set('location')} /></Field>
        </div>
        <SocialsEditor value={f.socials} onChange={(socials) => setF((x) => ({ ...x, socials }))} error={errors.socials} />
        <Field label="Niche" htmlFor="niche" error={errors.niche} hint="For example: small business tips, restaurant owners, bookkeeping"><input id="niche" className="input" value={f.niche} onChange={set('niche')} maxLength={120} aria-invalid={!!errors.niche} /></Field>
        <Field label="Website (optional)" htmlFor="website"><input id="website" className="input" inputMode="url" placeholder="https://" value={f.website} onChange={set('website')} maxLength={255} /></Field>
        <Field label="Why do you want to partner with ShopScale, and how will you share it?" htmlFor="reason" error={errors.reason}><textarea id="reason" className="textarea" rows={4} value={f.reason} onChange={set('reason')} maxLength={1000} aria-invalid={!!errors.reason} /></Field>
        <div className="field">
          <label className="row" style={{ alignItems: 'flex-start' }}>
            <input type="checkbox" checked={f.acceptTerms} onChange={(e) => setF((x) => ({ ...x, acceptTerms: e.target.checked }))} style={{ marginTop: 4 }} />
            <span className="small">I have read and accept the <Link to="/partners">partner programme terms</Link>. I will describe ShopScale honestly, will not promise businesses income, and will not sign myself up to earn commission.</span>
          </label>
          {errors.acceptTerms && <span className="err" role="alert">{errors.acceptTerms}</span>}
        </div>
        {formError && !Object.keys(errors).length && <p className="form-error" role="alert">{formError}</p>}
        <button className="btn primary block" disabled={busy || (p && !p.active)}>{busy ? 'Submitting…' : needAccount ? 'Create account and apply' : 'Submit application'}</button>
        {needAccount && <p className="muted small">Already have a ShopScale account? <Link to="/partners/login">Sign in</Link> and apply with it.</p>}
      </form>
    </div>
  )
}
