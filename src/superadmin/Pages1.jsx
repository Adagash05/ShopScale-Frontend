import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { Empty, ErrorBox, ListSkeleton, Modal, Field, Skeleton, useLoad, useToast } from '../components.jsx'
import { DataTable, Kpi, StatusBadge, fmtDate, fmtTime, label, money } from '../partners/ui.jsx'
import { FilterBar, Head, Pager, ReasonModal, Select, num, useQuery } from './kit.jsx'

const Loading = () => <div className="stack"><Skeleton height={80} /><ListSkeleton rows={4} /></div>
const Badge = ({ s }) => <StatusBadge status={s} />

// ------------------------------------------------------------------ Overview
export function Overview() {
  const d = useLoad(() => api.get('/super-admin/dashboard'), [])
  if (d.loading) return <Loading />
  if (d.error) return <ErrorBox error={d.error} onRetry={d.reload} />
  const x = d.data, b = x.businesses, u = x.users, p = x.partners
  return (
    <div className="stack">
      <Head title="Overview" sub="Live figures from the platform database. Nothing here is estimated unless it says so." />
      {(x.openSupport.open > 0) && <div className="banner" role="status"><p><b>{x.openSupport.open}</b> open support ticket{x.openSupport.open === 1 ? '' : 's'}{x.openSupport.urgent > 0 && <> ({x.openSupport.urgent} high or urgent)</>}. <Link to="/super-admin/support">Open support</Link></p></div>}
      <div className="kpis">
        <Kpi label="Businesses" value={num(b.total)} hint={`${num(b.active)} active · ${num(b.suspended)} suspended`} />
        <Kpi label="Paying" value={num(b.paid)} hint={`${num(b.trial)} on trial · ${num(b.withoutSubscription)} without a plan`} tone="teal" />
        <Kpi label="Users" value={num(u.total)} hint={`${num(u.seenLast30Days)} active in the last 30 days`} />
        <Kpi label="Partners" value={num(p.active)} hint={`${num(p.pending)} pending · ${num(p.referrals)} referrals · ${num(p.conversions)} paid`} />
      </div>
      <div className="kpis">
        <Kpi label="Collected this month" value={money(x.collectedRevenue.thisMonth)} hint="Verified successful payments" tone="navy" />
        <Kpi label="Collected, last 30 days" value={money(x.collectedRevenue.last30Days)} />
        <Kpi label="Collected, all time" value={money(x.collectedRevenue.allTime)} hint={`${num(x.collectedRevenue.payments)} payments`} />
        <Kpi label="Expected monthly recurring" value={money(x.recurringRevenue.expectedMrr)} hint={`Estimate from plan prices for ${num(x.recurringRevenue.payingSubscriptions)} paying subscriptions. Not money received.`} tone="warn" />
      </div>
      <div className="pt-card"><h2>Subscriptions by plan</h2><DataTable rows={x.subscriptionsByPlan} rowKey={(r) => r.planCode + r.status} columns={[{ key: 'planCode', label: 'Plan' }, { key: 's', label: 'Status', render: (r) => <Badge s={r.status} /> }, { key: 'count', label: 'Businesses', right: true }]} /></div>
      <div className="pt-card"><h2>Sign-ups by month</h2><DataTable rows={x.registrations} rowKey={(r) => r.month} columns={[{ key: 'month', label: 'Month' }, { key: 'businesses', label: 'New businesses', right: true }, { key: 'subscriptions', label: 'New subscriptions', right: true }]} /></div>
      <div className="pt-card"><h2>Newest businesses</h2><DataTable rows={x.recentBusinesses} columns={[{ key: 'n', label: 'Business', render: (r) => <Link to={`/super-admin/businesses/${r.id}`}>{r.name}</Link> }, { key: 'businessType', label: 'Type' }, { key: 's', label: 'Status', render: (r) => <Badge s={r.status} /> }, { key: 'c', label: 'Created', render: (r) => fmtDate(r.createdAt) }]} /></div>
      <div className="pt-card"><h2>Recent administrative activity</h2><DataTable rows={x.recentActivity} rowKey={(r) => r.createdAt + r.action} empty="No activity yet." columns={[{ key: 'c', label: 'When', render: (r) => fmtTime(r.createdAt) }, { key: 'action', label: 'Action' }, { key: 'actorEmail', label: 'By' }, { key: 'o', label: 'Result', render: (r) => (r.success ? 'Done' : 'Refused') }]} /></div>
    </div>
  )
}

