import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { money } from '../lib/format.js'
import { sortProducts, trustPoints, whatsappLink, contactLines } from './presentation.js'
import { useStore } from './StoreContext.jsx'
import { usePageTitle } from './StoreLayout.jsx'
import { Testimonials } from './Engage.jsx'
import { Empty, Img, MenuRow, ProductCard, Skeletons, priceText } from './ui.jsx'

export default function StoreHome() {
  const { info, base, pres, products, categories, itemsLoading, itemsError, reload } = useStore()
  usePageTitle(info.title || info.name)
  const featured = sortProducts(products, 'featured')
  const hero = featured.find((p) => p.imageUrl && p.inStock) || featured.find((p) => p.imageUrl)
  const latest = products.length >= 5 ? sortProducts(products, 'new').filter((p) => p.inStock).slice(0, 8) : featured.slice(0, 8)
  const menuLayout = pres.layout === 'menu'
  const wa = whatsappLink(info, `Hello ${info.name}, I have a question.`)
  const trust = trustPoints(info)
  const hasContact = contactLines(info).length > 0
  const delivers = [info.delivery && 'delivery', info.pickup && 'pickup'].filter(Boolean).join(' or ')

  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-copy">
            <span className="eyebrow">{pres.eyebrow}</span>
            <h1>{info.title || info.name}</h1>
            <p className="lead">{pres.lead}{delivers ? ` Available for ${delivers}.` : ''}</p>
            <div className="hero-cta">
              <Link to={`${base}/shop`} className="btn primary">{pres.cta}</Link>
              {wa ? <a href={wa} className="btn" target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> Chat on WhatsApp</a> : info.description ? <Link to={`${base}/about`} className="btn">Our story</Link> : null}
            </div>
          </div>
          {hero ? (
            <Link to={`${base}/product/${hero.id}`} className="hero-art" aria-label={`View ${hero.name}`}>
              <Img src={hero.imageUrl} name={hero.name} eager />
              <div className="caption"><span>{hero.name}</span><span className="num">{priceText(hero)}</span></div>
            </Link>
          ) : <div className="hero-art mono-art" aria-hidden="true"><span>{(info.name || '?').slice(0, 1).toUpperCase()}</span></div>}
        </div>
      </section>

      {trust.length > 0 && <div className="trust" style={{ '--n': trust.length }}>{trust.map(([h, t]) => <div key={h}><b>{h}</b><span>{t}</span></div>)}</div>}

      {itemsError && <section className="section"><div className="wrap"><Empty title="We could not load the catalogue" action={<button className="btn" onClick={reload}>Try again</button>}>Check your connection and try again.</Empty></div></section>}

      {categories.length >= 2 && (
        <section className="section tight">
          <div className="wrap">
            <div className="sec-head"><div><span className="eyebrow">Browse</span><h2>{menuLayout ? 'Menu sections' : 'Shop by category'}</h2></div></div>
            <div className="cats">
              {categories.slice(0, 8).map((c) => (
                <Link key={c.id} to={`${base}/shop?category=${c.id}`} className="cat">
                  {c.imageUrl && <Img src={c.imageUrl} name={c.name} />}
                  <span className="cat-label"><b>{c.name}</b><span>{c.count} {c.count === 1 ? 'item' : 'items'}</span></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="eyebrow">{menuLayout ? pres.shop : products.length >= 5 ? 'Just in' : 'Our range'}</span><h2>{menuLayout ? `From the ${pres.shop.toLowerCase()}` : products.length >= 5 ? 'New arrivals' : 'Our products'}</h2></div>
            {products.length > 0 && <Link to={`${base}/shop`} className="link">{pres.all}</Link>}
          </div>
          {itemsLoading && <Skeletons n={4} />}
          {!itemsLoading && !itemsError && products.length === 0 && <Empty title="Nothing to show yet">This store has not added any {pres.shop === 'Menu' ? 'menu items' : 'products'} yet. Please check back soon.</Empty>}
          {menuLayout ? <div>{latest.map((p) => <MenuRow key={p.id} p={p} />)}</div> : <div className="grid">{latest.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
        </div>
      </section>

      <Testimonials />

      {info.description && (
        <section className="section alt">
          <div className="wrap" style={{ maxWidth: 820 }}>
            <span className="eyebrow">About us</span>
            <h2 style={{ margin: '10px 0 18px' }}>{info.name}</h2>
            <p style={{ fontSize: '1.08rem', color: '#343a41', whiteSpace: 'pre-line' }}>{info.description.length > 420 ? `${info.description.slice(0, 417)}…` : info.description}</p>
            <p style={{ marginTop: 20 }}><Link to={`${base}/about`} className="link">More about {info.name}</Link></p>
          </div>
        </section>
      )}

      {hasContact && (
        <section className="band">
          <div className="wrap band-in">
            <div><h2>Have a question?</h2><p style={{ opacity: .85, marginTop: 8 }}>Talk to {info.name} directly. We are happy to help before you order.</p></div>
            <Link to={`${base}/contact`} className="btn">Contact us</Link>
          </div>
        </section>
      )}
    </>
  )
}
