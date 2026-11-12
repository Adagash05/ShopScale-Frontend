import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useLoad } from '../components.jsx'
import { useStore } from './StoreContext.jsx'
import { usePageTitle } from './StoreLayout.jsx'
import { Stars } from './ui.jsx'

/** Newsletter sign-up. It really stores the address with this store; the merchant sees the list in their dashboard. */
export function Newsletter() {
  const { slug, info } = useStore()
  const [email, setEmail] = useState('')
  const [state, setState] = useState({ busy: false, done: false, err: '' })
  async function submit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setState({ busy: true, done: false, err: '' })
    try { await api.public.post(`/public/store/${slug}/subscribe`, { email: email.trim() }); setState({ busy: false, done: true, err: '' }); setEmail('') }
    catch (x) { setState({ busy: false, done: false, err: x.message || 'Could not subscribe. Try again.' }) }
  }
  return (
    <form className="news" onSubmit={submit} noValidate>
      <h4>Stay in touch</h4>
      <p>Get news from {info.name}.</p>
      {state.done ? <p className="news-ok" role="status">Thank you. You are on the list.</p> : (
        <div className="news-row">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" aria-label="Email address" autoComplete="email" />
          <button className="btn sm" disabled={state.busy}>{state.busy ? '…' : 'Subscribe'}</button>
        </div>
      )}
      {state.err && <p className="news-err" role="alert">{state.err}</p>}
    </form>
  )
}

