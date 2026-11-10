import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Search } from 'lucide-react'
import { api } from '../../lib/api'
import { money, dateTime } from '../../lib/format.js'
import { Empty, ErrorBox, Field, ListSkeleton, Modal, useLoad } from '../../components.jsx'

const cartKey = (slug) => `shopscale.cart.${slug}`
function readCart(slug) { try { return JSON.parse(localStorage.getItem(cartKey(slug))) || {} } catch { return {} } }
function writeCart(slug, c) { try { localStorage.setItem(cartKey(slug), JSON.stringify(c)) } catch { /* private mode */ } }

export function StoreShell({ info, children, right }) {
  return (
    <div className="shop">
      <header className="shop-head">
        <div className="shop-wrap row between">
          <div>
            <h1 className="shop-title">{info?.title || 'Online store'}</h1>
            {info?.description && <p className="muted small">{info.description}</p>}
          </div>
          {right}
        </div>
      </header>
      <main className="shop-wrap">{children}</main>
      <footer className="shop-wrap muted small shop-foot">Powered by ShopScale</footer>
    </div>
  )
}

export default function Storefront({ slugOverride }) {
  const params = useParams()
  const slug = slugOverride || params.slug
  const info = useLoad(() => api.public.get(`/public/store/${slug}`), [slug])
  const [q, setQ] = useState('')
  const items = useLoad(() => api.public.get(`/public/store/${slug}/products`, { q }), [slug, q])
  const [cart, setCart] = useState(() => readCart(slug))
  const [open, setOpen] = useState(false)
  useEffect(() => writeCart(slug, cart), [slug, cart])

  const byId = useMemo(() => Object.fromEntries((items.data || []).map((i) => [i.variantId, i])), [items.data])
  const lines = Object.entries(cart).map(([id, qty]) => ({ id, qty, item: byId[id] })).filter((l) => l.item)
  const count = lines.reduce((n, l) => n + l.qty, 0)
  const subtotal = lines.reduce((n, l) => n + l.qty * Number(l.item.price), 0)
  const setQty = (id, qty, item) => setCart((c) => {
    const n = { ...c }
    const max = item.allowDecimal ? Infinity : Math.floor(item.available || 0)
    const next = Math.min(qty, max > 0 ? max : qty)
    if (next <= 0) delete n[id]; else n[id] = next
    return n
  })

  if (info.error) return <StoreShell><div className="pad"><Empty title="This store is not open right now">Please check the link or try again later.</Empty></div></StoreShell>
  if (!info.data) return <StoreShell><ListSkeleton /></StoreShell>

  return (
    <StoreShell info={info.data} right={<button className="btn primary" onClick={() => setOpen(true)} disabled={!count}><ShoppingBag size={18} /> Cart ({count})</button>}>
      <div className="row" style={{ margin: '12px 0' }}>
        <div className="grow" style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 15, color: 'var(--muted)' }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        </div>
      </div>
      <ErrorBox error={items.error} onRetry={items.reload} />
      {items.loading && !items.data && <ListSkeleton />}
      {items.data?.length === 0 && <Empty title="No products found" />}
      <div className="shop-grid">
        {items.data?.map((i) => (
          <div key={i.variantId} className="shop-card">
            {i.imageUrl ? <img src={i.imageUrl} alt="" loading="lazy" className="shop-img" /> : <div className="shop-img ph" aria-hidden="true">{i.name.slice(0, 1)}</div>}
            <div className="shop-body">
              <div className="title">{i.name}{i.label ? ` - ${i.label}` : ''}</div>
              <div className="num">{money(i.price)}</div>
              {!i.inStock ? <span className="badge gray">Sold out</span> : cart[i.variantId]
                ? <div className="row"><button className="btn sm" aria-label="Remove one" onClick={() => setQty(i.variantId, cart[i.variantId] - 1, i)}><Minus size={16} /></button><b>{cart[i.variantId]}</b><button className="btn sm" aria-label="Add one" onClick={() => setQty(i.variantId, cart[i.variantId] + 1, i)}><Plus size={16} /></button></div>
                : <button className="btn sm block" onClick={() => setQty(i.variantId, 1, i)}>Add to cart</button>}
            </div>
          </div>
        ))}
      </div>
      {count > 0 && <div className="shop-bar"><button className="btn primary block" onClick={() => setOpen(true)}>View cart - {count} item{count === 1 ? '' : 's'} - {money(subtotal)}</button></div>}
      {open && <Checkout slug={slug} info={info.data} lines={lines} subtotal={subtotal} setQty={setQty} onClose={() => setOpen(false)} onPlaced={() => { setCart({}); writeCart(slug, {}) }} />}
    </StoreShell>
  )
}

