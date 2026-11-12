import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { money } from '../lib/format.js'
import { rememberOrder } from './presentation.js'
import { useStore } from './StoreContext.jsx'
import { usePageTitle } from './StoreLayout.jsx'
import { Empty, Img } from './ui.jsx'
import { Steps } from './StoreCart.jsx'

export default function StoreCheckout() {
  const { slug, info, base, pres, lines, subtotal, count, clear, itemsLoading } = useStore()
  const nav = useNavigate()
  usePageTitle(`Checkout | ${info.name}`)
  const [f, setF] = useState({ customerName: '', phone: '', email: '', address: '', note: '', deliveryMethod: info.pickup ? 'PICKUP' : 'DELIVERY', paymentMode: info.payOnline ? 'ONLINE' : 'PAY_LATER' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const fee = f.deliveryMethod === 'DELIVERY' ? Number(info.deliveryFee || 0) : 0
  const lateWord = f.deliveryMethod === 'DELIVERY' ? 'delivery' : 'pickup'

  async function submit(e) {
    e.preventDefault()
    if (!f.customerName.trim() || !f.phone.trim()) { setErr('Enter your name and phone number'); return }
    if (f.deliveryMethod === 'DELIVERY' && !f.address.trim()) { setErr('Enter your delivery address'); return }
    if (f.paymentMode === 'ONLINE' && !f.email.trim()) { setErr('Enter your email to pay online'); return }
    setBusy(true); setErr('')
    try {
      const r = await api.public.post(`/public/store/${slug}/orders`, { ...f, email: f.email || null, address: f.deliveryMethod === 'DELIVERY' ? (f.address || null) : null, note: f.note || null, items: lines.map((l) => ({ variantId: l.item.variantId, quantity: l.qty, options: l.optionIds })) })
      rememberOrder(localStorage, slug, r.token)
      clear()
      if (r.authorizationUrl) window.location.assign(r.authorizationUrl)
      else nav(`${base}/order/${r.token}`)
    } catch (e2) { setErr(e2.message); setBusy(false) }
  }

  if (itemsLoading) return <div className="wrap"><div className="skel" style={{ height: 300, marginTop: 40 }} aria-busy="true" /></div>
  if (!lines.length) return <div className="wrap"><Empty title="Your cart is empty" action={<Link className="btn primary" to={`${base}/shop`}>{pres.cta}</Link>}>Add something first, then come back to check out.</Empty></div>

  return (
    <div className="wrap">
      <div style={{ padding: '28px 0 0', display: 'grid', gap: 14 }}>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>Checkout</h1>
        <Steps at={1} />
      </div>
      <form className="split" onSubmit={submit} noValidate>
        <div className="form">
          <fieldset>
            <legend>Your details</legend>
            <div className="grid-2">
              <label className="field">Full name<input className="input" value={f.customerName} onChange={set('customerName')} autoComplete="name" required /></label>
              <label className="field">Phone number<input className="input" type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" required /></label>
            </div>
            <label className="field">{f.paymentMode === 'ONLINE' ? 'Email (for your payment receipt)' : 'Email (optional)'}<input className="input" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
          </fieldset>

          {info.pickup && info.delivery && (
            <fieldset className="choice">
              <legend>How would you like to get it?</legend>
              <label><input type="radio" name="dm" checked={f.deliveryMethod === 'PICKUP'} onChange={() => setF({ ...f, deliveryMethod: 'PICKUP' })} /><div><b>Pickup</b><span>Collect from {info.name}{info.address ? `, ${info.address}` : ''}</span></div></label>
              <label><input type="radio" name="dm" checked={f.deliveryMethod === 'DELIVERY'} onChange={() => setF({ ...f, deliveryMethod: 'DELIVERY' })} /><div><b>Delivery{Number(info.deliveryFee) > 0 ? ` · ${money(info.deliveryFee)}` : ''}</b><span>{info.deliveryNote || 'Delivered to your address'}</span></div></label>
            </fieldset>
          )}
          {f.deliveryMethod === 'DELIVERY' && <label className="field">Delivery address<textarea className="textarea" value={f.address} onChange={set('address')} autoComplete="street-address" />{info.deliveryNote && <span className="hint">{info.deliveryNote}</span>}</label>}
          <label className="field">Note for the business (optional)<input className="input" value={f.note} maxLength={300} onChange={set('note')} /></label>

          {info.payOnline && info.payLater && (
            <fieldset className="choice">
              <legend>Payment</legend>
              <label><input type="radio" name="pm" checked={f.paymentMode === 'ONLINE'} onChange={() => setF({ ...f, paymentMode: 'ONLINE' })} /><div><b>Pay now</b><span>Card or bank transfer, securely through Paystack</span></div></label>
              <label><input type="radio" name="pm" checked={f.paymentMode === 'PAY_LATER'} onChange={() => setF({ ...f, paymentMode: 'PAY_LATER' })} /><div><b>Pay on {lateWord}</b><span>Pay {f.deliveryMethod === 'DELIVERY' ? 'when it arrives' : 'when you collect'}</span></div></label>
            </fieldset>
          )}
          {err && <div className="alert" role="alert">{err}</div>}
          <button className="btn primary block" disabled={busy}>{busy ? 'Please wait…' : f.paymentMode === 'ONLINE' ? 'Continue to payment' : 'Place order'}</button>
          <p className="hint">By ordering you agree to the <Link to={`${base}/terms`} className="link">terms</Link> and acknowledge the <Link to={`${base}/privacy`} className="link">privacy policy</Link>.</p>
        </div>

        <aside className="summary sticky" aria-label="Order summary">
          <h3>Your order</h3>
          {lines.map((l) => <div className="sumline" key={l.id}><div className="line-img"><Img src={l.item.imageUrl} name={l.item.name} /></div><div><div>{l.item.name}</div><div className="muted small">{l.item.label ? `${l.item.label} · ` : ''}{l.options.length ? `${l.options.map((o) => o.name).join(', ')} · ` : ''}Qty {l.qty}</div></div><span className="num">{money(l.qty * l.unit)}</span></div>)}
          <div className="row" style={{ paddingTop: 8, borderTop: '1px solid var(--line)' }}><span>Subtotal ({count})</span><span className="num">{money(subtotal)}</span></div>
          {f.deliveryMethod === 'DELIVERY' && <div className="row"><span>Delivery</span><span className="num">{fee > 0 ? money(fee) : 'Free'}</span></div>}
          <div className="row total"><span>Total</span><span className="num">{money(subtotal + fee)}</span></div>
          <Link to={`${base}/cart`} className="link small">Edit cart</Link>
          <p className="hint">The business confirms the final price and availability when it receives your order.</p>
        </aside>
      </form>
    </div>
  )
}
