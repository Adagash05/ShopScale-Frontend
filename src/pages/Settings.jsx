import { useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Field, useToast } from '../components.jsx'

export default function Settings() {
  const { business, updateBusiness, can } = useAuth()
  const toast = useToast()
  const [f, setF] = useState({
    name: business.name, subtype: business.subtype || '', phone: business.phone || '', email: business.email || '',
    address: business.address || '', description: business.description || '', allowNegativeStock: business.allowNegativeStock,
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const isOwner = can('SETTINGS_EDIT')

  async function save(e) {
    e.preventDefault()
    if (!f.name.trim()) { setErr('Enter your business name'); return }
    setBusy(true); setErr('')
    try {
      const b = await api.put('/businesses/current', { ...f, subtype: f.subtype || null, phone: f.phone || null, email: f.email || null, address: f.address || null, description: f.description || null, timezone: business.timezone })
      updateBusiness(b); toast('Settings saved')
    } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }

  return (
    <form className="stack" onSubmit={save} noValidate>
      <div className="page-head"><div><h1>Business settings</h1></div></div>
      {!isOwner && <div className="banner">You do not have permission to change these settings.</div>}
      <fieldset disabled={!isOwner} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="section pad form-grid">
          <Field label="Business name" htmlFor="sname" error={err}><input id="sname" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Kind of business" htmlFor="ssub"><input id="ssub" className="input" value={f.subtype} onChange={(e) => setF({ ...f, subtype: e.target.value })} /></Field>
          <div className="form-grid two">
            <Field label="Phone" htmlFor="sphone"><input id="sphone" className="input" type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="Email" htmlFor="semail"><input id="semail" className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          </div>
          <Field label="Address" htmlFor="saddr"><input id="saddr" className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
          <Field label="About your business" htmlFor="sdesc"><textarea id="sdesc" className="textarea" value={f.description} maxLength={1000} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <label className="check"><input type="checkbox" checked={f.allowNegativeStock} onChange={(e) => setF({ ...f, allowNegativeStock: e.target.checked })} />
            <span><strong>Let me sell items even when my stock count says zero</strong><br /><span className="muted small">Useful if you sometimes sell before you update stock. Stock can then go below zero.</span></span></label>
        </div>
      </fieldset>
      <div className="section pad"><div className="muted small">Store address</div><div className="num">{window.location.origin}/s/{business.slug}</div><p className="muted small" style={{ marginTop: 6 }}>Open and manage your online store from More, Online store (Essential plan and above).</p></div>
      {isOwner && <button className="btn primary block" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>}
    </form>
  )
}
