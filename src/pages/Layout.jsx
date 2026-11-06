import { NavLink, Outlet } from 'react-router-dom'
import { Home, ShoppingCart, Package, Users, Menu } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'

const ITEMS = [
  { to: '/dashboard', label: 'Home', icon: Home, needs: 'DASHBOARD_VIEW' },
  { to: '/sell', label: 'Sell', icon: ShoppingCart, needs: 'SALES_CREATE' },
  { to: '/products', label: 'Products', icon: Package, needs: 'PRODUCTS_VIEW' },
  { to: '/customers', label: 'Customers', icon: Users, needs: 'CUSTOMERS_VIEW' },
  { to: '/more', label: 'More', icon: Menu, needs: null },
]

export function visibleNav(can) {
  return ITEMS.filter((i) => !i.needs || can(i.needs))
}

function Links({ items }) {
  return items.map(({ to, label, icon: Icon }) => (
    <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
      <Icon size={22} aria-hidden="true" /><span>{label}</span>
    </NavLink>
  ))
}

export default function Layout() {
  const { business, can } = useAuth()
  const items = visibleNav(can)
  return (
    <div className="shell">
      <aside className="side" aria-label="Main">
        <div className="brand"><span className="brand-mark">S</span>ShopScale</div>
        <Links items={items} />
        <div className="side-foot">{business?.name}<br />shop.amsati.com/{business?.slug}</div>
      </aside>
      <main className="main"><Outlet /></main>
      <nav className="bottom-nav" aria-label="Main" style={{ '--n': items.length }}><Links items={items} /></nav>
    </div>
  )
}