function Checkout({ slug, info, lines, subtotal, setQty, onClose, onPlaced }) {
  const [f, setF] = useState({ customerName: '', phone: '', email: '', address: '', note: '', deliveryMethod: info.pickup ? 'PICKUP' : 'DELIVERY', paymentMode: info.payOnline ? 'ONLINE' : 'PAY_LATER' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const fee = f.deliveryMethod === 'DELIVERY' ? Number(info.deliveryFee || 0) : 0
  async function submit(e) {
    e.preventDefault()
    if (!f.customerName.trim() || !f.phone.trim()) { setErr('Enter your name and phone number'); return }
    if (f.deliveryMethod === 'DELIVERY' && !f.address.trim()) { setErr('Enter your delivery address'); return }
    if (f.paymentMode === 'ONLINE' && !f.email.trim()) { setErr('Enter your email to pay online'); return }
    setBusy(true); setErr('')
    try {
      const r = await api.public.post(`/public/store/${slug}/orders`, { ...f, email: f.email || null, address: f.address || null, note: f.note || null, items: lines.map((l) => ({ variantId: l.id, quantity: l.qty })) })
      onPlaced()
      window.location.assign(r.authorizationUrl || `/s/${slug}/order/${r.token}`)
    } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  return (
    <Modal title="Your order" onClose={onClose}>
      <form className="stack" onSubmit={submit} noValidate>
        <div className="list">
          {lines.map((l) => (
            <div key={l.id} className="list-item"><div className="grow"><div className="title">{l.item.name}{l.item.label ? ` - ${l.item.label}` : ''}</div><div className="meta">{money(l.item.price)} each</div></div>
              <div className="row"><button type="button" className="btn sm" aria-label="Remove one" onClick={() => setQty(l.id, l.qty - 1, l.item)}><Minus size={14} /></button><b>{l.qty}</b><button type="button" className="btn sm" aria-label="Add one" onClick={() => setQty(l.id, l.qty + 1, l.item)}><Plus size={14} /></button></div></div>
          ))}
        </div>
        <Field label="Your name" htmlFor="cn"><input id="cn" className="input" value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })} autoComplete="name" /></Field>
        <Field label="Phone number" htmlFor="cp"><input id="cp" className="input" type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" /></Field>
        <Field label={f.paymentMode === 'ONLINE' ? 'Email (for your payment receipt)' : 'Email (optional)'} htmlFor="ce"><input id="ce" className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></Field>
        {info.pickup && info.delivery && (
          <div className="seg" role="group" aria-label="Pickup or delivery">
            <button type="button" className={`chip ${f.deliveryMethod === 'PICKUP' ? 'on' : ''}`} onClick={() => setF({ ...f, deliveryMethod: 'PICKUP' })}>Pickup</button>
            <button type="button" className={`chip ${f.deliveryMethod === 'DELIVERY' ? 'on' : ''}`} onClick={() => setF({ ...f, deliveryMethod: 'DELIVERY' })}>Delivery</button>
          </div>
        )}
        {f.deliveryMethod === 'DELIVERY' && <Field label="Delivery address" htmlFor="ca" hint={info.deliveryNote}><textarea id="ca" className="textarea" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>}
        <Field label="Note (optional)" htmlFor="cno"><input id="cno" className="input" value={f.note} maxLength={300} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
        {info.payOnline && info.payLater && (
          <div className="seg" role="group" aria-label="How to pay">
            <button type="button" className={`chip ${f.paymentMode === 'ONLINE' ? 'on' : ''}`} onClick={() => setF({ ...f, paymentMode: 'ONLINE' })}>Pay now (card or transfer)</button>
            <button type="button" className={`chip ${f.paymentMode === 'PAY_LATER' ? 'on' : ''}`} onClick={() => setF({ ...f, paymentMode: 'PAY_LATER' })}>Pay on {f.deliveryMethod === 'DELIVERY' ? 'delivery' : 'pickup'}</button>
          </div>
        )}
        <div className="kv"><span className="k">Items</span><span className="v num">{money(subtotal)}</span></div>
        {fee > 0 && <div className="kv"><span className="k">Delivery</span><span className="v num">{money(fee)}</span></div>}
        <div className="kv"><span className="k"><b>Total</b></span><span className="v num"><b>{money(subtotal + fee)}</b></span></div>
        {err && <div className="banner danger" role="alert">{err}</div>}
        <button className="btn primary block" disabled={busy || !lines.length}>{busy ? 'Please wait…' : f.paymentMode === 'ONLINE' ? 'Continue to payment' : 'Place order'}</button>
        <p className="muted small">The store confirms the final price and availability when it receives your order.</p>
      </form>
    </Modal>
  )
}

