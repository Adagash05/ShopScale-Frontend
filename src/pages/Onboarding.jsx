import { track } from '../analytics/analytics.js'
import { storeUrl } from '../config/env.js'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Field, useDebounced } from '../components.jsx'
import { Store, UtensilsCrossed, Cake } from 'lucide-react'
import VerifyNotice from './VerifyNotice.jsx'

export const TYPES = [
  { id: 'RETAIL', label: 'Shop or retail business', hint: 'Fashion, cosmetics, electronics, groceries, general goods', icon: Store, ready: true },
  { id: 'RESTAURANT', label: 'Restaurant or food business', hint: 'Menu, kitchen orders, pickup and delivery', icon: UtensilsCrossed, ready: false },
  { id: 'SMALL_CHOPS', label: 'Small chops or catering', hint: 'Party platters, scheduled orders and deposits', icon: Cake, ready: false },
]
const SUBTYPES = ['Fashion and clothing', 'Cosmetics and beauty', 'Electronics and phones', 'Grocery and provisions', 'Household goods', 'General store']

export function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
}

export default function Onboarding() {
  const { completeOnboarding, user, logout } = useAuth()
  const [step, setStep] = useState(1)
  const [type, setType] = useState('RETAIL')
  const [form, setForm] = useState({ name: '', subtype: SUBTYPES[0], phone: '', slug: '' })
  const [slugTouched, setSlugTouched] = useState(false)
  const [slugState, setSlugState] = useState({ checking: false, available: null, reason: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const slug = useDebounced(form.slug, 350)

  useEffect(() => {
    if (!slugTouched) setForm((f) => ({ ...f, slug: slugify(f.name) }))
  }, [form.name, slugTouched])

  useEffect(() => {
    if (step !== 3 || slug.length < 3) { setSlugState({ checking: false, available: null, reason: '' }); return }
    let live = true
    setSlugState((s) => ({ ...s, checking: true }))
    api.get('/businesses/slug-available', { slug }).then(
      (r) => live && setSlugState({ checking: false, available: r.available, reason: r.reason || '' }),
      () => live && setSlugState({ checking: false, available: null, reason: 'Could not check right now' }),
    )
    return () => { live = false }
  }, [slug, step])

  async function finish() {
    setBusy(true); setError('')
    try {
      await completeOnboarding({
        name: form.name.trim(), businessType: type, subtype: form.subtype, slug: form.slug,
        phone: form.phone || null, currency: 'NGN', timezone: 'Africa/Lagos',
      })
      track('onboarding_completed', { business_type: type })
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="row between">
          <div className="brand"><img className="brand-logo" src="/brand/logo-96.png" alt="" width="29" height="32" />ShopScale</div>
          <button className="btn sm" onClick={logout}>Sign out</button>
        </div>
        {step === 1 && <VerifyNotice email={user?.email} />}
        <div className="steps" aria-label={`Step ${step} of 3`}>{[1, 2, 3].map((n) => <i key={n} className={n <= step ? 'on' : ''} />)}</div>

        {step === 1 && (
          <div className="stack">
            <div><h1>Hi {user?.fullName?.split(' ')[0]}, what do you sell?</h1><p className="muted">This sets up the right tools for you.</p></div>
            <div className="stack-sm">
              {TYPES.map(({ id, label, hint, icon: Icon, ready }) => (
                <button key={id} type="button" className={`choice ${type === id ? 'on' : ''}`} disabled={!ready}
                  aria-pressed={type === id} onClick={() => ready && setType(id)}>
                  <Icon size={24} aria-hidden="true" />
                  <span className="grow">
                    <strong>{label}</strong>{!ready && <> <span className="badge gray">Coming soon</span></>}
                    <br /><span className="muted small">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
            <button className="btn primary block" onClick={() => setStep(2)}>Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="stack">
            <div><h1>About your business</h1></div>
            <Field label="Business name" htmlFor="bname">
              <input id="bname" className="input" value={form.name} autoFocus onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="What kind of shop?" htmlFor="subtype">
              <select id="subtype" className="select" value={form.subtype} onChange={(e) => setForm({ ...form, subtype: e.target.value })}>
                {SUBTYPES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Business phone (optional)" htmlFor="bphone">
              <input id="bphone" className="input" type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <div className="row">
              <button className="btn" onClick={() => setStep(1)}>Back</button>
              <button className="btn primary grow" disabled={!form.name.trim()} onClick={() => setStep(3)}>Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="stack">
            <div><h1>Pick your store address</h1><p className="muted">Customers will find you here once online selling opens.</p></div>
            <Field label="Store address" htmlFor="slug"
              hint={storeUrl(form.slug || 'your-name').replace(/^https?:\/\//, '')}
              error={slugState.available === false ? slugState.reason : ''}>
              <input id="slug" className="input" value={form.slug} autoCapitalize="none" autoCorrect="off"
                onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: slugify(e.target.value) }) }} />
            </Field>
            {slugState.checking && <p className="muted small">Checking…</p>}
            {slugState.available && <p className="small" style={{ color: 'var(--ok)' }}>That address is available</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="row">
              <button className="btn" onClick={() => setStep(2)}>Back</button>
              <button className="btn primary grow" disabled={busy || slugState.available !== true} onClick={finish}>
                {busy ? 'Setting up…' : 'Start my free trial'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
