import { track } from '../analytics/analytics.js'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../lib/api'
import { Empty, ErrorBox, Field, ListSkeleton, Modal, useLoad, useToast } from '../components.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

function BranchForm({ initial, onClose, onSaved }) {
  const toast = useToast()
  const [f, setF] = useState({ name: initial?.name || '', address: initial?.address || '', phone: initial?.phone || '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    if (!f.name.trim()) { setErr('Enter a name for this location'); return }
    setBusy(true); setErr('')
    const body = { name: f.name, address: f.address || null, phone: f.phone || null }
    try {
      initial ? await api.put(`/branches/${initial.id}`, body) : await api.post('/branches', body)
      if (!initial) track('branch_create')
      toast('Location saved'); onSaved(); onClose()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={initial ? 'Edit location' : 'Add location'} onClose={onClose}>
      <Field label="Name" htmlFor="bname" error={err}><input id="bname" className="input" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Address" htmlFor="baddr"><input id="baddr" className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
      <Field label="Phone" htmlFor="bphone"><input id="bphone" className="input" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save location'}</button>
    </Modal>
  )
}

export default function Branches() {
  const { can } = useAuth()
  const toast = useToast()
  const owner = can('LOCATIONS_MANAGE')
  const list = useLoad(() => api.get('/branches'), [])
  const [editing, setEditing] = useState(null) // null | 'new' | branch
  async function toggle(b) {
    try { await api.post(`/branches/${b.id}/${b.active ? 'deactivate' : 'activate'}`); list.reload() } catch (e) { toast(e.message) }
  }
  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Locations</h1><p className="sub">Your shops, kitchens and warehouses</p></div>
        {owner && <button className="btn primary" onClick={() => setEditing('new')}><Plus size={18} /> Add location</button>}
      </div>
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && <ListSkeleton />}
      {list.data && list.data.length === 0 && <div className="section"><Empty title="No locations yet" /></div>}
      {list.data && list.data.length > 0 && (
        <div className="section list">
          {list.data.map((b) => (
            <div key={b.id} className="list-item">
              <div className="grow">
                <div className="title">{b.name} {b.main && <span className="badge">Main</span>} {!b.active && <span className="badge warn">Switched off</span>}</div>
                <div className="meta">{b.address || 'No address'}{b.phone ? ` · ${b.phone}` : ''}</div>
              </div>
              {owner && <button className="btn" onClick={() => setEditing(b)}>Edit</button>}
              {owner && !b.main && <button className="btn" onClick={() => toggle(b)}>{b.active ? 'Switch off' : 'Switch on'}</button>}
            </div>
          ))}
        </div>
      )}
      {editing && <BranchForm initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={list.reload} />}
    </div>
  )
}
