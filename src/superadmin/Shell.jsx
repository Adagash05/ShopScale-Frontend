import { useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ErrorBox, Skeleton } from '../components.jsx'
import { useAdmin } from './AdminAuth.jsx'
import { Account } from './Account.jsx'
import './superadmin.css'

export const NAV = [
  ['/super-admin/dashboard', 'Overview'], ['/super-admin/businesses', 'Businesses'], ['/super-admin/users', 'Users'], ['/super-admin/partners', 'Partners'],
  ['/super-admin/subscriptions', 'Subscriptions'], ['/super-admin/transactions', 'Transactions'], ['/super-admin/support', 'Support'], ['/super-admin/announcements', 'Announcements'],
  ['/super-admin/audit-logs', 'Audit Logs'], ['/super-admin/storage', 'Storage'], ['/super-admin/settings', 'Platform Settings'], ['/super-admin/account', 'My Account'],
]

/** Guard and frame for every console page. The server checks the role on every call; this only decides what to show. */
export default function AdminShell() {
  const admin = useAdmin()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  if (admin.status === 'loading') return <div className="sa-splash"><Skeleton height={28} width="40%" /><Skeleton height={120} /></div>
  if (admin.status === 'out') return <Navigate to="/super-admin/login" replace state={{ from: location.pathname }} />
  if (admin.status === 'error') return <div className="sa-splash"><ErrorBox error={admin.error} onRetry={admin.reload} /></div>
  // A forced password change blocks everything else until it is done.
  if (admin.me.mustChangePassword) return <div className="sa-splash"><Account forced /></div>
  return (
    <div className="sa-shell">
      <aside className={`sa-side ${open ? 'open' : ''}`} aria-label="Super Admin navigation">
        <div className="sa-brand">ShopScale <span>Admin</span></div>
        <nav>{NAV.map(([to, label]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>)}</nav>
        <button className="sa-logout" onClick={admin.logout}>Logout</button>
      </aside>
      <div className="sa-body">
        <header className="sa-top"><button className="btn sm sa-menu" onClick={() => setOpen((o) => !o)} aria-expanded={open}>Menu</button><span className="small muted">Signed in as {admin.me.email}</span></header>
        <main className="sa-main"><Outlet /></main>
      </div>
    </div>
  )
}
