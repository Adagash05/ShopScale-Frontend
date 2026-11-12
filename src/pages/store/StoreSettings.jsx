import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { ErrorBox, Field, Skeleton, useLoad, useToast } from '../../components.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import StoreProfile from '../../widgets/StoreProfile.jsx'

export default function StoreSettings() {
  const { can } = useAuth()
  const toast = useToast()
  const s = useLoad(() => api.get('/store/settings'), [])
  const [f, setF] = useState(null)
  const [keys, setKeys] = useState({ publicKey: '', secretKey: '' })
  const [domain, setDomain] = useState('')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => { if (s.data) { setF({ ...s.data }); setDomain(s.data.customDomain || '') } }, [s.data])

  if (s.error) return <ErrorBox error={s.error} onRetry={s.reload} />
  if (!f) return <Skeleton height={200} />
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  async function run(name, fn, ok) {
    setBusy(name); setErr('')
    try { const d = await fn(); s.setData(d); toast(ok) } catch (e) { setErr(e.message); toast(e.message, 'error') } finally { setBusy('') }
  }
  const save = (e) => { e.preventDefault(); return run('save', () => api.put('/store/settings', { enabled: !!f.enabled, title: f.title, description: f.description, phone: f.phone, whatsapp: f.whatsapp, pickupEnabled: !!f.pickupEnabled, deliveryEnabled: !!f.deliveryEnabled, deliveryFee: Number(f.deliveryFee || 0), deliveryNote: f.deliveryNote, payLaterEnabled: !!f.payLaterEnabled }), 'Store settings saved') }

  if (!s.data.available) return (
    <div className="stack"><div className="page-head"><div><h1>Online store</h1></div></div>
      <div className="banner">The online store is not included in your current plan. <Link to="/more/plan">See plans</Link></div></div>
  )
  const edit = can('STORE_EDIT')
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Online store</h1><p className="sub">{s.data.enabled ? 'Open for orders' : 'Closed'}</p></div></div>
      {err && <div className="banner danger" role="alert">{err}</div>}
      <form className="stack" onSubmit={save}>
        <fieldset disabled={!edit} style={{ border: 0, padding: 0, margin: 0 }}>
          <div className="section pad form-grid">
            <label className="check"><input type="checkbox" checked={!!f.enabled} onChange={set('enabled')} /><span><strong>Open my store to customers</strong><br /><span className="muted small">{s.data.storeUrl}</span></span></label>
            <Field label="Store name" htmlFor="st1"><input id="st1" className="input" value={f.title || ''} onChange={set('title')} /></Field>
            <Field label="Short description" htmlFor="st2"><textarea id="st2" className="textarea" maxLength={500} value={f.description || ''} onChange={set('description')} /></Field>
            <div className="form-grid two">
              <Field label="Phone" htmlFor="st3"><input id="st3" className="input" type="tel" value={f.phone || ''} onChange={set('phone')} /></Field>
              <Field label="WhatsApp" htmlFor="st4"><input id="st4" className="input" type="tel" value={f.whatsapp || ''} onChange={set('whatsapp')} /></Field>
            </div>
            <label className="check"><input type="checkbox" checked={!!f.pickupEnabled} onChange={set('pickupEnabled')} /><span>Customers can pick up</span></label>
            <label className="check"><input type="checkbox" checked={!!f.deliveryEnabled} onChange={set('deliveryEnabled')} /><span>I deliver</span></label>
            {f.deliveryEnabled && <div className="form-grid two">
              <Field label="Delivery fee (₦)" htmlFor="st5"><input id="st5" className="input" inputMode="decimal" value={f.deliveryFee ?? 0} onChange={set('deliveryFee')} /></Field>
              <Field label="Delivery note" htmlFor="st6"><input id="st6" className="input" value={f.deliveryNote || ''} onChange={set('deliveryNote')} /></Field>
            </div>}
            <label className="check"><input type="checkbox" checked={!!f.payLaterEnabled} onChange={set('payLaterEnabled')} /><span>Customers can pay on pickup or delivery</span></label>
          </div>
        </fieldset>
        {edit && <button className="btn primary block" disabled={busy === 'save'}>{busy === 'save' ? 'Saving…' : 'Save store settings'}</button>}
      </form>

      <StoreProfile canEdit={edit} />

      <section className="section pad stack">
        <h2>Online payments (your Paystack account)</h2>
        <p className="muted small">Customer payments go straight to <b>your own</b> Paystack account. ShopScale never holds your money.</p>
        {!s.data.encryptionConfigured && <div className="banner danger">This server is missing its encryption key, so payment keys cannot be saved yet. Contact support.</div>}
        {s.data.paystackConnected ? (
          <>
            <div className="kv"><span className="k">Connected</span><span className="badge ok">{s.data.paystackTestMode ? 'Test keys' : 'Live keys'}</span></div>
            <div className="kv"><span className="k">Public key</span><span className="v">{s.data.paystackPublicKey}</span></div>
            <div className="banner">In your Paystack dashboard open <b>Settings, API Keys and Webhooks</b> and set the Webhook URL to:<br /><code style={{ wordBreak: 'break-all' }}>{s.data.webhookUrl}</code></div>
            {can('STORE_PAYMENTS_MANAGE') && <button className="btn danger" disabled={!!busy} onClick={() => window.confirm('Disconnect Paystack? Customers will no longer be able to pay online.') && run('dc', () => api.del('/store/paystack'), 'Disconnected')}>Disconnect Paystack</button>}
          </>
        ) : can('STORE_PAYMENTS_MANAGE') ? (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); run('pk', () => api.put('/store/paystack', keys), 'Paystack connected').then(() => setKeys({ publicKey: '', secretKey: '' })) }}>
            <Field label="Public key (pk_…)" htmlFor="pk1"><input id="pk1" className="input" value={keys.publicKey} autoComplete="off" onChange={(e) => setKeys({ ...keys, publicKey: e.target.value })} /></Field>
            <Field label="Secret key (sk_…)" htmlFor="pk2" hint="Stored encrypted. It is never shown again."><input id="pk2" className="input" type="password" value={keys.secretKey} autoComplete="off" onChange={(e) => setKeys({ ...keys, secretKey: e.target.value })} /></Field>
            <button className="btn primary" disabled={!!busy || !s.data.encryptionConfigured}>{busy === 'pk' ? 'Checking keys…' : 'Connect Paystack'}</button>
          </form>
        ) : <p className="muted">Ask the owner to connect Paystack.</p>}
      </section>

      <section className="section pad stack">
        <h2>Custom domain</h2>
        {!s.data.customDomainAvailable ? <p className="muted">Custom domains are included in the Business plan. <Link to="/more/plan">See plans</Link></p> : (
          <>
            <Field label="Your domain" htmlFor="dm1" hint="For example shop.yourbusiness.com"><input id="dm1" className="input" value={domain} onChange={(e) => setDomain(e.target.value)} /></Field>
            <div className="row wrap"><button className="btn" disabled={!!busy || !domain} onClick={() => run('dm', () => api.put('/store/domain', { domain }), 'Domain saved')}>Save domain</button>
              {s.data.customDomain && <button className="btn" disabled={!!busy} onClick={() => run('dv', () => api.post('/store/domain/verify'), 'Domain verified')}>Check verification</button>}
              {s.data.customDomain && <button className="btn danger" disabled={!!busy} onClick={() => run('dr', () => api.del('/store/domain'), 'Domain removed')}>Remove</button>}</div>
            {s.data.customDomain && (
              <div className="banner">Add these records at your domain provider:<br />1. <b>CNAME</b> {s.data.customDomain} → {s.data.domainTarget}<br />2. <b>TXT</b> _shopscale-verify.{s.data.customDomain} → <code>{s.data.domainToken}</code><br />Status: {s.data.domainVerified ? 'verified' : 'not verified yet'}</div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
