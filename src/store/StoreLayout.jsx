import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Mail, MapPin, MessageCircle, Package, Phone, Search, ShoppingBag, Menu as MenuIcon, X } from 'lucide-react'
import { money } from '../lib/format.js'
import { SmartLink } from '../lib/SmartLink.jsx'
import { announcement, contactLines, hoursLines, socialLinks } from './presentation.js'
import { Newsletter } from './Engage.jsx'
import { useStore } from './StoreContext.jsx'
import { Empty } from './ui.jsx'
import './storefront.css'

const ICON = { phone: Phone, whatsapp: MessageCircle, email: Mail, address: MapPin }
const initial = (s) => (s || '?').trim().slice(0, 1).toUpperCase()

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export function usePageTitle(t) {
  useEffect(() => { if (t) document.title = t }, [t])
}

function Brand({ info, base }) {
  const [bad, setBad] = useState(false)
  return <Link to={base} className="brand" aria-label={`${info.name} home`}>{info.logoUrl && !bad ? <img className="brand-logo" src={info.logoUrl} alt="" onError={() => setBad(true)} /> : <span className="mono" aria-hidden="true">{initial(info.name)}</span>}<span className="brand-name">{info.name}</span></Link>
}

function Header({ onMenu }) {
  const { info, base, count, categories } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const go = (e) => { e.preventDefault(); nav(`${base}/shop${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`) }
  const bar = announcement(info)
  return (
    <>
      {bar && <div className="announce" role="note">{bar}</div>}
      <header className="head">
        <div className="wrap head-in">
          <div className="only-mobile"><button className="icon-btn" aria-label="Open menu" onClick={onMenu}><MenuIcon size={22} /></button></div>
          <div className="brand-col"><Brand info={info} base={base} /></div>
          <nav className="nav" aria-label="Main">
            <NavLink to={base} end>Home</NavLink>
            <NavLink to={`${base}/shop`}>Shop</NavLink>
            {info.businessType === 'CATERING' && <NavLink to={`${base}/enquiry`}>Enquire</NavLink>}
            <NavLink to={`${base}/about`}>About</NavLink>
            <NavLink to={`${base}/contact`}>Contact</NavLink>
          </nav>
          <div className="head-actions">
            <form className="head-search" onSubmit={go} role="search"><Search size={16} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search products" /></form>
            <Link to={`${base}/orders`} className="icon-btn" aria-label="My orders" title="My orders"><Package size={21} /></Link>
            <Link to={`${base}/cart`} className="icon-btn" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}><ShoppingBag size={21} />{count > 0 && <span className="badge-count">{count}</span>}</Link>
          </div>
        </div>
      </header>
    </>
  )
}

function Drawer({ onClose }) {
  const { info, base, categories, pres } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); document.body.style.overflow = 'hidden'; return () => { document.removeEventListener('keydown', k); document.body.style.overflow = '' } }, [onClose])
  const go = (e) => { e.preventDefault(); nav(`${base}/shop${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); onClose() }
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="drawer-head"><Brand info={info} base={base} /><button className="icon-btn" aria-label="Close menu" onClick={onClose}><X size={22} /></button></div>
        <div className="drawer-body">
          <form onSubmit={go} role="search" className="search-box"><Search size={16} aria-hidden="true" /><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${pres.shop.toLowerCase()}`} aria-label="Search" /></form>
          <nav onClick={onClose} aria-label="Menu">
            <Link to={base}>Home</Link>
            <Link to={`${base}/shop`}>{pres.all}</Link>
            {categories.length > 0 && <div className="sub">{categories.map((c) => <Link key={c.id} to={`${base}/shop?category=${c.id}`}>{c.name}</Link>)}</div>}
            {info.businessType === 'CATERING' && <Link to={`${base}/enquiry`}>Enquire</Link>}
            <Link to={`${base}/about`}>About</Link>
            <Link to={`${base}/contact`}>Contact</Link>
            <Link to={`${base}/orders`}>My orders</Link>
            <Link to={`${base}/faq`}>FAQ</Link>
          </nav>
        </div>
      </aside>
    </>
  )
}

