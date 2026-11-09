import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Copy, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Confirm, Empty, ErrorBox, Field, ListSkeleton, Modal, useLoad, useToast } from '../components.jsx'
import { dateOnly, dateTime } from '../lib/format.js'
import { groupPermissions, roleGrantable } from '../lib/permissions.js'

const toRef = (role) => (role.system ? { role: role.role, roleId: null } : { role: 'CUSTOM', roleId: role.id })

function Preview({ keys, catalogue }) {
  const groups = groupPermissions(keys, catalogue || [])
  if (groups.length === 0) return <p className="muted small">No access selected.</p>
  return (
    <div className="stack-sm" aria-label="What this role can do">
      {groups.map((g) => (
        <div key={g.module}><strong className="small">{g.module}</strong><div>{g.items.map((p) => <span className="perm-chip" key={p.key}>{p.label}</span>)}</div></div>
      ))}
    </div>
  )
}

function RoleSelect({ roles, mine, value, onChange, id }) {
  const options = roles.filter((r) => r.role !== 'OWNER' && roleGrantable([...mine], r))
  return (
    <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled>Choose a role</option>
      {options.map((r) => <option key={r.key} value={r.key}>{r.name}{r.system ? '' : ' (custom)'}</option>)}
    </select>
  )
}

function InviteModal({ roles, catalogue, mine, onClose, onDone }) {
  const toast = useToast()
  const [f, setF] = useState({ fullName: '', email: '', phone: '', roleKey: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const role = roles.find((r) => r.key === f.roleKey)

  async function send() {
    const errs = {}
    if (!f.fullName.trim()) errs.fullName = 'Enter their name'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) errs.email = 'Enter a valid email address'
    if (!role) errs.role = 'Choose a role'
    setErrors(errs); setFormError('')
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const r = await api.post('/team/invitations', { fullName: f.fullName, email: f.email, phone: f.phone || null, ...toRef(role) })
      setResult(r); onDone()
    } catch (e) { setFormError(e.message) } finally { setBusy(false) }
  }

  if (result) {
    return (
      <Modal title="Invitation created" onClose={onClose}>
        {result.emailSent
          ? <div className="banner">We emailed {result.invitation.email}. The link works once and expires on {dateOnly(result.invitation.expiresAt)}.</div>
          : <div className="banner warn">Email sending is not set up on this server yet, so nothing was emailed. Copy the link below and send it to {result.invitation.fullName} yourself (WhatsApp works well). It works once and expires on {dateOnly(result.invitation.expiresAt)}.</div>}
        <div className="copy-box"><span className="grow">{result.inviteLink}</span>
          <button className="btn sm" onClick={() => { navigator.clipboard?.writeText(result.inviteLink); toast('Link copied') }}><Copy size={16} /> Copy</button></div>
        <p className="muted small">Only share this link with {result.invitation.fullName}. You will not be able to see it again, but you can resend to make a new one.</p>
        <button className="btn primary block" onClick={onClose}>Done</button>
      </Modal>
    )
  }
  return (
    <Modal title="Add team member" onClose={onClose}>
      <Field label="Name" htmlFor="iname" error={errors.fullName}><input id="iname" className="input" value={f.fullName} autoFocus onChange={(e) => setF({ ...f, fullName: e.target.value })} /></Field>
      <Field label="Email" htmlFor="imail" error={errors.email}><input id="imail" className="input" type="email" inputMode="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <Field label="Phone (optional)" htmlFor="iphone"><input id="iphone" className="input" type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
      <Field label="Role" htmlFor="irole" error={errors.role} hint="You can only give roles that have no more access than you have."><RoleSelect id="irole" roles={roles} mine={mine} value={f.roleKey} onChange={(v) => setF({ ...f, roleKey: v })} /></Field>
      {role && <><p className="muted small">{role.description}</p><Preview keys={role.permissions} catalogue={catalogue} /></>}
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <button className="btn primary block" onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send invitation'}</button>
    </Modal>
  )
}