// ------------------------------------------------------------------ Businesses
export function Businesses() {
  const nav = useNavigate()
  const qy = useQuery({ q: '', status: '', plan: '', industry: '', sort: 'created', dir: 'desc' })
  const filters = useLoad(() => api.get('/super-admin/businesses/filters'), [])
  const list = useLoad(() => api.get('/super-admin/businesses', qy.params), [JSON.stringify(qy.params)])
  const f = qy.f
  return (
    <div className="stack">
      <Head title="Businesses" sub="Every merchant on the platform." />
      <FilterBar>
        <input className="input" placeholder="Search name, owner, email, phone or id" aria-label="Search" value={f.q} onChange={(e) => qy.set({ q: e.target.value })} />
        <Select label="All statuses" value={f.status} onChange={(v) => qy.set({ status: v })} options={['ACTIVE', 'SUSPENDED']} />
        <Select label="All plans" value={f.plan} onChange={(v) => qy.set({ plan: v })} options={filters.data?.plans || []} />
        <Select label="All industries" value={f.industry} onChange={(v) => qy.set({ industry: v })} options={filters.data?.industries || []} />
        <Select label="Newest first" value={`${f.sort}:${f.dir}`} onChange={(v) => { const [sort, dir] = (v || 'created:desc').split(':'); qy.set({ sort, dir }) }}
          options={[{ value: 'created:asc', label: 'Oldest first' }, { value: 'name:asc', label: 'Name A–Z' }, { value: 'lastActive:desc', label: 'Recently active' }, { value: 'status:asc', label: 'Status' }]} />
      </FilterBar>
      {list.loading && !list.data ? <Loading /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : (
        <div className="pt-card" style={{ padding: 0 }}>
          <DataTable rows={list.data.items} empty="No businesses match." columns={[
            { key: 'n', label: 'Business', render: (r) => <a href={`/super-admin/businesses/${r.id}`} onClick={(e) => { e.preventDefault(); nav(`/super-admin/businesses/${r.id}`) }}><b>{r.name}</b></a> },
            { key: 'o', label: 'Owner', render: (r) => <>{r.ownerName}<div className="small muted">{r.ownerEmail}</div></> },
            { key: 'businessType', label: 'Industry' },
            { key: 'p', label: 'Plan', render: (r) => <>{r.planCode || 'None'}<div className="small muted">{r.subscriptionStatus ? label(r.subscriptionStatus) : ''}</div></> },
            { key: 's', label: 'Status', render: (r) => <Badge s={r.status} /> },
            { key: 'e', label: 'Staff / branches', render: (r) => `${r.employeeCount} / ${r.branchCount}` },
            { key: 'a', label: 'Last active', render: (r) => fmtDate(r.lastActivity) || 'Never' },
            { key: 'c', label: 'Created', render: (r) => fmtDate(r.createdAt) },
          ]} />
          <div style={{ padding: '0 16px' }}><Pager data={list.data} onPage={(page) => qy.set({ page })} /></div>
        </div>
      )}
    </div>
  )
}

