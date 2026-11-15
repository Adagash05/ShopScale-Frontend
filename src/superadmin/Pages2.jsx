import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { Confirm, ErrorBox, Field, ListSkeleton, Modal, Skeleton, useLoad, useToast } from '../components.jsx'
import { DataTable, Kpi, StatusBadge, fmtDate, fmtTime, label, money } from '../partners/ui.jsx'
import { FilterBar, Head, Pager, ReasonModal, Select, bytes, num, useQuery } from './kit.jsx'

const Loading = () => <div className="stack"><Skeleton height={80} /><ListSkeleton rows={4} /></div>
const Badge = ({ s }) => <StatusBadge status={s} />

// ------------------------------------------------------------------ Partners (directory + the existing partner screens)
const PNAV = [['/super-admin/partners', 'Overview', true], ['/super-admin/partners/directory', 'Directory'], ['/super-admin/partners/applications', 'Applications'], ['/super-admin/partners/partners', 'Status and commissions'],
  ['/super-admin/partners/referrals', 'Referrals'], ['/super-admin/partners/ledger', 'Ledger'], ['/super-admin/partners/withdrawals', 'Payouts'], ['/super-admin/partners/settings', 'Programme settings'],
  ['/super-admin/partners/resources', 'Resources'], ['/super-admin/partners/audit', 'Audit and exports']]

/** Tabs around the partner screens. The screens themselves are the ones the partner programme already has; this console only adds the directory and create/edit. */
export function PartnersLayout() {
  return (
    <div className="stack">
      <nav className="sa-tabs" aria-label="Partner administration">{PNAV.map(([to, l, end]) => <NavLink key={to} to={to} end={!!end} className={({ isActive }) => (isActive ? 'active' : '')}>{l}</NavLink>)}</nav>
      <Outlet />
    </div>
  )
}

export function PartnerDirectory() {
  const toast = useToast()
  const qy = useQuery({ q: '', status: '', sort: 'created', dir: 'desc' })
  const list = useLoad(() => api.get('/super-admin/partners', qy.params), [JSON.stringify(qy.params)])
  const [modal, setModal] = useState(null)
  const f = qy.f
  return (
    <div className="stack">
      <Head title="Partner directory" sub="Create partners, edit their details and remove ones that never had any activity."><button className="btn primary" onClick={() => setModal({ type: 'create' })}>New partner</button></Head>
      <FilterBar>
        <input className="input" placeholder="Search name, email, code, phone" aria-label="Search" value={f.q} onChange={(e) => qy.set({ q: e.target.value })} />
        <Select label="All statuses" value={f.status} onChange={(v) => qy.set({ status: v })} options={['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED']} />
      </FilterBar>
      {list.loading && !list.data ? <Loading /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : (
        <div className="pt-card" style={{ padding: 0 }}>
          <DataTable rows={list.data.items} empty="No partners match." columns={[
            { key: 'n', label: 'Partner', render: (r) => <Link to={`/super-admin/partners/partners/${r.id}`}><b>{r.fullName}</b></Link> },
            { key: 'email', label: 'Contact', render: (r) => <>{r.email}<div className="small muted">{r.phone}</div></> },
            { key: 'code', label: 'Code' },
            { key: 's', label: 'Status', render: (r) => <Badge s={r.status} /> },
            { key: 'r', label: 'Referrals / paid', render: (r) => `${r.totalReferrals} / ${r.conversions}` },
            { key: 'e', label: 'Earned', right: true, render: (r) => money(r.commissionEarned) },
            { key: 'p', label: 'Pending', right: true, render: (r) => money(r.pendingCommission) },
            { key: 'o', label: 'Paid out', right: true, render: (r) => money(r.totalPayouts) },
            { key: 'a', label: '', render: (r) => <><button className="btn sm" onClick={() => setModal({ type: 'edit', row: r })}>Edit</button> <button className="btn sm danger" onClick={() => setModal({ type: 'delete', row: r })}>Delete</button></> },
          ]} />
          <div style={{ padding: '0 16px' }}><Pager data={list.data} onPage={(page) => qy.set({ page })} /></div>
        </div>
      )}
      {modal?.type === 'create' && <PartnerForm onClose={() => setModal(null)} onDone={() => { toast('Partner created'); list.reload() }} />}
      {modal?.type === 'edit' && <PartnerForm row={modal.row} onClose={() => setModal(null)} onDone={() => { toast('Partner updated'); list.reload() }} />}
      {modal?.type === 'delete' && <Confirm title="Delete partner" danger confirmLabel="Delete" message={`Delete ${modal.row.fullName}? This works only if the partner has no clicks, referrals, commissions or payouts. If it has any, nothing is deleted and you should suspend the partner instead.`}
        onConfirm={async () => { try { await api.del(`/super-admin/partners/${modal.row.id}`); toast('Partner deleted'); list.reload() } catch (e) { toast(e.message, 'error') } setModal(null) }} onClose={() => setModal(null)} />}
    </div>
  )
}

