import { Link } from 'react-router-dom'
import { Receipt, Wallet, Boxes, CreditCard, Settings, LogOut, ChevronRight, UsersRound, LifeBuoy, Repeat, Truck } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { useLoad, useToast } from '../components.jsx'
import { moduleNav, allowed } from '../modules/registry.js'

export default function More() {
  const { user, business, roleName, logout, can, canAny, switchBusiness, hasFeature, hasWorkflow } = useAuth()
  const toast = useToast()
  const businesses = useLoad(() => api.get('/auth/businesses'), [])
  const items = [
    canAny('SALES_VIEW', 'SALES_HISTORY_VIEW') && { to: '/more/sales', icon: Receipt, label: 'Sales', hint: 'See recorded sales' },
    can('EXPENSES_VIEW') && { to: '/expenses', icon: Wallet, label: 'Expenses', hint: 'Money your business spent' },
    canAny('STOCK_VIEW', 'STOCK_MOVEMENTS_VIEW') && { to: '/more/stock', icon: Boxes, label: 'Stock', hint: 'Running low and stock history' },
    canAny('SUPPLIERS_VIEW', 'PURCHASES_VIEW', 'PURCHASES_CREATE') && { to: '/suppliers', icon: Truck, label: 'Suppliers and purchases', hint: 'Receive stock and track what you owe' },
    can('TEAM_VIEW') && { to: '/more/team', icon: UsersRound, label: 'Team', hint: 'Staff, roles and permissions' },
    can('SUBSCRIPTION_VIEW') && { to: '/more/plan', icon: CreditCard, label: 'Plan and billing', hint: 'Your free trial and plans' },
    can('SETTINGS_VIEW') && { to: '/more/settings', icon: Settings, label: 'Business settings', hint: 'Name, contact and store address' },
    { to: '/more/help', icon: LifeBuoy, label: 'Help', hint: 'Guides for getting things done' },
  ].filter(Boolean)
  const extra = moduleNav('more').filter((n) => allowed(n, { can, hasFeature, hasWorkflow }))
    .map((n) => ({ to: n.to, icon: n.icon, label: n.label, hint: n.hint }))
  items.splice(items.length - 1, 0, ...extra)
  const others = (businesses.data || []).filter((b) => b.id !== business?.id)

  async function swap(id) {
    try { await switchBusiness(id) } catch (e) { toast(e.message, 'error') }
  }

  return (
    <div className="stack">
      <div className="page-head"><div><h1>More</h1><p className="sub">{business?.name} · {roleName} · {user?.email}</p></div></div>
      <div className="section list">
        {items.map(({ to, icon: Icon, label, hint }) => (
          <Link key={to} to={to} className="list-item">
            <Icon size={22} aria-hidden="true" style={{ color: 'var(--blue)' }} />
            <div className="grow"><div className="title">{label}</div><div className="meta">{hint}</div></div>
            <ChevronRight size={18} className="chev" />
          </Link>
        ))}
      </div>
      {others.length > 0 && (
        <div className="section list">
          <div className="section-title"><h2>Switch business</h2></div>
          {others.map((b) => (
            <button key={b.id} className="list-item" onClick={() => swap(b.id)}>
              <Repeat size={20} aria-hidden="true" style={{ color: 'var(--blue)' }} />
              <div className="grow"><div className="title">{b.name}</div><div className="meta">{b.roleName}</div></div>
            </button>
          ))}
        </div>
      )}
      <div className="section list">
        <button className="list-item" onClick={logout}><LogOut size={22} aria-hidden="true" style={{ color: 'var(--danger)' }} /><div className="grow title">Sign out</div></button>
      </div>
    </div>
  )
}
