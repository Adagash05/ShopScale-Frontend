import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { money, qtyText } from '../lib/format.js'
import { api } from '../lib/api'
import { useLoad } from '../components.jsx'
import { discountLabel, optionsError, optionsExtra, whatsappLink } from './presentation.js'
import { useStore } from './StoreContext.jsx'
import { usePageTitle } from './StoreLayout.jsx'
import { Empty, Img, ProductCard, Stars } from './ui.jsx'

export default function StoreProduct() {
  const { productId } = useParams()
  const { slug, info, base, pres, products, itemsLoading, itemsError, add, reload } = useStore()
  const nav = useNavigate()
  const p = products.find((x) => x.id === productId)
  const firstAvail = p?.variants.find((v) => v.inStock) || p?.variants[0]
  const [vid, setVid] = useState(null)
  const [qty, setQty] = useState(1)
  const [img, setImg] = useState(0)
  const [chosen, setChosen] = useState([])
  const [optErr, setOptErr] = useState('')
  const reviews = useLoad(() => api.public.get(`/public/store/${slug}/reviews?productId=${productId}`), [slug, productId])
  useEffect(() => { setVid(null); setQty(1); setImg(0); setChosen([]); setOptErr('') }, [productId])
  usePageTitle(p ? `${p.name} | ${info.name}` : info.name)

  if (itemsLoading) return <div className="wrap"><div className="pdp"><div className="skel pdp-img" /><div className="pdp-info"><div className="skel" style={{ height: 36, width: '70%' }} /><div className="skel" style={{ height: 24, width: '30%' }} /></div></div></div>
  if (itemsError) return <div className="wrap"><Empty title="We could not load this product" action={<button className="btn" onClick={reload}>Try again</button>}>Check your connection and try again.</Empty></div>
  if (!p) return <div className="wrap"><Empty title="Product not found" action={<Link className="btn" to={`${base}/shop`}>Back to {pres.shop.toLowerCase()}</Link>}>It may have been removed or is no longer available.</Empty></div>

  const v = p.variants.find((x) => x.variantId === vid) || firstAvail
  const avail = Number(v.available)
  const stockState = !v.inStock ? 'out' : avail > 0 && avail <= 5 && !v.allowDecimal ? 'low' : 'ok'
  const stockText = stockState === 'out' ? 'Sold out' : stockState === 'low' ? `Only ${qtyText(avail)} left` : avail > 0 ? 'In stock' : 'Available to order'
  const related = products.filter((x) => x.id !== p.id && x.inStock && (p.categoryId ? x.categoryId === p.categoryId : true)).slice(0, 4)
  const more = related.length ? related : products.filter((x) => x.id !== p.id && x.inStock).slice(0, 4)
  const wa = whatsappLink(info, `Hello ${info.name}, I have a question about ${p.name}.`)
  const extra = optionsExtra(p.optionGroups, chosen)
  const was = Number(v.compareAtPrice) > Number(v.price) ? Number(v.compareAtPrice) : null
  const gallery = p.images.length ? p.images : [null]
  const toggle = (g, o) => {
    setOptErr('')
    setChosen((c) => {
      if (c.includes(o.id)) return c.filter((x) => x !== o.id)
      const inGroup = g.options.filter((x) => c.includes(x.id))
      // a single-choice group swaps its choice; a multi-choice group stops at its limit
      if (g.maxSelect === 1) return [...c.filter((x) => !inGroup.some((y) => y.id === x)), o.id]
      return inGroup.length >= g.maxSelect ? c : [...c, o.id]
    })
  }
  const addNow = (go) => {
    const err = optionsError(p.optionGroups, chosen)
    if (err) { setOptErr(err); return }
    add(v, qty, chosen)
    if (go) nav(`${base}/cart`)
  }
  const cap = v.allowDecimal ? Infinity : (Math.floor(avail) > 0 ? Math.floor(avail) : Infinity)

  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Breadcrumb" style={{ marginTop: 20 }}>
        <Link to={base}>Home</Link><span>/</span><Link to={`${base}/shop`}>{pres.shop}</Link>
        {p.categoryName && <><span>/</span><Link to={`${base}/shop?category=${p.categoryId}`}>{p.categoryName}</Link></>}
        <span>/</span><span>{p.name}</span>
      </nav>
      <div className="pdp">
        <div className="pdp-media">
          <div className="pdp-img"><Img src={gallery[Math.min(img, gallery.length - 1)]} name={p.name} eager /></div>
          {gallery.length > 1 && (
            <div className="thumbs" role="group" aria-label="Product photos">
              {gallery.map((g, i) => <button key={g} type="button" className={i === img ? 'on' : ''} aria-label={`Photo ${i + 1} of ${gallery.length}`} aria-pressed={i === img} onClick={() => setImg(i)}><Img src={g} name="" /></button>)}
            </div>
          )}
        </div>
        <div className="pdp-info">
          <div style={{ display: 'grid', gap: 10 }}>
            {p.categoryName && <span className="eyebrow">{p.categoryName}</span>}
            <h1 style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.5rem)' }}>{p.name}</h1>
            {p.ratingCount > 0 && <a href="#reviews" style={{ justifySelf: 'start' }}><Stars value={p.ratingAvg} count={p.ratingCount} /></a>}
            <span className="price big">{money(Number(v.price) + extra)}{was && <><s className="was" aria-label="Original price">{money(was + extra)}</s><span className="off">{discountLabel(v.price, was)}</span></>}</span>
            <span className={`stock ${stockState}`}>{stockText}</span>
          </div>

          {p.variants.length > 1 && (
            <div style={{ display: 'grid', gap: 10 }}>
              <span className="small" style={{ fontWeight: 600 }}>Option: <span className="muted" style={{ fontWeight: 400 }}>{v.label}</span></span>
              <div className="options" role="radiogroup" aria-label="Options">
                {p.variants.map((o) => <button key={o.variantId} type="button" role="radio" aria-checked={o.variantId === v.variantId} className={`opt ${o.variantId === v.variantId ? 'on' : ''}`} disabled={!o.inStock} onClick={() => { setVid(o.variantId); setQty(1) }}>{o.label || 'Standard'}</button>)}
              </div>
            </div>
          )}

          {v.inStock && p.optionGroups.map((g) => (
            <fieldset key={g.id} className="opt-group">
              <legend>{g.name} <span className="muted small">{g.required ? '(required)' : '(optional)'}{g.maxSelect > 1 ? `, up to ${g.maxSelect}` : ''}</span></legend>
              {g.options.map((o) => (
                <label key={o.id} className="opt-row">
                  <input type={g.maxSelect === 1 ? 'radio' : 'checkbox'} name={`g-${g.id}`} checked={chosen.includes(o.id)} onChange={() => toggle(g, o)} onClick={() => { if (g.maxSelect === 1 && chosen.includes(o.id) && !g.required) toggle(g, o) }} />
                  <span>{o.name}</span>{Number(o.priceDelta) > 0 && <b>+{money(o.priceDelta)}</b>}
                </label>
              ))}
            </fieldset>
          ))}
          {optErr && <div className="alert" role="alert">{optErr}</div>}

          {v.inStock ? (
            <div className="buy">
              <div className="qty" role="group" aria-label="Quantity">
                <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(qty - 1)}>−</button>
                <output>{qtyText(qty)}</output>
                <button type="button" aria-label="Increase quantity" disabled={qty >= cap} onClick={() => setQty(qty + 1)}>+</button>
              </div>
              <button type="button" className="btn primary" onClick={() => addNow(false)}>{pres.add}</button>
              <button type="button" className="btn alt" onClick={() => addNow(true)}>{pres.layout === 'menu' ? 'Order now' : 'Buy now'}</button>
            </div>
          ) : <div className="note">This item is sold out right now.{wa ? ' Ask the business when it will be back.' : ''}</div>}

          <div className="facts">
            {p.description && <details open><summary>Description</summary><div><p style={{ whiteSpace: 'pre-line' }}>{p.description}</p></div></details>}
            {p.specs.length > 0 && <details open><summary>Specifications</summary><div><dl className="specs">{p.specs.map(([k, val]) => <div key={k}><dt>{k}</dt><dd>{val}</dd></div>)}</dl></div></details>}
            <details open={!p.description && !p.specs.length}>
              <summary>Delivery &amp; payment</summary>
              <div>
                {info.delivery && <p><b>Delivery.</b> {Number(info.deliveryFee) > 0 ? `Delivery fee ${money(info.deliveryFee)}. ` : ''}{info.deliveryNote || ''}</p>}
                {info.pickup && <p><b>Pickup.</b> Collect your order from {info.name}.</p>}
                <p><b>Payment.</b> {[info.payOnline && 'Pay online by card or bank transfer (Paystack)', info.payLater && `Pay on ${info.delivery && !info.pickup ? 'delivery' : 'pickup'}`].filter(Boolean).join(' or ') || 'Confirm payment with the business.'}</p>
                <p>The business confirms final price and availability when it receives your order.</p>
              </div>
            </details>
            <details><summary>Questions about this item</summary><div><p>Ask {info.name} before you order.</p>{wa && <a className="btn sm" href={wa} target="_blank" rel="noopener noreferrer">Message on WhatsApp</a>}{info.phone && <p>Or call {info.phone}.</p>}</div></details>
          </div>
        </div>
      </div>
      <section id="reviews" className="reviews" aria-labelledby="rv-h">
        <div className="sec-head"><div><span className="eyebrow">Customer reviews</span><h2 id="rv-h">{reviews.data?.length ? `What customers say (${reviews.data.length})` : 'Reviews'}</h2></div></div>
        {reviews.data?.length ? (
          <ul className="review-list">{reviews.data.map((r) => <li key={r.id}><Stars value={r.rating} count={1} /><p>{r.body}</p><small>{r.author} · {new Date(r.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</small></li>)}</ul>
        ) : <p className="muted">{reviews.error ? 'Reviews could not be loaded.' : 'No reviews yet. Customers who have received this item can review it from their order page.'}</p>}
      </section>
      {more.length > 0 && (
        <section style={{ paddingBottom: 72 }}>
          <div className="sec-head"><div><span className="eyebrow">Keep browsing</span><h2>{related.length ? 'You may also like' : 'More to explore'}</h2></div></div>
          <div className="grid">{more.map((x) => <ProductCard key={x.id} p={x} />)}</div>
        </section>
      )}
    </div>
  )
}