function PartnerForm({ row, onClose, onDone }) {
  const editing = !!row
  const [v, setV] = useState({ email: row?.email || '', fullName: row?.fullName || '', phone: row?.phone || '', country: row?.country || 'Nigeria', niche: '', audienceSize: '0', location: '', website: '' })
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  async function go(e) {
    e.preventDefault(); setErr('')
    const audienceSize = Number(v.audienceSize)
    if (!v.fullName.trim() || !v.phone.trim() || !v.niche.trim() || !v.country.trim() || (!editing && !v.email.trim())) { setErr('Fill in every required field.'); return }
    if (!Number.isInteger(audienceSize) || audienceSize < 0) { setErr('Audience size must be a whole number.'); return }
    setBusy(true)
    try {
      const body = { fullName: v.fullName.trim(), phone: v.phone.trim(), country: v.country.trim(), niche: v.niche.trim(), audienceSize, socials: [], location: v.location.trim() || null, website: v.website.trim() || null }
      if (editing) await api.put(`/super-admin/partners/${row.id}`, body); else await api.post('/super-admin/partners', { ...body, email: v.email.trim() })
      onDone(); onClose()
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={editing ? 'Edit partner' : 'New partner'} onClose={onClose}>
      <form className="stack" onSubmit={go} noValidate>
        {!editing && <Field label="Email" htmlFor="pf-e" hint="The partner account is created on this email. The person receives no password from you."><input id="pf-e" className="input" type="email" value={v.email} onChange={set('email')} /></Field>}
        <Field label="Full name" htmlFor="pf-n"><input id="pf-n" className="input" value={v.fullName} onChange={set('fullName')} /></Field>
        <Field label="Phone" htmlFor="pf-p"><input id="pf-p" className="input" value={v.phone} onChange={set('phone')} /></Field>
        <Field label="Country" htmlFor="pf-c"><input id="pf-c" className="input" value={v.country} onChange={set('country')} /></Field>
        <Field label="Niche or audience" htmlFor="pf-ni"><input id="pf-ni" className="input" value={v.niche} onChange={set('niche')} /></Field>
        <Field label="Audience size" htmlFor="pf-a"><input id="pf-a" className="input" inputMode="numeric" value={v.audienceSize} onChange={set('audienceSize')} /></Field>
        <Field label="Location (optional)" htmlFor="pf-l"><input id="pf-l" className="input" value={v.location} onChange={set('location')} /></Field>
        <Field label="Website (optional)" htmlFor="pf-w"><input id="pf-w" className="input" value={v.website} onChange={set('website')} /></Field>
        {err && <p className="form-error" role="alert">{err}</p>}
        <div className="pt-actions"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  )
}

// ------------------------------------------------------------------ Support
export function Support() {
  const nav = useNavigate()
  const qy = useQuery({ q: '', status: 'open', priority: '', assigned: '', sort: 'updated', dir: 'desc' })
  const list = useLoad(() => api.get('/super-admin/support/tickets', qy.params), [JSON.stringify(qy.params)])
  const f = qy.f
  return (
    <div className="stack">
      <Head title="Support" sub="Tickets raised by merchants. Replies reach the merchant on their Help page." />
      <FilterBar>
        <input className="input" placeholder="Search subject, business or email" aria-label="Search" value={f.q} onChange={(e) => qy.set({ q: e.target.value })} />
        <Select label="Any status" value={f.status} onChange={(v) => qy.set({ status: v })} options={[{ value: 'open', label: 'All open' }, 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED']} />
        <Select label="Any priority" value={f.priority} onChange={(v) => qy.set({ priority: v })} options={['LOW', 'NORMAL', 'HIGH', 'URGENT']} />
        <Select label="Anyone" value={f.assigned} onChange={(v) => qy.set({ assigned: v })} options={[{ value: 'me', label: 'Assigned to me' }, { value: 'unassigned', label: 'Unassigned' }]} />
      </FilterBar>
      {list.loading && !list.data ? <Loading /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : (
        <div className="pt-card" style={{ padding: 0 }}>
          <DataTable rows={list.data.items} empty="No tickets match." columns={[
            { key: 'subject', label: 'Ticket', render: (r) => <a href={`/super-admin/support/${r.id}`} onClick={(e) => { e.preventDefault(); nav(`/super-admin/support/${r.id}`) }}><b>{r.subject}</b></a> },
            { key: 'b', label: 'Business', render: (r) => <>{r.businessName || 'n/a'}<div className="small muted">{r.userEmail}</div></> },
            { key: 'category', label: 'Category', render: (r) => label(r.category) },
            { key: 'p', label: 'Priority', render: (r) => <span className={`badge ${r.priority === 'URGENT' || r.priority === 'HIGH' ? 'danger' : ''}`}>{label(r.priority)}</span> },
            { key: 's', label: 'Status', render: (r) => <Badge s={r.status} /> },
            { key: 'u', label: 'Updated', render: (r) => fmtTime(r.updatedAt) },
          ]} />
          <div style={{ padding: '0 16px' }}><Pager data={list.data} onPage={(page) => qy.set({ page })} /></div>
        </div>
      )}
    </div>
  )
}

export function TicketDetail() {
  const { id } = useParams()
  const toast = useToast()
  const d = useLoad(() => api.get(`/super-admin/support/tickets/${id}`), [id])
  const [note, setNote] = useState(''), [internal, setInternal] = useState(true), [resolution, setResolution] = useState(null), [busy, setBusy] = useState(false)
  if (d.loading) return <Loading />
  if (d.error) return <ErrorBox error={d.error} onRetry={d.reload} />
  const t = d.data.ticket
  const update = async (body, msg) => { setBusy(true); try { await api.put(`/super-admin/support/tickets/${id}`, body); toast(msg); d.reload() } catch (e) { toast(e.message, 'error') } finally { setBusy(false) } }
  async function addNote(e) {
    e.preventDefault()
    if (!note.trim()) return
    setBusy(true)
    try { await api.post(`/super-admin/support/tickets/${id}/notes`, { body: note.trim(), internal }); setNote(''); toast(internal ? 'Internal note added' : 'Reply sent to the merchant'); d.reload() } catch (x) { toast(x.message, 'error') } finally { setBusy(false) }
  }
  return (
    <div className="stack">
      <Head title={t.subject} sub={`${t.businessName || 'No business'} · ${t.userName || ''} ${t.userEmail ? `(${t.userEmail})` : ''} · opened ${fmtTime(t.createdAt)}`}><Badge s={t.status} /></Head>
      <div className="pt-card stack"><p style={{ whiteSpace: 'pre-wrap' }}>{t.description}</p><div className="small muted">{label(t.category)} · priority {label(t.priority)} · assigned to {t.assignedEmail || 'nobody'}</div></div>
      <div className="pt-card row wrap">
        <Select label="Set status" value="" onChange={(v) => v && (v === 'RESOLVED' ? setResolution('') : update({ status: v }, 'Status updated'))} options={['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED']} />
        <Select label="Set priority" value="" onChange={(v) => v && update({ priority: v }, 'Priority updated')} options={['LOW', 'NORMAL', 'HIGH', 'URGENT']} />
        <button className="btn" disabled={busy} onClick={() => update({ assignToMe: true }, 'Assigned to you')}>Assign to me</button>
        {t.businessId && <Link className="btn" to={`/super-admin/businesses/${t.businessId}`}>Open business</Link>}
      </div>
      {t.resolution && <div className="banner"><p><b>Resolution:</b> {t.resolution}</p></div>}
      <div className="pt-card stack"><h2>Conversation and notes</h2>
        {d.data.notes.length === 0 && <p className="muted">No notes yet.</p>}
        {d.data.notes.map((n) => <div key={n.id} className={`sa-note ${n.internal ? 'internal' : ''}`}><div className="small muted">{n.authorName || 'Merchant'} {n.byAdmin ? '(ShopScale)' : ''} · {fmtTime(n.createdAt)} · {n.internal ? 'Internal, not visible to the merchant' : 'Visible to the merchant'}</div><p style={{ whiteSpace: 'pre-wrap' }}>{n.body}</p></div>)}
        <form className="stack" onSubmit={addNote}>
          <textarea className="textarea" rows={3} aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} />
          <label className="row"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note (the merchant will not see it)</label>
          <button className="btn primary" disabled={busy || !note.trim()} style={{ justifySelf: 'start' }}>{internal ? 'Add note' : 'Send reply'}</button>
        </form>
      </div>
      {resolution !== null && <Modal title="Resolve ticket" onClose={() => setResolution(null)}>
        <div className="stack"><Field label="What was done?" htmlFor="tr"><textarea id="tr" className="textarea" rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} maxLength={2000} /></Field>
          <div className="pt-actions"><button className="btn primary" disabled={!resolution.trim() || busy} onClick={async () => { await update({ status: 'RESOLVED', resolution: resolution.trim() }, 'Ticket resolved'); setResolution(null) }}>Mark resolved</button><button className="btn" onClick={() => setResolution(null)}>Cancel</button></div></div>
      </Modal>}
    </div>
  )
}

// ------------------------------------------------------------------ Announcements
export function Announcements() {
  const toast = useToast()
  const list = useLoad(() => api.get('/super-admin/announcements'), [])
  const plans = useLoad(() => api.get('/super-admin/businesses/filters'), [])
  const [modal, setModal] = useState(null)
  if (list.loading) return <Loading />
  if (list.error) return <ErrorBox error={list.error} onRetry={list.reload} />
  const act = async (a, path, msg) => { try { await api.post(`/super-admin/announcements/${a.id}/${path}`); toast(msg); list.reload() } catch (e) { toast(e.message, 'error') } }
  return (
    <div className="stack">
      <Head title="Announcements" sub="Shown as a banner inside the merchant app while published and inside their window. No email or SMS is sent from here."><button className="btn primary" onClick={() => setModal({})}>New announcement</button></Head>
      <div className="pt-card" style={{ padding: 0 }}>
        <DataTable rows={list.data} empty="No announcements yet." columns={[
          { key: 'title', label: 'Announcement', render: (r) => <><b>{r.title}</b><div className="small muted">{r.body.length > 90 ? `${r.body.slice(0, 90)}…` : r.body}</div></> },
          { key: 'level', label: 'Level', render: (r) => label(r.level) },
          { key: 'audience', label: 'Audience', render: (r) => (r.audience === 'ALL' ? 'Everyone' : r.audience.replace('PLAN:', 'Plan ')) },
          { key: 'state', label: 'State', render: (r) => label(r.state.toUpperCase()) },
          { key: 'w', label: 'Window', render: (r) => (r.startsAt || r.endsAt ? `${fmtDate(r.startsAt) || 'now'} to ${fmtDate(r.endsAt) || 'open'}` : '') },
          { key: 'a', label: '', render: (r) => <>
            <button className="btn sm" onClick={() => setModal(r)}>Edit</button>{' '}
            {r.status === 'PUBLISHED' ? <button className="btn sm" onClick={() => act(r, 'deactivate', 'Deactivated')}>Deactivate</button> : <button className="btn sm primary" onClick={() => act(r, 'publish', 'Published')}>Publish</button>}</> },
        ]} />
      </div>
      {modal && <AnnouncementForm row={modal.id ? modal : null} plans={plans.data?.plans || []} onClose={() => setModal(null)} onDone={() => { toast('Saved as draft. Publish it when ready.'); list.reload() }} />}
    </div>
  )
}

const toLocal = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : '')
function AnnouncementForm({ row, plans, onClose, onDone }) {
  const [v, setV] = useState({ title: row?.title || '', body: row?.body || '', level: row?.level || 'INFO', audience: row?.audience || 'ALL', startsAt: toLocal(row?.startsAt), endsAt: toLocal(row?.endsAt) })
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  async function go(e) {
    e.preventDefault(); setErr('')
    if (!v.title.trim() || !v.body.trim()) { setErr('Write a title and a message.'); return }
    if (v.startsAt && v.endsAt && v.endsAt <= v.startsAt) { setErr('The end must be after the start.'); return }
    setBusy(true)
    try {
      const body = { title: v.title.trim(), body: v.body.trim(), level: v.level, audience: v.audience, startsAt: v.startsAt ? new Date(v.startsAt).toISOString() : null, endsAt: v.endsAt ? new Date(v.endsAt).toISOString() : null }
      if (row) await api.put(`/super-admin/announcements/${row.id}`, body); else await api.post('/super-admin/announcements', body)
      onDone(); onClose()
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={row ? 'Edit announcement' : 'New announcement'} onClose={onClose}>
      <form className="stack" onSubmit={go} noValidate>
        <Field label="Title" htmlFor="an-t"><input id="an-t" className="input" maxLength={160} value={v.title} onChange={set('title')} /></Field>
        <Field label="Message" htmlFor="an-b"><textarea id="an-b" className="textarea" rows={4} maxLength={2000} value={v.body} onChange={set('body')} /></Field>
        <Field label="Level" htmlFor="an-l"><select id="an-l" className="select" value={v.level} onChange={set('level')}><option value="INFO">Information</option><option value="WARNING">Warning</option><option value="CRITICAL">Critical</option></select></Field>
        <Field label="Audience" htmlFor="an-a"><select id="an-a" className="select" value={v.audience} onChange={set('audience')}><option value="ALL">Everyone</option>{plans.map((p) => <option key={p} value={`PLAN:${p}`}>Plan {p}</option>)}</select></Field>
        <Field label="Show from (optional)" htmlFor="an-s" hint="Leave empty to show as soon as it is published."><input id="an-s" className="input" type="datetime-local" value={v.startsAt} onChange={set('startsAt')} /></Field>
        <Field label="Show until (optional)" htmlFor="an-e"><input id="an-e" className="input" type="datetime-local" value={v.endsAt} onChange={set('endsAt')} /></Field>
        {err && <p className="form-error" role="alert">{err}</p>}
        <div className="pt-actions"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  )
}

// ------------------------------------------------------------------ Audit logs
export function AuditLogs() {
  const qy = useQuery({ q: '', action: '', success: '', from: '', to: '' })
  const actions = useLoad(() => api.get('/super-admin/audit-logs/actions'), [])
  const list = useLoad(() => api.get('/super-admin/audit-logs', qy.params), [JSON.stringify(qy.params)])
  const f = qy.f
  return (
    <div className="stack">
      <Head title="Audit logs" sub="Every administrative action and sign-in attempt. Entries cannot be edited or deleted." />
      <FilterBar>
        <input className="input" placeholder="Search admin, reason or target id" aria-label="Search" value={f.q} onChange={(e) => qy.set({ q: e.target.value })} />
        <Select label="Any action" value={f.action} onChange={(v) => qy.set({ action: v })} options={actions.data || []} />
        <Select label="Any result" value={f.success} onChange={(v) => qy.set({ success: v })} options={[{ value: 'true', label: 'Done' }, { value: 'false', label: 'Refused or failed' }]} />
        <input className="input" type="date" aria-label="From" value={f.from} onChange={(e) => qy.set({ from: e.target.value })} />
        <input className="input" type="date" aria-label="To" value={f.to} onChange={(e) => qy.set({ to: e.target.value })} />
      </FilterBar>
      {list.loading && !list.data ? <Loading /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : (
        <div className="pt-card" style={{ padding: 0 }}>
          <DataTable rows={list.data.items} empty="No entries match." columns={[
            { key: 'c', label: 'When', render: (r) => fmtTime(r.createdAt) },
            { key: 'actorEmail', label: 'Admin' },
            { key: 'action', label: 'Action' },
            { key: 't', label: 'Target', render: (r) => `${r.targetType || ''} ${r.targetId ? String(r.targetId).slice(0, 8) : ''}` },
            { key: 'o', label: 'Result', render: (r) => (r.success ? 'Done' : 'Refused') },
            { key: 'reason', label: 'Reason' },
            { key: 'ip', label: 'IP' },
          ]} />
          <div style={{ padding: '0 16px' }}><Pager data={list.data} onPage={(page) => qy.set({ page })} /></div>
        </div>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ Platform settings
export function PlatformSettings() {
  const toast = useToast()
  const s = useLoad(() => api.get('/super-admin/settings'), [])
  const [v, setV] = useState(null)
  if (s.loading) return <Loading />
  if (s.error) return <ErrorBox error={s.error} onRetry={s.reload} />
  const d = s.data, cur = v || { platformName: d.platformName, supportEmail: d.supportEmail, supportPhone: d.supportPhone }
  const set = (k) => (e) => setV({ ...cur, [k]: e.target.value })
  async function save(e) {
    e.preventDefault()
    try { await api.put('/super-admin/settings', cur); toast('Settings saved'); setV(null); s.reload() } catch (x) { toast(x.message, 'error') }
  }
  return (
    <div className="stack" style={{ maxWidth: 640 }}>
      <Head title="Platform settings" sub="Public details only. API keys, passwords and other secrets are never stored or shown here." />
      <form className="pt-card stack" onSubmit={save}>
        <Field label="Platform name" htmlFor="ps-n"><input id="ps-n" className="input" value={cur.platformName} onChange={set('platformName')} /></Field>
        <Field label="Support email" htmlFor="ps-e"><input id="ps-e" className="input" type="email" value={cur.supportEmail} onChange={set('supportEmail')} /></Field>
        <Field label="Support phone" htmlFor="ps-p"><input id="ps-p" className="input" value={cur.supportPhone} onChange={set('supportPhone')} /></Field>
        <button className="btn primary" style={{ justifySelf: 'start' }}>Save</button>
      </form>
      <div className="pt-card stack"><h2>Fixed limits</h2>
        <div className="small">Product picture: {bytes(d.uploadLimits.productImageBytes)} · logo: {bytes(d.uploadLimits.logoBytes)} · request: {d.uploadLimits.requestMax}</div>
        <p className="small muted">{d.uploadLimits.note}</p></div>
    </div>
  )
}

// ------------------------------------------------------------------ Storage
export function Storage() {
  const toast = useToast()
  const o = useLoad(() => api.get('/super-admin/storage/overview'), [])
  const cons = useLoad(() => api.get('/super-admin/storage/consistency'), [])
  const items = useQuery({ status: '', kind: '', storage: '' })
  const list = useLoad(() => api.get('/super-admin/storage/items', items.params), [JSON.stringify(items.params)])
  const [busy, setBusy] = useState('')
  const [result, setResult] = useState(null)
  const [orph, setOrph] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [detail, setDetail] = useState(null)
  if (o.loading) return <Loading />
  if (o.error) return <ErrorBox error={o.error} onRetry={o.reload} />
  const d = o.data, c = d.config
  async function run(key, fn, show) {
    setBusy(key)
    try { const r = await fn(); setResult({ key, r }); if (show) toast(show(r)); o.reload(); list.reload(); cons.reload() } catch (e) { toast(e.message, 'error') } finally { setBusy('') }
  }
  const post = (path) => () => api.post(`/super-admin/storage/${path}`)
  const sum = (k, f) => d.byKind.filter((r) => r[k] === f).reduce((a, r) => a + Number(r.items), 0)
  return (
    <div className="stack">
      <Head title="Storage" sub="Where merchant images live: Cloudflare R2 (new and migrated) or the database (older images)." />
      <div className="pt-card stack">
        <div className="row between wrap"><h2 style={{ margin: 0 }}>Cloudflare R2</h2><Badge s={c.active ? 'APPROVED' : c.configured ? 'PENDING' : 'REJECTED'} /></div>
        {!c.configured && <div className="banner" role="status"><p>Not configured. {c.missing.length > 0 && <>Missing: <b>{c.missing.join(', ')}</b>. </>}{c.problems.join(' ')} Until it is configured every upload stays in the database, exactly as before.</p></div>}
        {c.configured && !c.active && <div className="banner" role="status"><p>Configured, but MEDIA_STORAGE_MODE is {c.mode}, so new images are stored in the database.</p></div>}
        <div className="small">Mode {c.mode} · serving by {c.serveMode === 'PROXY' ? 'proxy through the API' : 'redirect to the image domain'} · bucket {c.bucket || 'not set'} · image domain {c.publicBaseUrl || 'not set'}</div>
        <div className="row wrap"><button className="btn" disabled={busy === 'test'} onClick={() => run('test', post('test-connection'), (r) => r.message)}>{busy === 'test' ? 'Testing…' : 'Test connection'}</button></div>
      </div>
      <div className="kpis">
        <Kpi label="In R2 and verified" value={num(d.r2.verifiedObjects)} hint={`${bytes(d.r2.verifiedOriginalBytes)} of originals (recorded sizes)`} tone="teal" />
        <Kpi label="Waiting to migrate" value={num(d.r2.pending)} hint={`${num(d.undiscovered)} more not yet registered`} tone="warn" />
        <Kpi label="Failed" value={num(d.r2.failed)} hint="Retry below or inspect the reason" tone={d.r2.failed > 0 ? 'warn' : undefined} />
        <Kpi label="Still in database" value={num(Number(d.legacy.productImages) + Number(d.legacy.storeLogos) + Number(d.legacy.invoiceLogos))} hint={bytes(Number(d.legacy.productBytes) + Number(d.legacy.storeLogoBytes) + Number(d.legacy.invoiceLogoBytes))} />
      </div>
      <p className="small muted">{d.usageNote}</p>
      <div className="pt-card stack"><h2>Migration</h2>
        <p className="small">Moves images from the database to R2 in small batches. An image counts as moved only after R2 returns exactly the same size and SHA-256. The original bytes stay in the database; nothing is deleted. You can stop at any time and continue later.</p>
        <div className="row wrap">
          <button className="btn" disabled={!!busy} onClick={() => run('discover', post('migration/discover'), (r) => `${r.registered} images registered`)}>1. Find images</button>
          <button className="btn primary" disabled={!!busy || !c.active} onClick={() => run('batch', post('migration/run?limit=25'), (r) => r.note || `${r.migrated} moved, ${r.failed} failed, ${r.remainingPending} left`)}>{busy === 'batch' ? 'Moving…' : '2. Move next 25'}</button>
          <button className="btn" disabled={!!busy || !c.configured} onClick={() => run('verify', post('migration/verify?limit=100'), (r) => `${r.checked} checked, ${r.bad} problem(s)`)}>Verify moved images</button>
          <button className="btn" disabled={!!busy || !c.configured} onClick={() => run('deep', post('migration/verify?limit=100&deep=true'), (r) => `${r.checked} checked in depth, ${r.bad} problem(s)`)}>Deep verify (SHA-256)</button>
          <button className="btn" disabled={!!busy || d.r2.failed === 0} onClick={() => run('retry', post('migration/retry-failed'), (r) => `${r.requeued} queued again`)}>Retry failed</button>
          <button className="btn danger" disabled={!!busy} onClick={() => setConfirm('rollback')}>Roll back a batch</button>
        </div>
        {result && <pre className="sa-pre">{JSON.stringify(result.r, null, 2)}</pre>}
      </div>
      <div className="pt-card stack"><h2>Consistency</h2>
        {cons.data && <div className="small stack">
          <div>Image records whose image no longer exists: <b>{num(cons.data.productImageRowsWithoutImage)}</b></div>
          <div>Pictures with no bytes and no verified R2 copy (would not display): <b>{num(cons.data.r2OnlyProductImagesWithoutReference)}</b></div>
          <div>Failed images with no database copy to fall back on: <b>{num(cons.data.failedWithoutDatabaseCopy)}</b></div>
          <div className="muted">{cons.data.note}</div></div>}
        <div className="row wrap"><button className="btn" disabled={!c.configured || busy === 'orph'} onClick={() => run('orph', () => api.get('/super-admin/storage/orphans'), () => 'Scan finished').then(() => null)}>Scan for orphan objects</button></div>
        {result?.key === 'orph' && <OrphanList data={result.r} onDelete={(keys) => setConfirm({ orphans: keys })} />}
      </div>
      <div className="pt-card" style={{ padding: 0 }}>
        <div style={{ padding: 16 }}><h2>Recent failures</h2></div>
        <DataTable rows={d.recentFailures} rowKey={(r) => String(r.createdAt) + r.event + r.detail} empty="No failures recorded." columns={[{ key: 'c', label: 'When', render: (r) => fmtTime(r.createdAt) }, { key: 'event', label: 'Event' }, { key: 'kind', label: 'Kind' }, { key: 'detail', label: 'Detail' }]} />
      </div>
      <div className="pt-card" style={{ padding: 0 }}>
        <div style={{ padding: 16 }} className="stack"><h2>Inspect records</h2>
          <FilterBar>
            <Select label="Any status" value={items.f.status} onChange={(v) => items.set({ status: v })} options={['PENDING', 'VERIFIED', 'FAILED']} />
            <Select label="Any kind" value={items.f.kind} onChange={(v) => items.set({ kind: v })} options={['PRODUCT_IMAGE', 'STORE_LOGO', 'INVOICE_LOGO']} />
            <Select label="Any storage" value={items.f.storage} onChange={(v) => items.set({ storage: v })} options={['DB', 'R2']} />
          </FilterBar></div>
        {list.data && <DataTable rows={list.data.items} empty="No records." columns={[
          { key: 'kind', label: 'Kind', render: (r) => label(r.kind) }, { key: 'storage', label: 'Storage' }, { key: 's', label: 'Status', render: (r) => <Badge s={r.status} /> },
          { key: 'size', label: 'Size', right: true, render: (r) => (r.sizeBytes ? bytes(r.sizeBytes) : '') }, { key: 'attempts', label: 'Tries', right: true },
          { key: 'u', label: 'Updated', render: (r) => fmtTime(r.updatedAt) }, { key: 'd', label: '', render: (r) => <button className="btn sm" onClick={() => setDetail(r)}>Details</button> },
        ]} />}
        <div style={{ padding: '0 16px' }}><Pager data={list.data} onPage={(page) => items.set({ page })} /></div>
      </div>
      <div className="pt-card" style={{ padding: 0 }}>
        <div style={{ padding: 16 }}><h2>Recent activity</h2></div>
        <DataTable rows={d.lastActivity} rowKey={(r) => String(r.createdAt) + r.event + r.detail} empty="No activity yet." columns={[{ key: 'c', label: 'When', render: (r) => fmtTime(r.createdAt) }, { key: 'event', label: 'Event' }, { key: 'kind', label: 'Kind' }]} />
      </div>
      {detail && <Modal title="Record details" onClose={() => setDetail(null)}><pre className="sa-pre">{JSON.stringify(detail, null, 2)}</pre></Modal>}
      {confirm === 'rollback' && <Confirm title="Roll back a batch" danger confirmLabel="Roll back 25" message="This switches up to 25 images back to database storage and copies back any image that exists only in R2 (after a SHA-256 check). R2 objects are not deleted. Set MEDIA_STORAGE_MODE=DB first, or the next migration batch will move them again."
        onConfirm={() => { setConfirm(null); run('rollback', post('migration/rollback?limit=25'), (r) => r.note || `${r.migrated} restored, ${r.failed} failed`) }} onClose={() => setConfirm(null)} />}
      {confirm?.orphans && <Confirm title="Delete orphan objects" danger confirmLabel={`Delete ${confirm.orphans.length}`} message={`These ${confirm.orphans.length} objects are in R2 but no record refers to them. Each is checked again just before deletion. This cannot be undone.`}
        onConfirm={() => { const keys = confirm.orphans; setConfirm(null); run('orphdel', () => api.post('/super-admin/storage/orphans/delete', { keys }), (r) => `${r.deleted} deleted`) }} onClose={() => setConfirm(null)} />}
    </div>
  )
}

function OrphanList({ data, onDelete }) {
  const [sel, setSel] = useState([])
  if (!data.keys) return null
  return (
    <div className="stack">
      <p className="small">{data.keys.length} orphan object(s) found{data.truncated ? ' (list cut short)' : ''} · {bytes(data.bytes)} · {num(data.referencedKeys)} keys are in use.</p>
      {data.keys.length > 0 && <>
        <div className="sa-orphans">{data.keys.map((k) => <label key={k} className="row small"><input type="checkbox" checked={sel.includes(k)} onChange={(e) => setSel(e.target.checked ? [...sel, k] : sel.filter((x) => x !== k))} /> <code>{k}</code></label>)}</div>
        <button className="btn danger" disabled={sel.length === 0} onClick={() => onDelete(sel)} style={{ justifySelf: 'start' }}>Delete selected ({sel.length})</button></>}
    </div>
  )
}
