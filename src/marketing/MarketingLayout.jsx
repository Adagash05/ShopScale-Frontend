import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { SmartLink as Link } from '../lib/SmartLink.jsx'
import { ChevronRight, Menu, X } from 'lucide-react'
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '../help/support.js'
import { V1_SCOPE } from '../config/scope.js'
import './site.css'

const NAV = [['/features', 'Features'], ['/how-it-works', 'How it works'], ['/pricing', 'Pricing'], ['/industries', 'Who it is for'], ['/help', 'Help Centre']]

export default function MarketingLayout({ children }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [pathname])
  useEffect(() => {   // the open menu locks page scroll and closes on Escape
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open])
  return (
    <div className="mk">
      <a className="mkx-skip" href="#main">Skip to content</a>
      <header className="mkx-head">
        <div className="mkx-bar">
          <Link to="/" className="mkx-brand"><img className="brand-logo" src="/brand/logo-96.png" alt="" width="29" height="32" />ShopScale</Link>
          <nav className="mkx-nav" aria-label="Main">
            {NAV.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>)}
          </nav>
          <div className="mkx-actions">
            <Link to="/login" className="mkx-btn mkx-signin">Log in</Link>
            <Link to="/register" className="mkx-btn primary">Start free</Link>
            <button type="button" className="mkx-burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mkx-drawer" onClick={() => setOpen((o) => !o)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </div>
        {open && (
          <nav id="mkx-drawer" className="mkx-drawer" aria-label="Menu">
            {NAV.map(([to, label]) => <Link key={to} to={to} className="row-link">{label}<ChevronRight size={18} aria-hidden="true" /></Link>)}
            <Link to="/faq" className="row-link">FAQ<ChevronRight size={18} aria-hidden="true" /></Link>
            <Link to="/login" className="mkx-btn">Log in</Link>
            <Link to="/register" className="mkx-btn primary">Start free</Link>
          </nav>
        )}
      </header>
      <main id="main" style={{ flex: 1 }}>{children ?? <Outlet />}</main>
      <footer className="mkx-foot">
        <div className="mkx-wrap">
          <div className="mkx-foot-grid">
            <div>
              <div className="mkx-foot-brand"><img className="brand-logo" src="/brand/logo-96.png" alt="" width="29" height="32" />ShopScale</div>
              <p style={{ marginTop: 14, maxWidth: '36ch', lineHeight: 1.6 }}>Sales, stock, customers, expenses and online orders in one simple platform, built for Nigerian businesses.</p>
              <p style={{ marginTop: 14 }}><Link to="/register" className="mkx-btn primary" style={{ minHeight: 44, padding: '0 20px' }}>Start free</Link></p>
            </div>
            <div><h3>Product</h3><ul><li><Link to="/features">Features</Link></li><li><Link to="/how-it-works">How it works</Link></li><li><Link to="/pricing">Pricing</Link></li><li><Link to="/faq">FAQ</Link></li><li><Link to="/partners">Partner programme</Link></li></ul></div>
            <div><h3>Who it is for</h3><ul><li><Link to="/retail">Shops and retail</Link></li><li><Link to="/wholesale">Trading and wholesale</Link></li><li><Link to="/online-selling">Online selling</Link></li>{!V1_SCOPE && <li><Link to="/restaurant">Restaurants</Link></li>}{!V1_SCOPE && <li><Link to="/catering">Catering</Link></li>}</ul></div>
            <div><h3>Support</h3><ul><li><Link to="/help">Help Centre</Link></li><li><Link to="/contact">Contact</Link></li><li><a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a></li></ul></div>
            <div><h3>Company</h3><ul><li><Link to="/about">About</Link></li><li><Link to="/privacy">Privacy</Link></li><li><Link to="/terms">Terms</Link></li><li><Link to="/refunds">Refunds</Link></li><li><Link to="/login">Log in</Link></li></ul></div>
          </div>
          <div className="mkx-foot-base"><span>© {new Date().getFullYear()} ShopScale. All rights reserved.</span><span>Made for Nigerian businesses</span></div>
        </div>
      </footer>
    </div>
  )
}