function ChangeRole({ member, roles, catalogue, mine, onClose, onDone }) {
  const toast = useToast()
  const current = roles.find((r) => (r.system ? r.role === member.role : r.id === member.roleId))
  const [key, setKey] = useState(current?.key || '')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const role = roles.find((r) => r.key === key)
  async function save() {
    if (!role) { setErr('Choose a role'); return }
    setBusy(true); setErr('')
    try { await api.put(`/team/members/${member.membershipId}/role`, toRef(role)); toast('Role updated'); onDone(); onClose() }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={`Change role · ${member.fullName}`} onClose={onClose}>
      <Field label="New role" htmlFor="crole" error={err}><RoleSelect id="crole" roles={roles} mine={mine} value={key} onChange={setKey} /></Field>
      {role && <><p className="muted small">After saving, {member.fullName.split(' ')[0]} will be able to:</p><Preview keys={role.permissions} catalogue={catalogue} /></>}
      <button className="btn primary block" onClick={save} disabled={busy || key === current?.key}>{busy ? 'Saving…' : 'Save role'}</button>
    </Modal>
  )
}

export function RoleEditor({ role, roles, catalogue, mine, onClose, onDone }) {
  const toast = useToast()
  const [name, setName] = useState(role?.name || '')
  const [description, setDescription] = useState(role?.description || '')
  const [perms, setPerms] = useState(new Set(role?.permissions || []))
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const toggle = (k) => setPerms((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n })
  const toggleGroup = (g, on) => setPerms((s) => { const n = new Set(s); g.permissions.filter((p) => mine.has(p.key)).forEach((p) => (on ? n.add(p.key) : n.delete(p.key))); return n })

  async function save() {
    if (!name.trim()) { setErr('Give the role a name'); return }
    if (perms.size === 0) { setErr('Choose at least one permission'); return }
    setBusy(true); setErr('')
    try {
      const body = { name, description: description || null, permissions: [...perms] }
      if (role?.id) await api.put(`/team/roles/${role.id}`, body); else await api.post('/team/roles', body)
      toast('Role saved'); onDone(); onClose()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={role?.id ? 'Edit role' : 'Create a role'} onClose={onClose}>
      {!role?.id && roles && (
        <Field label="Start from (optional)" htmlFor="rstart"><select id="rstart" className="select" defaultValue="" onChange={(e) => { const r = roles.find((x) => x.key === e.target.value); if (r) { setPerms(new Set(r.permissions.filter((p) => mine.has(p)))); setDescription(r.description || '') } }}>
          <option value="">Empty role</option>{roles.filter((r) => r.role !== 'OWNER').map((r) => <option key={r.key} value={r.key}>Copy of {r.name}</option>)}</select></Field>
      )}
      <Field label="Role name" htmlFor="rname"><input id="rname" className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="What is this role for?" htmlFor="rdesc"><input id="rdesc" className="input" value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} /></Field>
      <p className="muted small">You can only turn on permissions that you have yourself.</p>
      {catalogue.map((g) => {
        const grantable = g.permissions.filter((p) => mine.has(p.key))
        const allOn = grantable.length > 0 && grantable.every((p) => perms.has(p.key))
        return (
          <fieldset className="perm-group" key={g.module}>
            <legend>{g.module}</legend>
            {grantable.length > 0 && <button type="button" className="btn sm" onClick={() => toggleGroup(g, !allOn)}>{allOn ? 'Clear all' : 'Select all'}</button>}
            <div className="perm-list">
              {g.permissions.map((p) => (
                <label className="check" key={p.key}><input type="checkbox" checked={perms.has(p.key)} disabled={!mine.has(p.key)} onChange={() => toggle(p.key)} /><span>{p.label}</span></label>
              ))}
            </div>
          </fieldset>
        )
      })}
      {err && <p className="form-error" role="alert">{err}</p>}
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save role'}</button>
    </Modal>
  )
}

