import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { SmartLink as Link } from '../lib/SmartLink.jsx'
import { Menu, X } from 'lucide-react'
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '../help/support.js'
import { V1_SCOPE } from '../config/scope.js'

const NAV = [
  ['/features', 'Features'], ['/retail', 'Shops'], ...(V1_SCOPE ? [] : [['/restaurant', 'Restaurants'], ['/catering', 'Catering']]),
  ['/pricing', 'Pricing'], ['/how-it-works', 'How it works'], ['/help', 'Help'],
]

export default function MarketingLayout({ children }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [pathname])
  return (
    <div className="mk">
      <header className="mk-head">
        <div className="mk-bar">
          <Link to="/" className="brand" style={{ padding: 0 }}><img className="brand-logo" src="/brand/logo-96.png" alt="" width="29" height="32" />ShopScale</Link>
          <nav className="mk-nav" aria-label="Main">
            {NAV.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>)}
          </nav>
          <div className="mk-actions">
            <Link to="/login" className="btn sm">Sign in</Link>
            <Link to="/register" className="btn sm primary">Start free trial</Link>
            <button className="icon-btn mk-menu-btn" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        {open && <nav className="mk-drawer" aria-label="Menu">{NAV.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}<Link to="/faq">FAQ</Link><Link to="/about">About</Link><Link to="/contact">Contact</Link></nav>}
      </header>
      <main style={{ flex: 1 }}>{children ?? <Outlet />}</main>
      <footer className="mk-foot">
        <div className="mk-wrap mk-foot-grid">
          <div><div className="brand" style={{ padding: 0, color: '#fff' }}><img className="brand-logo" src="/brand/logo-96.png" alt="" width="29" height="32" />ShopScale</div>
            <p style={{ marginTop: 10, maxWidth: '36ch' }}>Run your business. Control your stock. Manage your orders. Understand your money.</p>
          </div>
          <div><h3>Product</h3><ul><li><Link to="/features">Features</Link></li><li><Link to="/pricing">Pricing</Link></li><li><Link to="/how-it-works">How it works</Link></li><li><Link to="/faq">FAQ</Link></li><li><Link to="/partners">Partner programme</Link></li></ul></div>
          <div><h3>For</h3><ul><li><Link to="/retail">Shops and retail</Link></li>{!V1_SCOPE && <li><Link to="/restaurant">Restaurants</Link></li>}{!V1_SCOPE && <li><Link to="/catering">Catering</Link></li>}</ul></div>
          <div><h3>Company</h3><ul><li><Link to="/help">Help Centre</Link></li><li><Link to="/about">About</Link></li><li><Link to="/contact">Contact</Link></li><li><a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a></li><li><Link to="/privacy">Privacy</Link></li><li><Link to="/terms">Terms</Link></li><li><Link to="/refunds">Refunds</Link></li></ul></div>
        </div>
        <div className="mk-wrap" style={{ marginTop: 28 }}>© {new Date().getFullYear()} ShopScale. All rights reserved.</div>
      </footer>
    </div>
  )
}
