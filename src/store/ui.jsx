import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus } from 'lucide-react'
import { money, qtyText } from '../lib/format.js'
import { discountLabel, maxQty } from './presentation.js'
import { useStore } from './StoreContext.jsx'

/** Product photo with a graceful fallback (a monogram tile) when there is no image or it fails to load. */
export function Img({ src, name, className = '', eager = false }) {
  const [bad, setBad] = useState(false)
  if (!src || bad) return <div className={`ph ${className}`} aria-hidden="true">{(name || '?').trim().slice(0, 1).toUpperCase()}</div>
  return <img src={src} alt={name || ''} className={className} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setBad(true)} />
}

/** Price with the original price struck through when the server reports a sale. */
export function Price({ p, big = false }) {
  return (
    <span className={`price ${big ? 'big' : ''}`}>
      {priceText(p)}
      {p.onSale && <><s className="was" aria-label="Original price">{money(p.compareAt)}</s><span className="off">{discountLabel(p.minPrice, p.compareAt)}</span></>}
    </span>
  )
}

export const priceText = (p) => (p.single || p.minPrice === p.maxPrice ? money(p.minPrice) : `From ${money(p.minPrice)}`)

export function Qty({ value, onChange, item, min = 1 }) {
  const cap = maxQty(item)
  return (
    <div className="qty" role="group" aria-label="Quantity">
      <button type="button" aria-label="Decrease quantity" onClick={() => onChange(value - 1)}><Minus size={16} /></button>
      <output aria-live="polite">{qtyText(value)}</output>
      <button type="button" aria-label="Increase quantity" disabled={value >= cap} onClick={() => onChange(value + 1)}><Plus size={16} /></button>
    </div>
  )
}

/** Read-only star rating from real approved reviews. */
export function Stars({ value, count }) {
  const n = Math.round(Number(value) || 0)
  return <span className="stars" role="img" aria-label={`${Number(value).toFixed(1)} out of 5 from ${count} review${count === 1 ? '' : 's'}`}><span aria-hidden="true">{'★'.repeat(n)}<i>{'★'.repeat(5 - n)}</i></span><small>({count})</small></span>
}

export function Skeletons({ n = 8 }) {
  return <div className="grid" aria-busy="true" aria-label="Loading products">{Array.from({ length: n }, (_, i) => <div key={i} className="card"><div className="skel skel-card" /><div className="skel" style={{ height: 14, width: '70%' }} /><div className="skel" style={{ height: 14, width: '35%' }} /></div>)}</div>
}

export function Empty({ title, children, action }) {
  return <div className="empty"><h2>{title}</h2>{children && <p>{children}</p>}{action}</div>
}

/** Grid card. A single-variant product can be added straight from the card; a product with options leads to its page. */
export function ProductCard({ p }) {
  const { base, add, pres } = useStore()
  const to = `${base}/product/${p.id}`
  const one = p.single && p.inStock && !p.hasOptions ? p.variants[0] : null
  return (
    <article className={`card ${p.inStock ? '' : 'out'}`}>
      <Link to={to} className="card-img" aria-label={p.name}>
        <Img src={p.imageUrl} name={p.name} />
        {!p.inStock && <span className="tag">Sold out</span>}
        {one && <div className="quick"><button type="button" className="btn primary block sm" onClick={(e) => { e.preventDefault(); add(one, 1) }}>{pres.add}</button></div>}
      </Link>
      <div className="card-body">
        {p.categoryName && <span className="card-cat">{p.categoryName}</span>}
        <Link to={to} className="card-name">{p.name}</Link>
        {p.ratingCount > 0 && <Stars value={p.ratingAvg} count={p.ratingCount} />}
        <Price p={p} />
      </div>
    </article>
  )
}

/** List row for menu-style stores (food and catering). */
export function MenuRow({ p }) {
  const { base, add, pres, cart, setQty } = useStore()
  const to = `${base}/product/${p.id}`
  const one = p.single && !p.hasOptions ? p.variants[0] : null
  const q = one ? Number(cart[one.variantId]) || 0 : 0
  const showImg = !!p.imageUrl
  return (
    <div className={`menu-row ${showImg ? 'with-img' : ''}`}>
      {showImg && <Link to={to} className="menu-thumb" aria-hidden="true" tabIndex={-1}><Img src={p.imageUrl} name={p.name} /></Link>}
      <div className="menu-info">
        <Link to={to}><b>{p.name}</b></Link>
        {p.description && <p>{p.description}</p>}
        <Price p={p} />
      </div>
      <div className="menu-act">
        {!p.inStock ? <span className="pill">Sold out</span>
          : one ? (q > 0 ? <Qty value={q} onChange={(n) => setQty(one.variantId, n)} item={one} /> : <button type="button" className="btn sm" onClick={() => add(one, 1)}>{pres.add}</button>)
            : <Link to={to} className="btn sm">Choose</Link>}
      </div>
    </div>
  )
}
