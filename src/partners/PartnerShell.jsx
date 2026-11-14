import { createContext, useContext } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { SmartLink as Link } from '../lib/SmartLink.jsx'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { ErrorBox, Skeleton, useLoad } from '../components.jsx'
import VerifyNotice from '../pages/VerifyNotice.jsx'
import { StatusBadge, fmtDate } from './ui.jsx'
import './partners.css'

const PartnerCtx = createContext(null)
export const usePartner = () => useContext(PartnerCtx)

const NAV = [
  ['/partners/dashboard', 'Dashboard'], ['/partners/referrals', 'Referrals'], ['/partners/earnings', 'Earnings'],
  ['/partners/withdrawals', 'Withdrawals'], ['/partners/payment-details', 'Payment details'], ['/partners/resources', 'Resources'], ['/partners/profile', 'Profile'],
]

export function Splash() {
  return <div style={{ padding: 24, display: 'grid', gap: 12, maxWidth: 1120, margin: '0 auto' }}><Skeleton height={28} width="40%" /><Skeleton height={120} /></div>
}

/** Top bar shared by the partner portal and the partner administration. */
export function Topbar({ tag, admin, children }) {
  const { user, business, logout } = useAuth()
  return (
    <header className="pt-top">
      <div className="pt-top-in">
        <Link to="/" className="brand"><img className="brand-logo" src="/brand/logo-96.png" alt="" width="29" height="32" />ShopScale</Link>
        <span className="pt-tag">{tag}</span>
        <span className="pt-grow" />
        {admin && <Link to="/admin/partners" className="btn sm">Partner administration</Link>}
        {business && <Link to="/dashboard" className="btn sm">Back to my business</Link>}
        <span className="small muted" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</span>
        <button className="btn sm" onClick={logout}>Sign out</button>
      </div>
      {children}
    </header>
  )
}

function StatusCard({ partner }) {
  const msg = {
    PENDING: 'Thank you for applying. Our team is reviewing your application and will email you once it is decided. You do not need to do anything else.',
    REJECTED: 'We were not able to approve this application.',
    SUSPENDED: 'Your partner account is suspended. Referral links are switched off and no new commission is recorded while it is suspended. Earned commission is kept.',
  }[partner.status]
  return (
    <div className="pt-card stack" role="status">
      <div className="row between"><h2 style={{ margin: 0 }}>Your application</h2><StatusBadge status={partner.status} /></div>
      <p>{msg}</p>
      {partner.statusReason && <p className="small"><b>Reason:</b> {partner.statusReason}</p>}
      <p className="muted small">Applied {fmtDate(partner.createdAt)}. Questions? <Link to="/contact">Contact us</Link>.</p>
    </div>
  )
}

/** Signed-in area for partners. It works with or without a business: a partner is just a ShopScale account. */
export default function PartnerShell() {
  const { user, loading, business } = useAuth()
  const location = useLocation()
  const me = useLoad(() => (user ? api.get('/partners/me') : Promise.resolve(null)), [user?.id])
  const admin = useLoad(() => (user ? api.get('/admin/partners/access').then(() => true, () => false) : Promise.resolve(false)), [user?.id])
  if (loading) return <Splash />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  if (me.loading) return <Splash />
  if (me.error) return <div className="pt-main"><ErrorBox error={me.error} onRetry={me.reload} /></div>
  if (!me.data?.applied) return <Navigate to="/partners/apply" replace />
  const partner = me.data.partner
  const approved = partner.status === 'APPROVED'
  return (
    <PartnerCtx.Provider value={{ partner, reload: me.reload }}>
      <div className="pt-shell">
        <Topbar tag="Partner portal" admin={admin.data === true}>
          {approved && <nav className="pt-nav" aria-label="Partner portal">{NAV.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>)}</nav>}
        </Topbar>
        <main className="pt-main">
          <VerifyNotice email={user.email} />
          {approved ? <Outlet /> : <StatusCard partner={partner} />}
          {!approved && business && <p className="muted small">You also have a business on ShopScale. <Link to="/dashboard">Open it</Link>.</p>}
        </main>
      </div>
    </PartnerCtx.Provider>
  )
}