/** Real, merchant-approved reviews only; renders nothing when there are none. */
export function Testimonials() {
  const { slug } = useStore()
  const t = useLoad(() => api.public.get(`/public/store/${slug}/testimonials`), [slug])
  if (!t.data?.length) return null
  return (
    <section className="section">
      <div className="wrap">
        <div className="sec-head"><div><span className="eyebrow">Customer reviews</span><h2>What customers say</h2></div></div>
        <ul className="testi">
          {t.data.slice(0, 3).map((r) => (
            <li key={r.id}><Stars value={r.rating} count={1} /><p>“{r.body}”</p><small>{r.author}{r.productName ? ` · on ${r.productName}` : ''}</small></li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Look up an order from any device with the phone number used and the order number (there are no customer accounts). */
export function OrderLookup() {
  const { slug, base } = useStore()
  const [f, setF] = useState({ phone: '', number: '' })
  const [state, setState] = useState({ busy: false, err: '', order: null })
  async function submit(e) {
    e.preventDefault()
    const n = Number(String(f.number).replace(/\D/g, ''))
    if (!f.phone.trim() || !n) { setState({ busy: false, err: 'Enter the phone number you ordered with and your order number.', order: null }); return }
    setState({ busy: true, err: '', order: null })
    try { setState({ busy: false, err: '', order: await api.public.post(`/public/store/${slug}/orders/lookup`, { phone: f.phone.trim(), number: n }) }) }
    catch (x) { setState({ busy: false, err: x.message || 'We could not find that order.', order: null }) }
  }
  return (
    <section className="lookup" aria-labelledby="lk-h">
      <h2 id="lk-h">Ordered on another device?</h2>
      <p className="muted">Find your order with the phone number you used and your order number.</p>
      <form onSubmit={submit} noValidate>
        <div className="grid-2">
          <label className="field">Phone number<input className="input" type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" /></label>
          <label className="field">Order number<input className="input" inputMode="numeric" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} placeholder="e.g. 1024" /></label>
        </div>
        <button className="btn" disabled={state.busy}>{state.busy ? 'Looking…' : 'Find my order'}</button>
      </form>
      {state.err && <div className="alert" role="alert">{state.err}</div>}
      {state.order && <p style={{ marginTop: 14 }}><Link className="btn primary" to={`${base}/order/${state.order.token}`}>Open order #{state.order.number}</Link></p>}
    </section>
  )
}

/** Shown on a completed order: one review per item, held for the business to approve. */
export function ReviewForm({ token, item }) {
  const { slug } = useStore()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [state, setState] = useState({ busy: false, err: '', done: false })
  if (!item.productId) return null
  async function submit(e) {
    e.preventDefault()
    if (!body.trim()) { setState({ busy: false, err: 'Write a few words about the item.', done: false }); return }
    setState({ busy: true, err: '', done: false })
    try { await api.public.post(`/public/store/${slug}/reviews`, { token, productId: item.productId, rating, body: body.trim() }); setState({ busy: false, err: '', done: true }) }
    catch (x) { setState({ busy: false, err: x.message || 'Could not send your review.', done: x.status === 409 }) }
  }
  if (state.done) return <p className="muted small" role="status">Thank you. Your review will appear once {` the business approves it.`}</p>
  if (!open) return <button type="button" className="btn sm" onClick={() => setOpen(true)}>Review this item</button>
  return (
    <form className="review-form" onSubmit={submit} noValidate>
      <fieldset className="rating"><legend>Your rating</legend>
        {[1, 2, 3, 4, 5].map((n) => <label key={n}><input type="radio" name={`r-${item.variantId}`} checked={rating === n} onChange={() => setRating(n)} /><span aria-hidden="true">{n <= rating ? '★' : '☆'}</span><span className="sr">{n} star{n === 1 ? '' : 's'}</span></label>)}
      </fieldset>
      <label className="field">Your review<textarea className="textarea" maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} /></label>
      {state.err && <div className="alert" role="alert">{state.err}</div>}
      <div className="row-actions"><button className="btn primary sm" disabled={state.busy}>{state.busy ? 'Sending…' : 'Send review'}</button><button type="button" className="btn sm" onClick={() => setOpen(false)}>Cancel</button></div>
    </form>
  )
}

/** Catering enquiry: a real request sent to the business (it appears in their dashboard and notifications). */
export function Enquiry() {
  const { slug, info, base } = useStore()
  usePageTitle(`Enquire | ${info.name}`)
  const [f, setF] = useState({ name: '', phone: '', email: '', eventDate: '', guests: '', message: '' })
  const [state, setState] = useState({ busy: false, err: '', done: false })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function submit(e) {
    e.preventDefault()
    if (!f.name.trim() || !f.phone.trim() || !f.message.trim()) { setState({ busy: false, err: 'Please add your name, phone number and a short message.', done: false }); return }
    setState({ busy: true, err: '', done: false })
    try {
      await api.public.post(`/public/store/${slug}/enquiries`, { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() || null, eventDate: f.eventDate || null, guests: f.guests ? Number(f.guests) : null, message: f.message.trim() })
      setState({ busy: false, err: '', done: true })
    } catch (x) { setState({ busy: false, err: x.message || 'Could not send your enquiry. Try again.', done: false }) }
  }
  return (
    <>
      <div className="page-head"><div className="wrap"><nav className="crumbs" aria-label="Breadcrumb"><Link to={base}>Home</Link><span>/</span><span>Enquire</span></nav><span className="eyebrow">Catering</span><h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)' }}>Plan your event with {info.name}</h1></div></div>
      <div className="wrap" style={{ padding: '36px 16px 72px' }}>
        {state.done ? (
          <div className="empty"><h2>Thank you, we have your enquiry</h2><p>{info.name} will get back to you{info.phone ? ` (you can also call ${info.phone})` : ''}.</p><Link className="btn" to={base}>Back to home</Link></div>
        ) : (
          <form className="form" onSubmit={submit} noValidate style={{ maxWidth: 680 }}>
            <p className="muted">Tell us about your event and what you need. This is an enquiry, not an order; the business replies with availability and a price.</p>
            <div className="grid-2">
              <label className="field">Your name<input className="input" value={f.name} onChange={set('name')} autoComplete="name" required /></label>
              <label className="field">Phone number<input className="input" type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" required /></label>
            </div>
            <label className="field">Email (optional)<input className="input" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
            <div className="grid-2">
              <label className="field">Event date (optional)<input className="input" type="date" value={f.eventDate} onChange={set('eventDate')} min={new Date().toISOString().slice(0, 10)} /></label>
              <label className="field">Number of guests (optional)<input className="input" inputMode="numeric" value={f.guests} onChange={(e) => setF({ ...f, guests: e.target.value.replace(/\D/g, '') })} /></label>
            </div>
            <label className="field">What do you need?<textarea className="textarea" maxLength={1500} value={f.message} onChange={set('message')} required /></label>
            {state.err && <div className="alert" role="alert">{state.err}</div>}
            <button className="btn primary" disabled={state.busy}>{state.busy ? 'Sending…' : 'Send enquiry'}</button>
          </form>
        )}
      </div>
    </>
  )
}