function Footer() {
  const { info, base, categories, pres } = useStore()
  const contacts = contactLines(info)
  const social = socialLinks(info)
  const hours = hoursLines(info)
  const year = new Date().getFullYear()
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Brand info={info} base={base} />
            {info.description ? <p>{info.description.length > 200 ? `${info.description.slice(0, 197)}…` : info.description}</p> : <p>{pres.lead}</p>}
            {social.length > 0 && <ul className="social" aria-label="Social media">{social.map((s) => <li key={s.label}><a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a></li>)}</ul>}
            <Newsletter />
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link to={base}>Home</Link></li>
              <li><Link to={`${base}/shop`}>{pres.all}</Link></li>
              {categories.slice(0, 4).map((c) => <li key={c.id}><Link to={`${base}/shop?category=${c.id}`}>{c.name}</Link></li>)}
              {info.businessType === 'CATERING' && <li><Link to={`${base}/enquiry`}>Enquire about an event</Link></li>}
              <li><Link to={`${base}/about`}>About us</Link></li>
              <li><Link to={`${base}/contact`}>Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4>Customer support</h4>
            <ul>
              <li><Link to={`${base}/faq`}>FAQ</Link></li>
              <li><Link to={`${base}/shipping`}>Shipping &amp; delivery</Link></li>
              <li><Link to={`${base}/returns`}>Returns &amp; refunds</Link></li>
              <li><Link to={`${base}/orders`}>My orders</Link></li>
              <li><Link to={`${base}/privacy`}>Privacy policy</Link></li>
              <li><Link to={`${base}/terms`}>Terms &amp; conditions</Link></li>
            </ul>
          </div>
          <div>
            <h4>Get in touch</h4>
            {contacts.length ? (
              <ul className="contact">
                {contacts.map((c) => { const I = ICON[c.kind]; return <li key={c.kind}><I size={16} aria-hidden="true" />{c.href ? <a href={c.href} {...(c.kind === 'whatsapp' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{c.label}</a> : <span>{c.label}</span>}</li> })}
              </ul>
            ) : <p style={{ fontSize: '.92rem', color: '#9aa1a9' }}>This business has not added contact details yet.</p>}
            {hours.length > 0 && <div className="hours"><h5>Opening hours</h5>{hours.map((h) => <div key={h}>{h}</div>)}</div>}
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {year} {info.name}. All rights reserved.</span>
          <span>Online store powered by <SmartLink to="/" className="foot-link">ShopScale</SmartLink></span>
        </div>
      </div>
    </footer>
  )
}

function Toast() {
  const { toast, base } = useStore()
  if (!toast) return null
  return <div className="toast" role="status"><span>{toast.text}</span><Link to={`${base}/cart`}>View cart</Link></div>
}

function CartBar() {
  const { count, subtotal, base } = useStore()
  const { pathname } = useLocation()
  if (!count || /\/(cart|checkout|order)/.test(pathname)) return null
  return <div className="cartbar"><Link className="btn primary block" to={`${base}/cart`}>View cart · {count} item{count === 1 ? '' : 's'} · {money(subtotal)}</Link></div>
}

export default function StoreLayout() {
  const { info, infoError, infoLoading, reload, base } = useStore()
  const [menu, setMenu] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setMenu(false), [pathname])
  if (infoError) {
    return <div className="sf"><main id="main"><Empty title="This store is not open right now" action={<button className="btn" onClick={reload}>Try again</button>}>Please check the link, or try again later.</Empty></main></div>
  }
  if (infoLoading) return <div className="sf" aria-busy="true"><div className="wrap" style={{ padding: '120px 16px' }}><div className="skel" style={{ height: 24, width: 200 }} /></div></div>
  return (
    <div className="sf">
      <a className="skip" href="#main">Skip to content</a>
      <ScrollTop />
      <Header onMenu={() => setMenu(true)} />
      {menu && <Drawer onClose={() => setMenu(false)} />}
      <main id="main" className="pad-cartbar"><Outlet /></main>
      <Footer />
      <CartBar />
      <Toast />
    </div>
  )
}
