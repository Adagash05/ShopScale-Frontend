import { Link } from 'react-router-dom'
import { money } from '../lib/format.js'
import { useStore } from './StoreContext.jsx'
import { usePageTitle } from './StoreLayout.jsx'
import { Empty, Img, Qty } from './ui.jsx'

export function Steps({ at }) {
  const s = ['Cart', 'Details & payment', 'Confirmation']
  return <div className="stepper" aria-label="Checkout progress">{s.map((x, i) => <span key={x} style={{ display: 'contents' }}>{i > 0 && <i />}{i === at ? <b aria-current="step">{i + 1}. {x}</b> : <span>{i + 1}. {x}</span>}</span>)}</div>
}

export default function StoreCart() {
  const { info, base, pres, lines, count, subtotal, setQty, removed, dismissRemoved, itemsLoading, itemsError, reload } = useStore()
  usePageTitle(`Cart | ${info.name}`)
  const fee = Number(info.deliveryFee || 0)
  return (
    <div className="wrap">
      <div style={{ padding: '28px 0 0', display: 'grid', gap: 14 }}>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>Your cart</h1>
        <Steps at={0} />
      </div>
      {removed > 0 && <div className="note" style={{ marginTop: 18 }} role="status">{removed === 1 ? 'An item in your cart is' : `${removed} items in your cart are`} no longer available and {removed === 1 ? 'was' : 'were'} removed. <button className="remove" onClick={dismissRemoved}>Dismiss</button></div>}
      {itemsError && <Empty title="We could not load your cart" action={<button className="btn" onClick={reload}>Try again</button>}>Check your connection and try again.</Empty>}
      {itemsLoading && <div style={{ padding: '40px 0' }} className="skel" aria-busy="true" />}
      {!itemsLoading && !itemsError && lines.length === 0 && <Empty title="Your cart is empty" action={<Link className="btn primary" to={`${base}/shop`}>{pres.cta}</Link>}>Add {pres.layout === 'menu' ? 'something from the menu' : 'a product'} and it will appear here.</Empty>}
      {lines.length > 0 && (
        <div className="split">
          <div>
            {lines.map((l) => (
              <div className="line" key={l.id}>
                <Link to={`${base}/product/${l.item.productId}`} className="line-img"><Img src={l.item.imageUrl} name={l.item.name} /></Link>
                <div className="line-main">
                  <div className="line-top">
                    <div><Link to={`${base}/product/${l.item.productId}`} style={{ fontWeight: 600 }}>{l.item.name}</Link>{l.item.label && <div className="muted small">{l.item.label}</div>}{l.options.length > 0 && <div className="muted small">+ {l.options.map((o) => o.name).join(', ')}</div>}<div className="muted small">{money(l.unit)} each</div></div>
                    <span className="price">{money(l.qty * l.unit)}</span>
                  </div>
                  <div className="line-bottom">
                    <Qty value={l.qty} onChange={(n) => setQty(l.id, n)} item={l.item} />
                    <button className="remove" onClick={() => setQty(l.id, 0)} aria-label={`Remove ${l.item.name}`}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
            <p style={{ marginTop: 22 }}><Link to={`${base}/shop`} className="link">Continue shopping</Link></p>
          </div>
          <aside className="summary sticky" aria-label="Order summary">
            <h3>Order summary</h3>
            <div className="row"><span>Subtotal ({count} item{count === 1 ? '' : 's'})</span><span className="num">{money(subtotal)}</span></div>
            <div className="row muted small"><span>Delivery</span><span>{info.delivery ? (fee > 0 ? `${money(fee)} if delivered` : 'Free') : 'Pickup only'}</span></div>
            <div className="row total"><span>Total</span><span className="num">{money(subtotal)}</span></div>
            {info.delivery && fee > 0 && <p className="hint">The delivery fee is added at checkout when you choose delivery.</p>}
            <Link to={`${base}/checkout`} className="btn primary block">Checkout</Link>
            <p className="hint">The business confirms the final price and availability when it receives your order.</p>
          </aside>
        </div>
      )}
    </div>
  )
}