const STEPS = { PENDING_PAYMENT: 'Waiting for payment', NEW: 'Order received', CONFIRMED: 'Confirmed', READY: 'Ready', COMPLETED: 'Completed', CANCELLED: 'Cancelled' }

export function OrderStatus() {
  const { slug, token } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const info = useLoad(() => api.public.get(`/public/store/${slug}`).catch(() => null), [slug])
  useEffect(() => {
    let live = true
    let tries = 0
    async function go() {
      try {
        // Asks the server to confirm the payment with Paystack; the page itself never decides an order is paid.
        const o = await api.public.post(`/public/orders/${token}/verify`)
        if (!live) return
        setOrder(o)
        if (o.status === 'PENDING_PAYMENT' && tries++ < 5) setTimeout(go, 4000)
      } catch (e) { if (live) setError(e) }
    }
    go()
    return () => { live = false }
  }, [token])
  return (
    <StoreShell info={info.data} right={<Link className="btn" to={`/s/${slug}`}>Back to store</Link>}>
      <ErrorBox error={error} />
      {!order && !error && <ListSkeleton />}
      {order && (
        <div className="stack" style={{ marginTop: 16 }}>
          <section className="section pad">
            <h2>Order #{order.number}</h2>
            <p><span className={`badge ${order.status === 'CANCELLED' ? 'danger' : order.paymentStatus === 'PAID' || order.status !== 'PENDING_PAYMENT' ? 'ok' : 'warn'}`}>{STEPS[order.status] || order.status}</span></p>
            {order.status === 'PENDING_PAYMENT' && <p className="muted">We have not received your payment yet. If you have paid, this page will update in a moment.</p>}
            {order.paymentStatus === 'PAID' && <p>Payment received. Thank you.</p>}
            {order.paymentMode === 'PAY_LATER' && order.status !== 'CANCELLED' && <p>Pay on {order.deliveryMethod === 'DELIVERY' ? 'delivery' : 'pickup'}: <b>{money(order.total)}</b></p>}
            <p className="muted small">Placed {dateTime(order.createdAt)} - {order.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'}</p>
            {info.data?.phone && <p className="small">Questions? Call {info.data.phone}</p>}
          </section>
          <section className="section">
            {order.items.map((i) => <div key={i.variantId} className="list-item"><div className="grow">{i.name} x {i.quantity}</div><div className="num">{money(i.lineTotal)}</div></div>)}
            {Number(order.deliveryFee) > 0 && <div className="list-item"><div className="grow">Delivery</div><div className="num">{money(order.deliveryFee)}</div></div>}
            <div className="list-item"><div className="grow"><b>Total</b></div><div className="num"><b>{money(order.total)}</b></div></div>
          </section>
        </div>
      )}
    </StoreShell>
  )
}
