import { NavLink, Outlet } from 'react-router-dom'
import TopBar from './TopBar.jsx'
import { InstallBanner, UpdateBanner } from '../pwa/InstallPrompt.jsx'
import { Home, ShoppingCart, Package, Users, Menu } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'
import { moduleNav, allowed } from '../modules/registry.js'

const ITEMS = [
  { to: '/dashboard', label: 'Home', icon: Home, needs: 'DASHBOARD_VIEW' },
  { to: '/sell', label: 'Sell', icon: ShoppingCart, needs: 'SALES_CREATE' },
  { to: '/products', label: 'Products', icon: Package, needs: 'PRODUCTS_VIEW' },
  { to: '/customers', label: 'Customers', icon: Users, needs: 'CUSTOMERS_VIEW' },
  { to: '/more', label: 'More', icon: Menu, needs: null },
]

export function visibleNav(can, ctx) {
  const base = ITEMS.filter((i) => !i.needs || can(i.needs))
  if (!ctx) return base
  const bar = moduleNav('bar').filter((n) => allowed(n, ctx)).map((n) => ({ to: n.to, label: n.label, icon: n.icon }))
  const more = base.pop()
  return [...base, ...bar, more]
}

function Links({ items }) {
  return items.map(({ to, label, icon: Icon }) => (
    <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
      <Icon size={22} aria-hidden="true" /><span>{label}</span>
    </NavLink>
  ))
}

export default function Layout() {
  const { business, can, hasFeature, hasWorkflow } = useAuth()
  const items = visibleNav(can, { can, hasFeature, hasWorkflow })
  return (
    <div className="shell">
      <aside className="side" aria-label="Main">
        <div className="brand"><img className="brand-logo" src="/brand/logo-96.png" alt="" width="29" height="32" />ShopScale</div>
        <Links items={items} />
        <div className="side-foot">{business?.name}<br />{window.location.host}/s/{business?.slug}</div>
      </aside>
      <main className="main"><TopBar /><UpdateBanner /><InstallBanner /><Outlet /></main>
      <nav className="bottom-nav" aria-label="Main" style={{ '--n': items.length }}><Links items={items} /></nav>
    </div>
  )
}
