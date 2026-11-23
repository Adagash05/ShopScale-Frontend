import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { storeUrl } from '../config/env.js'
import TopBar from './TopBar.jsx'
import { InstallBanner, UpdateBanner } from '../pwa/InstallPrompt.jsx'
import AnnouncementBanner from '../widgets/AnnouncementBanner.jsx'
import { Home, ShoppingCart, Package, Users, Menu, Wallet, Store, BarChart3, Settings } from 'lucide-react'
import { V1_SCOPE } from '../config/scope.js'
import { SECTIONS, v1Nav, sectionFor, sectionTabs } from '../config/sections.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { moduleNav, allowed } from '../modules/registry.js'

const ITEMS = [
  { to: '/dashboard', label: 'Home', icon: Home, needs: 'DASHBOARD_VIEW' },
  { to: '/sell', label: 'Sell', icon: ShoppingCart, needs: 'SALES_CREATE' },
  { to: '/products', label: 'Products', icon: Package, needs: 'PRODUCTS_VIEW' },
  { to: '/customers', label: 'Customers', icon: Users, needs: 'CUSTOMERS_VIEW' },
  { to: '/more', label: 'More', icon: Menu, needs: null },
]

const ICONS = { Home, ShoppingCart, Package, Wallet, Users, Store, BarChart3, Settings }

/** V1 menu: the eight sections. On a phone the first four sit in the bottom bar and the rest are under More; desktop lists all. */
export function v1Items(ctx) {
  return v1Nav(ctx).map((n) => ({ to: n.to, label: n.label, icon: ICONS[n.icon] || Menu, id: n.id }))
}

export function visibleNav(can, ctx) {
  if (V1_SCOPE) {
    const items = v1Items({ can, hasFeature: ctx?.hasFeature || (() => true) })
    return [...items.slice(0, 4), { to: '/more', label: 'More', icon: Menu, id: 'more' }]
  }
  const base = ITEMS.filter((i) => !i.needs || can(i.needs))
  if (!ctx) return base
  const bar = moduleNav('bar').filter((n) => allowed(n, ctx)).map((n) => ({ to: n.to, label: n.label, icon: n.icon }))
  const more = base.pop()
  return [...base, ...bar, more]
}

function Links({ items, current }) {
  return items.map(({ to, label, icon: Icon, id }) => (
    <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${(id ? current === id : isActive) ? 'active' : ''}`}>
      <Icon size={22} aria-hidden="true" /><span>{label}</span>
    </NavLink>
  ))
}

/** Related screens of the current section, so every section is one tap away from its other screens. Shown only when there is a choice. */
function SectionTabs({ section, ctx, path }) {
  const tabs = sectionTabs(section, ctx)
  if (tabs.length < 2) return null
  const active = [...tabs].sort((a, b) => b.to.length - a.to.length).find((t) => path === t.to || path.startsWith(t.to + '/'))
  return (
    <nav className="section-tabs" aria-label={section.label}>
      {tabs.map((t) => <NavLink key={t.to} to={t.to} end className={`section-tab ${active && active.to === t.to ? 'active' : ''}`}>{t.label}</NavLink>)}
    </nav>
  )
}

export default function Layout() {
  const { business, can, hasFeature, hasWorkflow } = useAuth()
  const { pathname } = useLocation()
  const ctx = { can, hasFeature, hasWorkflow }
  if (!V1_SCOPE) {
    const items = visibleNav(can, ctx)
    return (
      <div className="shell">
        <aside className="side" aria-label="Main">
          <div className="brand"><img className="brand-logo" src="/brand/logo-96.png" alt="" width="29" height="32" />ShopScale</div>
          <Links items={items} />
          <div className="side-foot">{business?.name}<br />{storeUrl(business?.slug || '').replace(/^https?:\/\//, '')}</div>
        </aside>
        <main className="main"><TopBar /><UpdateBanner /><InstallBanner /><AnnouncementBanner /><Outlet /></main>
        <nav className="bottom-nav" aria-label="Main" style={{ '--n': items.length }}><Links items={items} /></nav>
      </div>
    )
  }
  const all = v1Items({ can, hasFeature })
  const section = sectionFor(pathname)
  const current = pathname.startsWith('/more') && !section ? 'more' : section?.id
  const phone = [...all.slice(0, 4), { to: '/more', label: 'More', icon: Menu, id: 'more' }]
  // A section that lives under "More" on a phone still highlights "More" there.
  const phoneCurrent = all.slice(0, 4).some((i) => i.id === current) ? current : (current ? 'more' : undefined)
  return (
    <div className="shell">
      <aside className="side" aria-label="Main">
        <div className="brand"><img className="brand-logo" src="/brand/logo-96.png" alt="" width="29" height="32" />ShopScale</div>
        <Links items={all} current={current} />
        <div className="side-foot">{business?.name}<br />{storeUrl(business?.slug || '').replace(/^https?:\/\//, '')}</div>
      </aside>
      <main className="main">
        <TopBar /><UpdateBanner /><InstallBanner /><AnnouncementBanner />
        {section && <SectionTabs section={section} ctx={{ can, hasFeature }} path={pathname} />}
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Main" style={{ '--n': phone.length }}><Links items={phone} current={phoneCurrent} /></nav>
    </div>
  )
}