export default function Team() {
  const { can, permissions: mine, user } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('members')
  const members = useLoad(() => api.get('/team/members'), [])
  const invites = useLoad(() => api.get('/team/invitations'), [])
  const roles = useLoad(() => api.get('/team/roles'), [])
  const catalogue = useLoad(() => api.get('/team/permissions'), [])
  const [modal, setModal] = useState(null)   // {type, ...}
  const [busy, setBusy] = useState(false)
  const refresh = () => { members.reload(); invites.reload(); roles.reload() }
  const ready = roles.data && catalogue.data

  async function run(fn, okMsg) {
    setBusy(true)
    try { await fn(); toast(okMsg); setModal(null); refresh() } catch (e) { toast(e.message, 'error'); setModal(null) } finally { setBusy(false) }
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div className="row"><Link to="/more" className="icon-btn" aria-label="Back"><ArrowLeft size={20} /></Link><div><h1>Team</h1><p className="sub">Who can do what in your business</p></div></div>
        {can('TEAM_INVITE') && ready && <button className="btn primary" onClick={() => setModal({ type: 'invite' })}><Plus size={18} /> Add</button>}
      </div>
      <div className="tabs" role="tablist" aria-label="Team">
        {[['members', 'People'], ['invitations', 'Invitations'], ['roles', 'Roles']].map(([id, label]) => (
          <button key={id} role="tab" className="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>))}
      </div>
      <ErrorBox error={members.error || invites.error || roles.error || catalogue.error} onRetry={refresh} />

      {tab === 'members' && (
        <>
          {members.loading && <ListSkeleton />}
          {members.data && (
            <div className="section list">
              {members.data.map((m) => {
                const me = m.userId === user.id
                return (
                  <div className="list-item" key={m.membershipId} style={{ cursor: 'default', alignItems: 'flex-start' }}>
                    <div className="grow">
                      <div className="title">{m.fullName}{me && <span className="muted"> (you)</span>}</div>
                      <div className="meta">{m.email}{m.phone ? ` · ${m.phone}` : ''}</div>
                      <div className="meta">Joined {dateOnly(m.joinedAt)}{m.lastActiveAt ? ` · Last active ${dateTime(m.lastActiveAt)}` : ''}</div>
                      <div className="row wrap" style={{ marginTop: 8 }}>
                        <span className={`badge ${m.owner ? 'teal' : ''}`}>{m.roleName}</span>
                        {!m.active && <span className="badge gray">Access removed</span>}
                        {!m.owner && !me && can('TEAM_ASSIGN_ROLES') && ready && <button className="btn sm" onClick={() => setModal({ type: 'role', member: m })}>Change role</button>}
                        {!m.owner && !me && can('TEAM_DEACTIVATE') && (m.active
                          ? <button className="btn sm danger" onClick={() => setModal({ type: 'deactivate', member: m })}>Remove access</button>
                          : <button className="btn sm" onClick={() => setModal({ type: 'reactivate', member: m })}>Restore access</button>)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'invitations' && (
        <>
          {invites.loading && <ListSkeleton rows={2} />}
          {invites.data && invites.data.length === 0 && <div className="section"><Empty title="No invitations yet">Add a team member and they will get a link to join.</Empty></div>}
          {invites.data && invites.data.length > 0 && (
            <div className="section list">
              {invites.data.map((i) => (
                <div className="list-item" key={i.id} style={{ cursor: 'default', alignItems: 'flex-start' }}>
                  <div className="grow">
                    <div className="title">{i.fullName}</div><div className="meta">{i.email} · {i.roleName}</div>
                    <div className="meta">Sent {dateOnly(i.createdAt)} · {i.emailSent ? 'emailed' : 'link not emailed'}{i.status === 'PENDING' ? ` · expires ${dateOnly(i.expiresAt)}` : ''}</div>
                    <div className="row wrap" style={{ marginTop: 8 }}>
                      <span className={`badge ${i.status === 'ACCEPTED' ? 'ok' : i.status === 'PENDING' ? '' : 'gray'}`}>{{ PENDING: 'Waiting', ACCEPTED: 'Joined', REVOKED: 'Cancelled', EXPIRED: 'Expired' }[i.status]}</span>
                      {can('TEAM_INVITE') && (i.status === 'PENDING' || i.status === 'EXPIRED') && <button className="btn sm" disabled={busy} onClick={async () => { try { const r = await api.post(`/team/invitations/${i.id}/resend`); invites.reload(); setModal({ type: 'link', result: r }) } catch (e) { toast(e.message, 'error') } }}>Resend</button>}
                      {can('TEAM_INVITE') && i.status === 'PENDING' && <button className="btn sm danger" onClick={() => setModal({ type: 'revoke', invitation: i })}>Cancel</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'roles' && (
        <>
          {can('ROLES_CREATE') && ready && <button className="btn" onClick={() => setModal({ type: 'role-edit', role: null })}><Plus size={18} /> Create a role</button>}
          {roles.loading && <ListSkeleton rows={4} />}
          {roles.data && (
            <div className="section list">
              {roles.data.map((r) => (
                <div className="list-item" key={r.key} style={{ cursor: 'default', alignItems: 'flex-start' }}>
                  <div className="grow">
                    <div className="title">{r.name} {!r.system && <span className="badge teal">Custom</span>}</div>
                    <div className="meta">{r.description || 'No description'}</div>
                    <div className="meta">{r.permissions.length} permissions · {r.memberCount} {r.memberCount === 1 ? 'person' : 'people'}</div>
                    <div className="row wrap" style={{ marginTop: 8 }}>
                      <button className="btn sm" onClick={() => setModal({ type: 'role-view', role: r })}>See access</button>
                      {!r.system && can('PERMISSIONS_MANAGE') && ready && <button className="btn sm" onClick={() => setModal({ type: 'role-edit', role: r })}>Edit</button>}
                      {!r.system && can('PERMISSIONS_MANAGE') && <button className="btn sm danger" onClick={() => setModal({ type: 'role-delete', role: r })}>Delete</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {modal?.type === 'invite' && <InviteModal roles={roles.data} catalogue={catalogue.data} mine={mine} onClose={() => setModal(null)} onDone={refresh} />}
      {modal?.type === 'link' && (
        <Modal title="New invitation link" onClose={() => setModal(null)}>
          {modal.result.emailSent ? <div className="banner">We emailed a fresh link. The old one no longer works.</div>
            : <div className="banner warn">Nothing was emailed because email is not set up on this server. Copy this link and send it yourself. The old link no longer works.</div>}
          <div className="copy-box"><span className="grow">{modal.result.inviteLink}</span><button className="btn sm" onClick={() => { navigator.clipboard?.writeText(modal.result.inviteLink); toast('Link copied') }}><Copy size={16} /> Copy</button></div>
          <button className="btn primary block" onClick={() => setModal(null)}>Done</button>
        </Modal>
      )}
      {modal?.type === 'role' && <ChangeRole member={modal.member} roles={roles.data} catalogue={catalogue.data} mine={mine} onClose={() => setModal(null)} onDone={refresh} />}
      {modal?.type === 'deactivate' && <Confirm title={`Remove ${modal.member.fullName}'s access?`} danger busy={busy} confirmLabel="Remove access"
        message="They will be signed out of this business straight away and cannot use it until you restore access. Their past sales and records stay." onConfirm={() => run(() => api.post(`/team/members/${modal.member.membershipId}/deactivate`), 'Access removed')} onClose={() => setModal(null)} />}
      {modal?.type === 'reactivate' && <Confirm title={`Restore ${modal.member.fullName}'s access?`} busy={busy} confirmLabel="Restore"
        message={`They will be able to use this business again as ${modal.member.roleName}.`} onConfirm={() => run(() => api.post(`/team/members/${modal.member.membershipId}/reactivate`), 'Access restored')} onClose={() => setModal(null)} />}
      {modal?.type === 'revoke' && <Confirm title="Cancel this invitation?" danger busy={busy} confirmLabel="Cancel invitation"
        message={`The link sent to ${modal.invitation.email} will stop working.`} onConfirm={() => run(() => api.post(`/team/invitations/${modal.invitation.id}/revoke`), 'Invitation cancelled')} onClose={() => setModal(null)} />}
      {modal?.type === 'role-view' && <Modal title={modal.role.name} onClose={() => setModal(null)}><p className="muted">{modal.role.description}</p><Preview keys={modal.role.permissions} catalogue={catalogue.data} />
        {can('ROLES_CREATE') && <button className="btn block" onClick={() => setModal({ type: 'role-edit', role: { ...modal.role, id: null, name: `${modal.role.name} copy` } })}>Copy as a custom role</button>}</Modal>}
      {modal?.type === 'role-edit' && <RoleEditor role={modal.role} roles={roles.data} catalogue={catalogue.data} mine={mine} onClose={() => setModal(null)} onDone={refresh} />}
      {modal?.type === 'role-delete' && <Confirm title={`Delete "${modal.role.name}"?`} danger busy={busy} confirmLabel="Delete role"
        message="This only works if nobody is using the role." onConfirm={() => run(() => api.del(`/team/roles/${modal.role.id}`), 'Role deleted')} onClose={() => setModal(null)} />}
    </div>
  )
}
