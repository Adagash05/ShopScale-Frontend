import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { dateTime, money } from '../lib/format.js'
import { readOrders } from './presentation.js'
import { useStore } from './StoreContext.jsx'
import { usePageTitle } from './StoreLayout.jsx'
import { OrderLookup, ReviewForm } from './Engage.jsx'
import { Empty } from './ui.jsx'

export const STEPS = { PENDING_PAYMENT: 'Waiting for payment', NEW: 'Order received', CONFIRMED: 'Confirmed', READY: 'Ready', COMPLETED: 'Completed', CANCELLED: 'Cancelled' }
const tone = (o) => (o.status === 'CANCELLED' ? 'bad' : o.paymentStatus === 'PAID' || o.status !== 'PENDING_PAYMENT' ? 'ok' : 'warn')

/** Orders placed from this device. There are no customer accounts, so the list is the order links this browser kept; each is read live from the server. */
export function MyOrders() {
  const { slug, info, base, pres } = useStore()
  usePageTitle(`My orders | ${info.name}`)
  const [rows, setRows] = useState(null)
  useEffect(() => {
    let live = true
    const saved = readOrders(localStorage, slug)
    Promise.all(saved.map((s) => api.public.get(`/public/orders/${s.token}`).then((o) => o, () => null))).then((r) => { if (live) setRows(r.filter(Boolean)) })
    return () => { live = false }
  }, [slug])
  return (
    <div className="wrap" style={{ paddingBottom: 72 }}>
      <div style={{ padding: '28px 0 20px', display: 'grid', gap: 8 }}><h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>My orders</h1><p className="muted">Orders you placed on this device with {info.name}.</p></div>
      {!rows && <div className="skel" style={{ height: 80 }} aria-busy="true" />}
      {rows?.length === 0 && <Empty title="No orders on this device yet" action={<Link className="btn primary" to={`${base}/shop`}>{pres.cta}</Link>}>Orders you place here will be listed for easy access. If you ordered on another device, use the link you were given after ordering.</Empty>}
      <div style={{ display: 'grid', gap: 12 }}>
        {rows?.map((o) => (
          <Link key={o.token} to={`${base}/order/${o.token}`} className="order-card">
            <div><b>Order #{o.number}</b><div className="muted small">{dateTime(o.createdAt)} · {o.items.length} item{o.items.length === 1 ? '' : 's'}</div></div>
            <div style={{ textAlign: 'right' }}><div className="price">{money(o.total)}</div><span className={`pill ${tone(o)}`}>{STEPS[o.status] || o.status}</span></div>
          </Link>
        ))}
      </div>
      <OrderLookup />
    </div>
  )
}

export function OrderStatus() {
  const { token } = useParams()
  const { info, base, pres } = useStore()
  usePageTitle(`Your order | ${info.name}`)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    let live = true
    let tries = 0
    async function go() {
      try {
        // Asks the server to confirm the payment with Paystack; this page never decides on its own that an order is paid.
        const o = await api.public.post(`/public/orders/${token}/verify`)
        if (!live) return
        setOrder(o); setError(null)
        if (o.status === 'PENDING_PAYMENT' && tries++ < 5) setTimeout(go, 4000)
      } catch (e) { if (live) setError(e) }
    }
    go()
    return () => { live = false }
  }, [token])
  return (
    <div className="wrap" style={{ paddingBottom: 72 }}>
      {error && !order && <Empty title="We could not find this order" action={<Link className="btn" to={`${base}/shop`}>Back to {pres.shop.toLowerCase()}</Link>}>{error.message || 'Check the link and try again.'}</Empty>}
      {!order && !error && <div className="skel" style={{ height: 240, marginTop: 40 }} aria-busy="true" />}
      {order && (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 0', display: 'grid', gap: 22 }}>
          <div style={{ display: 'grid', gap: 10 }}>
            <span className="eyebrow">Order #{order.number}</span>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>{order.status === 'CANCELLED' ? 'This order was cancelled' : order.status === 'PENDING_PAYMENT' ? 'Waiting for your payment' : 'Thank you, your order is in'}</h1>
            <p><span className={`pill ${tone(order)}`}>{STEPS[order.status] || order.status}</span></p>
          </div>
          {order.status === 'PENDING_PAYMENT' && <div className="note">We have not received your payment yet. If you have paid, this page updates in a moment.</div>}
          {order.paymentStatus === 'PAID' && <div className="note">Payment received. Thank you.</div>}
          {order.paymentMode === 'PAY_LATER' && order.status !== 'CANCELLED' && <div className="note">Pay on {order.deliveryMethod === 'DELIVERY' ? 'delivery' : 'pickup'}: <b>{money(order.total)}</b></div>}
          <div className="summary">
            {order.items.map((i) => <div className="row" key={i.variantId}><span>{i.name} × {Number(i.quantity)}</span><span className="num">{money(i.lineTotal)}</span></div>)}
            {Number(order.deliveryFee) > 0 && <div className="row"><span>Delivery</span><span className="num">{money(order.deliveryFee)}</span></div>}
            <div className="row total"><span>Total</span><span className="num">{money(order.total)}</span></div>
          </div>
          {order.status === 'COMPLETED' && (
            <section className="review-box" aria-labelledby="rv-t">
              <h2 id="rv-t">How was it?</h2>
              <p className="muted small">Reviews are shown on the product page after {info.name} approves them.</p>
              {order.items.map((i) => <div className="review-item" key={i.variantId}><span>{i.name}</span><ReviewForm token={token} item={i} /></div>)}
            </section>
          )}
          <p className="muted small">Placed {dateTime(order.createdAt)} · {order.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'}{info.phone ? ` · Questions? Call ${info.phone}` : ''}</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><Link to={`${base}/shop`} className="btn">Keep shopping</Link><Link to={`${base}/orders`} className="btn">My orders</Link></div>
        </div>
      )}
    </div>
  )
}
