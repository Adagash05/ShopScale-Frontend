import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { ErrorBox, useLoad } from '../components.jsx'
import { SmartLink as Link } from '../lib/SmartLink.jsx'
import { Splash, Topbar } from './PartnerShell.jsx'
import './partners.css'

const NAV = [
  ['/admin/partners', 'Overview', true], ['/admin/partners/applications', 'Applications'], ['/admin/partners/partners', 'Partners'], ['/admin/partners/referrals', 'Referrals'],
  ['/admin/partners/ledger', 'Ledger'], ['/admin/partners/withdrawals', 'Withdrawals'], ['/admin/partners/settings', 'Settings'], ['/admin/partners/resources', 'Resources'], ['/admin/partners/audit', 'Audit and exports'],
]

/** Platform administrators only. The server decides (allow-list plus verified email); this just shows or hides the screens. */
export default function AdminShell() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const access = useLoad(() => (user ? api.get('/admin/partners/access').then(() => ({ ok: true }), (e) => ({ ok: false, status: e.status, error: e })) : Promise.resolve(null)), [user?.id])
  if (loading) return <Splash />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  if (access.loading || !access.data) return <Splash />
  if (!access.data.ok) {
    const net = access.data.status === 0 || access.data.status >= 500
    return (
      <div className="pt-shell"><Topbar tag="Administration" /><main className="pt-main">
        {net ? <ErrorBox error={access.data.error} onRetry={access.reload} /> : (
          <div className="pt-card stack"><h2>No access</h2><p>This area is for ShopScale platform administrators. Your account needs a verified email address that is on the administrator list.</p><Link to="/partners/dashboard" className="btn" style={{ justifySelf: 'start' }}>Go to the partner portal</Link></div>
        )}
      </main></div>
    )
  }
  return (
    <div className="pt-shell">
      <Topbar tag="Partner administration">
        <nav className="pt-nav" aria-label="Partner administration">{NAV.map(([to, label, end]) => <NavLink key={to} to={to} end={!!end} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>)}</nav>
      </Topbar>
      <main className="pt-main"><Outlet /></main>
    </div>
  )
}