export function BusinessDetail() {
  const { id } = useParams()
  const toast = useToast()
  const d = useLoad(() => api.get(`/super-admin/businesses/${id}`), [id])
  const [modal, setModal] = useState(null)
  if (d.loading) return <Loading />
  if (d.error) return <ErrorBox error={d.error} onRetry={d.reload} />
  const { business: b, subscription: s } = d.data
  const suspended = b.status === 'SUSPENDED'
  return (
    <div className="stack">
      <Head title={b.name} sub={`${b.businessType}${b.subtype ? ` · ${b.subtype}` : ''} · created ${fmtDate(b.createdAt)}`}>
        <Badge s={b.status} />
        <button className="btn" onClick={() => setModal('edit')}>Edit profile</button>
        <button className={`btn ${suspended ? 'primary' : 'danger'}`} onClick={() => setModal('status')}>{suspended ? 'Reactivate' : 'Suspend'}</button>
      </Head>
      {suspended && <div className="banner" role="status"><p>Suspended{b.statusReason ? `: ${b.statusReason}` : ''}. The merchant cannot sign in to this business and the storefront is closed. No data has been deleted.</p></div>}
      <div className="kpis">
        <Kpi label="Plan" value={s?.planCode || 'None'} hint={s ? `${label(s.status)} · renews ${fmtDate(s.currentPeriodEnd)}` : ''} />
        <Kpi label="Active products" value={num(d.data.catalogue.activeProducts)} hint={`${num(d.data.catalogue.lowStockVariants)} low on stock`} />
        <Kpi label="Completed sales" value={num(d.data.sales.completedSales)} />
        <Kpi label="Stock value at cost" value={money(d.data.catalogue.stockValueAtCost)} />
      </div>
      <div className="pt-card stack"><h2>Profile</h2>
        <div className="small">Owner: {b.ownerName} · {b.ownerEmail} · {b.ownerPhone}</div>
        <div className="small">Business email: {b.businessEmail || 'n/a'} · phone: {b.businessPhone || 'n/a'}</div>
        <div className="small">Address: {b.address || 'n/a'} · Slug: {b.slug} · {b.currency} · {b.timezone}</div>
        {d.data.referral && <div className="small">Referred by partner <b>{d.data.referral.partnerName}</b> ({d.data.referral.code})</div>}
      </div>
      <div className="pt-card"><h2>Team</h2><DataTable rows={d.data.members} rowKey={(r) => r.userId} columns={[{ key: 'fullName', label: 'Name', render: (r) => <Link to={`/super-admin/users/${r.userId}`}>{r.fullName}</Link> }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Role' }, { key: 'a', label: 'Access', render: (r) => (r.membershipActive && r.userActive ? 'Active' : 'Disabled') }, { key: 'l', label: 'Last active', render: (r) => fmtDate(r.lastActiveAt) }]} /></div>
      <div className="pt-card"><h2>Branches</h2><DataTable rows={d.data.branches} columns={[{ key: 'name', label: 'Branch' }, { key: 'address', label: 'Address' }, { key: 'a', label: 'Status', render: (r) => (r.active ? 'Active' : 'Inactive') }]} /></div>
      <div className="pt-card"><h2>Subscription payments</h2><DataTable rows={d.data.payments} rowKey={(r) => r.reference} empty="No payments yet." columns={[{ key: 'reference', label: 'Reference' }, { key: 'kind', label: 'Kind', render: (r) => label(r.kind) }, { key: 'planCode', label: 'Plan' }, { key: 'amount', label: 'Amount', right: true, render: (r) => money(r.amount) }, { key: 's', label: 'Status', render: (r) => <Badge s={r.status} /> }, { key: 'c', label: 'Date', render: (r) => fmtDate(r.paidAt || r.createdAt) }]} /></div>
      <div className="pt-card"><h2>Support tickets</h2><DataTable rows={d.data.support} empty="No tickets." columns={[{ key: 'subject', label: 'Subject', render: (r) => <Link to={`/super-admin/support/${r.id}`}>{r.subject}</Link> }, { key: 's', label: 'Status', render: (r) => <Badge s={r.status} /> }, { key: 'c', label: 'Opened', render: (r) => fmtDate(r.createdAt) }]} /></div>
      <div className="pt-card"><h2>Recent merchant activity</h2><DataTable rows={d.data.activity} rowKey={(r) => r.createdAt + r.action} empty="No activity." columns={[{ key: 'c', label: 'When', render: (r) => fmtTime(r.createdAt) }, { key: 'action', label: 'Action' }, { key: 'entity', label: 'Item' }]} /></div>
      <div className="pt-card"><h2>Administrative history</h2><DataTable rows={d.data.adminHistory} rowKey={(r) => r.createdAt + r.action} empty="No administrative actions yet." columns={[{ key: 'c', label: 'When', render: (r) => fmtTime(r.createdAt) }, { key: 'action', label: 'Action' }, { key: 'actorEmail', label: 'By' }, { key: 'reason', label: 'Reason' }]} /></div>
      {modal === 'status' && <ReasonModal title={suspended ? 'Reactivate business' : 'Suspend business'} danger={!suspended} submitLabel={suspended ? 'Reactivate' : 'Suspend'}
        message={suspended ? 'The merchant and the storefront will work again immediately.' : 'The merchant is blocked and the storefront closes. Nothing is deleted. You can reactivate at any time.'}
        onSubmit={async (reason) => { await api.post(`/super-admin/businesses/${id}/${suspended ? 'reactivate' : 'suspend'}`, { reason }); toast(suspended ? 'Business reactivated' : 'Business suspended'); d.reload() }} onClose={() => setModal(null)} />}
      {modal === 'edit' && <EditBusiness b={b} onDone={() => { toast('Saved'); d.reload() }} onClose={() => setModal(null)} id={id} />}
    </div>
  )
}

function EditBusiness({ b, id, onDone, onClose }) {
  const [v, setV] = useState({ name: b.name || '', phone: b.businessPhone || '', email: b.businessEmail || '', address: b.address || '', description: b.description || '', reason: '' })
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  async function go(e) {
    e.preventDefault(); setErr('')
    if (v.reason.trim().length < 3) { setErr('Write a reason for the change.'); return }
    setBusy(true)
    try { await api.put(`/super-admin/businesses/${id}`, { ...v, reason: v.reason.trim() }); onDone(); onClose() } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Edit business profile" onClose={onClose}>
      <form className="stack" onSubmit={go} noValidate>
        <Field label="Name" htmlFor="eb-n"><input id="eb-n" className="input" value={v.name} onChange={set('name')} /></Field>
        <Field label="Phone" htmlFor="eb-p"><input id="eb-p" className="input" value={v.phone} onChange={set('phone')} /></Field>
        <Field label="Email" htmlFor="eb-e"><input id="eb-e" className="input" value={v.email} onChange={set('email')} /></Field>
        <Field label="Address" htmlFor="eb-a"><input id="eb-a" className="input" value={v.address} onChange={set('address')} /></Field>
        <Field label="Description" htmlFor="eb-d"><textarea id="eb-d" className="textarea" rows={2} value={v.description} onChange={set('description')} /></Field>
        <Field label="Reason for the change" htmlFor="eb-r"><input id="eb-r" className="input" value={v.reason} onChange={set('reason')} /></Field>
        {err && <p className="form-error" role="alert">{err}</p>}
        <p className="small muted">Only profile details can be changed here. The store address, plan and financial records are not editable.</p>
        <div className="pt-actions"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  )
}

// ------------------------------------------------------------------ Users
export function Users() {
  const qy = useQuery({ q: '', status: '', role: '', sort: 'created', dir: 'desc' })
  const list = useLoad(() => api.get('/super-admin/users', qy.params), [JSON.stringify(qy.params)])
  const f = qy.f
  return (
    <div className="stack">
      <Head title="Users" sub="Merchant accounts. Super Admin accounts are not listed here." />
      <FilterBar>
        <input className="input" placeholder="Search name, email, phone or id" aria-label="Search" value={f.q} onChange={(e) => qy.set({ q: e.target.value })} />
        <Select label="All statuses" value={f.status} onChange={(v) => qy.set({ status: v })} options={[{ value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }]} />
        <Select label="All roles" value={f.role} onChange={(v) => qy.set({ role: v })} options={['OWNER', 'ADMIN', 'MANAGER', 'CASHIER']} />
      </FilterBar>
      {list.loading && !list.data ? <Loading /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : (
        <div className="pt-card" style={{ padding: 0 }}>
          <DataTable rows={list.data.items} empty="No users match." columns={[
            { key: 'n', label: 'User', render: (r) => <Link to={`/super-admin/users/${r.id}`}><b>{r.fullName}</b></Link> },
            { key: 'email', label: 'Email', render: (r) => <>{r.email}<div className="small muted">{r.emailVerified ? 'Verified' : 'Not verified'}</div></> },
            { key: 'b', label: 'Businesses', render: (r) => (r.businesses || []).map((m) => `${m.businessName} (${m.role})`).join(', ') || 'None' },
            { key: 's', label: 'Status', render: (r) => <Badge s={r.active ? 'APPROVED' : 'SUSPENDED'} /> },
            { key: 'a', label: 'Last active', render: (r) => fmtDate(r.lastActiveAt) || 'Never' },
          ]} />
          <div style={{ padding: '0 16px' }}><Pager data={list.data} onPage={(page) => qy.set({ page })} /></div>
        </div>
      )}
    </div>
  )
}

export function UserDetail() {
  const { id } = useParams()
  const toast = useToast()
  const d = useLoad(() => api.get(`/super-admin/users/${id}`), [id])
  const [modal, setModal] = useState(null)
  if (d.loading) return <Loading />
  if (d.error) return <ErrorBox error={d.error} onRetry={d.reload} />
  const u = d.data.user
  const act = (path, msg) => async (reason) => { await api.post(`/super-admin/users/${id}/${path}`, { reason }); toast(msg); d.reload() }
  return (
    <div className="stack">
      <Head title={u.fullName} sub={`${u.email} · ${u.phone || 'no phone'} · joined ${fmtDate(u.createdAt)}`}>
        <Badge s={u.active ? 'APPROVED' : 'SUSPENDED'} />
        <button className="btn" onClick={() => setModal('reset')}>Send password reset</button>
        <button className={`btn ${u.active ? 'danger' : 'primary'}`} onClick={() => setModal('status')}>{u.active ? 'Suspend user' : 'Reactivate user'}</button>
      </Head>
      {d.data.affiliate && <div className="banner"><p>This user is also a partner ({d.data.affiliate.code}, {label(d.data.affiliate.status)}). <Link to={`/super-admin/partners/partners/${d.data.affiliate.id}`}>Open partner</Link></p></div>}
      <div className="pt-card"><h2>Recent sessions</h2><DataTable rows={d.data.sessions} rowKey={(r) => String(r.createdAt)} empty="No sessions." columns={[{ key: 'userAgent', label: 'Device' }, { key: 'c', label: 'Started', render: (r) => fmtTime(r.sessionStartedAt || r.createdAt) }, { key: 'r', label: 'Ended', render: (r) => (r.revokedAt ? fmtTime(r.revokedAt) : '') }]} /></div>
      <div className="pt-card"><h2>Recent activity</h2><DataTable rows={d.data.activity} rowKey={(r) => r.createdAt + r.action} empty="No activity." columns={[{ key: 'c', label: 'When', render: (r) => fmtTime(r.createdAt) }, { key: 'action', label: 'Action' }, { key: 'entity', label: 'Item' }]} /></div>
      <div className="pt-card"><h2>Administrative history</h2><DataTable rows={d.data.adminHistory} rowKey={(r) => r.createdAt + r.action} empty="Nothing yet." columns={[{ key: 'c', label: 'When', render: (r) => fmtTime(r.createdAt) }, { key: 'action', label: 'Action' }, { key: 'actorEmail', label: 'By' }, { key: 'reason', label: 'Reason' }]} /></div>
      {modal === 'status' && <ReasonModal title={u.active ? 'Suspend user' : 'Reactivate user'} danger={u.active} submitLabel={u.active ? 'Suspend' : 'Reactivate'} message={u.active ? 'The user is signed out and cannot sign in. Their records stay.' : 'The user can sign in again.'} onSubmit={act(u.active ? 'suspend' : 'reactivate', u.active ? 'User suspended' : 'User reactivated')} onClose={() => setModal(null)} />}
      {modal === 'reset' && <ReasonModal title="Send password reset email" submitLabel="Send email" message="The user receives the normal reset link by email. You never see or set their password." onSubmit={act('password-reset', 'Reset email sent')} onClose={() => setModal(null)} />}
    </div>
  )
}

// ------------------------------------------------------------------ Subscriptions
export function Subscriptions() {
  const qy = useQuery({ q: '', plan: '', status: '', attention: '', sort: 'renewal', dir: 'asc' })
  const list = useLoad(() => api.get('/super-admin/subscriptions', qy.params), [JSON.stringify(qy.params)])
  const plans = useLoad(() => api.get('/super-admin/businesses/filters'), [])
  const [open, setOpen] = useState(null)
  const f = qy.f
  return (
    <div className="stack">
      <Head title="Subscriptions" sub="Plans, renewals and payment problems. Payments are only ever marked successful by Paystack verification." />
      <FilterBar>
        <input className="input" placeholder="Search business" aria-label="Search" value={f.q} onChange={(e) => qy.set({ q: e.target.value })} />
        <Select label="All plans" value={f.plan} onChange={(v) => qy.set({ plan: v })} options={plans.data?.plans || []} />
        <Select label="All statuses" value={f.status} onChange={(v) => qy.set({ status: v })} options={['ACTIVE', 'TRIALING', 'PAST_DUE', 'GRACE_PERIOD', 'EXPIRED', 'CANCELLED']} />
        <Select label="All subscriptions" value={f.attention} onChange={(v) => qy.set({ attention: v })} options={[{ value: 'payment_failed', label: 'Payment problems' }]} />
      </FilterBar>
      {list.loading && !list.data ? <Loading /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : (
        <div className="pt-card" style={{ padding: 0 }}>
          <DataTable rows={list.data.items} empty="No subscriptions match." columns={[
            { key: 'n', label: 'Business', render: (r) => <button className="linkish" onClick={() => setOpen(r.businessId)}><b>{r.businessName}</b></button> },
            { key: 'planCode', label: 'Plan', render: (r) => `${r.planCode} · ${label(r.billingCycle || '')}` },
            { key: 's', label: 'Status', render: (r) => <Badge s={r.status} /> },
            { key: 'e', label: 'Period ends', render: (r) => fmtDate(r.currentPeriodEnd) },
            { key: 'a', label: 'Auto-renew', render: (r) => (r.autoRenew ? 'On' : 'Off') },
            { key: 'l', label: 'Last payment', render: (r) => (r.lastPaymentStatus ? <Badge s={r.lastPaymentStatus} /> : '') },
            { key: 'f', label: 'Problem', render: (r) => r.lastFailure || '' },
          ]} />
          <div style={{ padding: '0 16px' }}><Pager data={list.data} onPage={(page) => qy.set({ page })} /></div>
        </div>
      )}
      {open && <SubscriptionModal businessId={open} onClose={() => setOpen(null)} onChanged={list.reload} />}
    </div>
  )
}

function SubscriptionModal({ businessId, onClose, onChanged }) {
  const toast = useToast()
  const d = useLoad(() => api.get(`/super-admin/subscriptions/${businessId}`), [businessId])
  const [ext, setExt] = useState(false)
  const s = d.data?.subscription
  return (
    <Modal title={s ? s.businessName : 'Subscription'} onClose={onClose}>
      {d.loading ? <Loading /> : d.error ? <ErrorBox error={d.error} onRetry={d.reload} /> : (
        <div className="stack">
          <div className="small">{s.planCode} · {label(s.status)} · ends {fmtDate(s.currentPeriodEnd)} · saved card: {d.data.hasSavedCard ? 'yes' : 'no'} · auto-renew {s.autoRenew ? 'on' : 'off'}</div>
          <h3>Payments</h3>
          <DataTable rows={d.data.payments} rowKey={(r) => r.reference} empty="No payments." columns={[{ key: 'reference', label: 'Reference' }, { key: 'amount', label: 'Amount', right: true, render: (r) => money(r.amount) }, { key: 's', label: 'Status', render: (r) => <Badge s={r.status} /> }, { key: 'd', label: 'Date', render: (r) => fmtDate(r.paidAt || r.createdAt) }]} />
          <h3>Renewal attempts</h3>
          <DataTable rows={d.data.renewals} rowKey={(r) => String(r.dueAt) + r.attemptNo} empty="None." columns={[{ key: 'd', label: 'Due', render: (r) => fmtDate(r.dueAt) }, { key: 'attemptNo', label: 'Attempt' }, { key: 's', label: 'Status', render: (r) => <Badge s={r.status} /> }, { key: 'failureReason', label: 'Reason' }]} />
          <button className="btn" onClick={() => setExt(true)}>Extend period (goodwill)</button>
          {ext && <ExtendForm businessId={businessId} onClose={() => setExt(false)} onDone={() => { toast('Period extended'); d.reload(); onChanged() }} />}
        </div>
      )}
    </Modal>
  )
}

function ExtendForm({ businessId, onClose, onDone }) {
  const [days, setDays] = useState('7'), [reason, setReason] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  async function go(e) {
    e.preventDefault(); setErr('')
    const n = Number(days)
    if (!Number.isInteger(n) || n < 1 || n > 90) { setErr('Enter 1 to 90 days.'); return }
    if (reason.trim().length < 3) { setErr('Write a reason.'); return }
    setBusy(true)
    try { await api.post(`/super-admin/subscriptions/${businessId}/extend`, { days: n, reason: reason.trim() }); onDone(); onClose() } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <form className="stack pt-card" onSubmit={go} noValidate>
      <Field label="Days to add (1 to 90)" htmlFor="ex-d"><input id="ex-d" className="input" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} /></Field>
      <Field label="Reason" htmlFor="ex-r"><input id="ex-r" className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <p className="small muted">This adds time at no charge and is recorded as an administrative extension, not as a payment.</p>
      {err && <p className="form-error" role="alert">{err}</p>}
      <div className="pt-actions"><button className="btn primary" disabled={busy}>{busy ? 'Working…' : 'Extend'}</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
    </form>
  )
}

// ------------------------------------------------------------------ Transactions
export function Transactions() {
  const qy = useQuery({ q: '', status: '', kind: '', from: '', to: '', sort: 'created', dir: 'desc' })
  const list = useLoad(() => api.get('/super-admin/transactions', qy.params), [JSON.stringify(qy.params)])
  const sum = useLoad(() => api.get('/super-admin/transactions/summary'), [])
  const f = qy.f
  return (
    <div className="stack">
      <Head title="Transactions" sub="ShopScale subscription payments taken through Paystack. Merchant sales are not shown here. Card details are never stored or shown." />
      {sum.data && <div className="kpis">
        <Kpi label="Collected, all time" value={money(sum.data.totals.collectedAllTime)} hint="Verified successful payments only" tone="navy" />
        <Kpi label="Successful" value={num(sum.data.totals.successful)} />
        <Kpi label="Failed" value={num(sum.data.totals.failed)} tone="warn" />
        <Kpi label="Amount mismatch" value={num(sum.data.totals.mismatched)} hint="Paid amount differed from the price" />
      </div>}
      {sum.data && <div className="pt-card"><h2>Collected by month</h2><DataTable rows={sum.data.collectedByMonth} rowKey={(r) => r.month} empty="No successful payments yet." columns={[{ key: 'month', label: 'Month' }, { key: 'payments', label: 'Payments', right: true }, { key: 'collected', label: 'Collected', right: true, render: (r) => money(r.collected) }]} /></div>}
      <FilterBar>
        <input className="input" placeholder="Reference or business" aria-label="Search" value={f.q} onChange={(e) => qy.set({ q: e.target.value })} />
        <Select label="All statuses" value={f.status} onChange={(v) => qy.set({ status: v })} options={['SUCCESS', 'PENDING', 'FAILED', 'MISMATCH']} />
        <input className="input" type="date" aria-label="From" value={f.from} onChange={(e) => qy.set({ from: e.target.value })} />
        <input className="input" type="date" aria-label="To" value={f.to} onChange={(e) => qy.set({ to: e.target.value })} />
      </FilterBar>
      {list.loading && !list.data ? <Loading /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : (
        <div className="pt-card" style={{ padding: 0 }}>
          <DataTable rows={list.data.items} empty="No transactions match." columns={[
            { key: 'reference', label: 'Reference' },
            { key: 'b', label: 'Business', render: (r) => <Link to={`/super-admin/businesses/${r.businessId}`}>{r.businessName}</Link> },
            { key: 'k', label: 'Plan', render: (r) => `${r.planCode} · ${label(r.kind)}` },
            { key: 'amount', label: 'Amount', right: true, render: (r) => money(r.amount) },
            { key: 's', label: 'Status', render: (r) => <Badge s={r.status} /> },
            { key: 'source', label: 'Source' },
            { key: 'd', label: 'Date', render: (r) => fmtDate(r.paidAt || r.createdAt) },
            { key: 'failureNote', label: 'Note' },
          ]} />
          <div style={{ padding: '0 16px' }}><Pager data={list.data} onPage={(page) => qy.set({ page })} /></div>
        </div>
      )}
    </div>
  )
}
