import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Empty, ErrorBox, Field, ListSkeleton, Modal, useLoad, useToast } from '../../components.jsx'
import { money, qtyText } from '../../lib/format.js'
import ItemPicker from '../restaurant/ItemPicker.jsx'

function PackageForm({ pkg, onClose, onDone }) {
  const toast = useToast()
  const [f, setF] = useState({
    name: pkg?.name || '', description: pkg?.description || '', inclusions: pkg?.inclusions || '', basePrice: String(pkg?.basePrice ?? '0'), pricePerGuest: String(pkg?.pricePerGuest ?? ''),
    minGuests: String(pkg?.minGuests ?? 1), active: pkg ? pkg.active : true,
    lines: (pkg?.lines || []).map((l) => ({ variantId: l.variantId, name: l.name, unit: l.unit, qty: String(l.qtyPerGuest) })),
  })
  const [adding, setAdding] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save() {
    if (!f.name.trim()) { setError('Give the package a name'); return }
    if (!(Number(f.pricePerGuest) > 0) && !(Number(f.basePrice) > 0)) { setError('Set a price per guest or a fixed price'); return }
    if (f.lines.some((l) => !(Number(l.qty) > 0))) { setError('Every ingredient needs a quantity per guest'); return }
    setBusy(true); setError('')
    const body = { name: f.name.trim(), description: f.description || null, inclusions: f.inclusions || null, basePrice: Number(f.basePrice) || 0, pricePerGuest: Number(f.pricePerGuest) || 0,
      minGuests: Number(f.minGuests) || 1, active: f.active, lines: f.lines.map((l) => ({ variantId: l.variantId, qtyPerGuest: Number(l.qty) })) }
    try {
      if (pkg) await api.put(`/catering/packages/${pkg.id}`, body); else await api.post('/catering/packages', body)
      toast('Package saved'); onDone(); onClose()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={pkg ? 'Edit package' : 'New package'} onClose={onClose}>
      <Field label="Package name" htmlFor="pk-name"><input id="pk-name" className="input" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Short description" htmlFor="pk-desc"><input id="pk-desc" className="input" maxLength={1000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="What is included" htmlFor="pk-inc" hint="For example: jollof rice, fried chicken, plantain, soft drinks"><textarea id="pk-inc" className="textarea" rows={3} maxLength={2000} value={f.inclusions} onChange={(e) => setF({ ...f, inclusions: e.target.value })} /></Field>
      <div className="form-grid two">
        <Field label="Price per guest (₦)" htmlFor="pk-pg"><input id="pk-pg" className="input" type="number" inputMode="decimal" min="0" value={f.pricePerGuest} onChange={(e) => setF({ ...f, pricePerGuest: e.target.value })} /></Field>
        <Field label="Fixed price (₦)" htmlFor="pk-base" hint="Added once, on top of per-guest pricing"><input id="pk-base" className="input" type="number" inputMode="decimal" min="0" value={f.basePrice} onChange={(e) => setF({ ...f, basePrice: e.target.value })} /></Field>
      </div>
      <Field label="Minimum guests" htmlFor="pk-min" hint="Smaller events are charged for this many guests"><input id="pk-min" className="input" type="number" min="1" value={f.minGuests} onChange={(e) => setF({ ...f, minGuests: e.target.value })} /></Field>
      <section className="stack-sm">
        <strong>Ingredients per guest</strong>
        <span className="muted">Used to plan what to buy and take out of stock. A menu item with a recipe uses its ingredients.</span>
        {f.lines.map((l, i) => (
          <div className="row" key={l.variantId}>
            <div className="grow">{l.name}</div>
            <input className="input" style={{ maxWidth: 110 }} type="number" inputMode="decimal" min="0" aria-label={`${l.name} per guest`} placeholder={l.unit} value={l.qty} onChange={(e) => setF({ ...f, lines: f.lines.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)) })} />
            <button className="icon-btn" aria-label={`Remove ${l.name}`} onClick={() => setF({ ...f, lines: f.lines.filter((_, j) => j !== i) })}><Trash2 size={18} /></button>
          </div>
        ))}
        {adding === null ? <button className="btn sm" onClick={() => setAdding('')}><Plus size={16} /> Add ingredient or dish</button>
          : <ItemPicker value={null} id="pk-line" label="Search ingredient or dish" onChange={(id, m) => { if (id && !f.lines.some((l) => l.variantId === id)) setF({ ...f, lines: [...f.lines, { variantId: id, name: m.name, unit: m.unit, qty: '' }] }); setAdding(null) }} />}
      </section>
      {pkg && <label className="row"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /><span>Offer this package to customers</span></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save package'}</button>
    </Modal>
  )
}

function ServiceForm({ service, onClose, onDone }) {
  const toast = useToast()
  const [f, setF] = useState({ name: service?.name || '', description: service?.description || '', price: String(service?.price ?? ''), basis: service?.basis || 'FIXED', active: service ? service.active : true })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save() {
    if (!f.name.trim()) { setError('Give the service a name'); return }
    if (!(Number(f.price) >= 0) || f.price === '') { setError('Enter the price'); return }
    setBusy(true); setError('')
    const body = { name: f.name.trim(), description: f.description || null, price: Number(f.price), basis: f.basis, active: f.active }
    try {
      if (service) await api.put(`/catering/services/${service.id}`, body); else await api.post('/catering/services', body)
      toast('Service saved'); onDone(); onClose()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={service ? 'Edit service' : 'New service'} onClose={onClose}>
      <Field label="Service" htmlFor="sv-name" hint="For example Waiters, Tent and chairs, Delivery, Live cooking"><input id="sv-name" className="input" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Details (optional)" htmlFor="sv-desc"><input id="sv-desc" className="input" maxLength={500} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="Price (₦)" htmlFor="sv-price"><input id="sv-price" className="input" type="number" inputMode="decimal" min="0" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
      <div className="seg" role="group" aria-label="Charged">
        <button className={`chip ${f.basis === 'FIXED' ? 'on' : ''}`} aria-pressed={f.basis === 'FIXED'} onClick={() => setF({ ...f, basis: 'FIXED' })}>One price</button>
        <button className={`chip ${f.basis === 'PER_GUEST' ? 'on' : ''}`} aria-pressed={f.basis === 'PER_GUEST'} onClick={() => setF({ ...f, basis: 'PER_GUEST' })}>Per guest</button>
      </div>
      {service && <label className="row"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /><span>Offer this service</span></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save service'}</button>
    </Modal>
  )
}

export default function Packages() {
  const { can } = useAuth()
  const manage = can('CATERING_MANAGE')
  const pkgs = useLoad(() => api.get('/catering/packages', { all: true }), [])
  const svcs = useLoad(() => api.get('/catering/services', { all: true }), [])
  const [dlg, setDlg] = useState(null)
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Packages and services</h1><p className="sub">What you offer and what it costs</p></div></div>
      <section className="section">
        <div className="row between" style={{ padding: '12px 16px' }}><h2 style={{ margin: 0 }}>Packages</h2>{manage && <button className="btn primary sm" onClick={() => setDlg({ kind: 'pkg' })}><Plus size={16} /> New package</button>}</div>
        <ErrorBox error={pkgs.error} onRetry={pkgs.reload} />
        {pkgs.loading && <ListSkeleton rows={2} />}
        {pkgs.data && pkgs.data.length === 0 && <Empty title="No packages yet">A package is a menu you sell per guest, for example "Wedding Gold".</Empty>}
        <div className="list">
          {(pkgs.data || []).map((p) => (
            <div className="list-item" key={p.id} style={{ cursor: 'default', alignItems: 'flex-start' }}>
              <div className="grow">
                <div className="title">{p.name} {!p.active && <span className="badge gray">Not offered</span>}</div>
                <div className="meta">{Number(p.pricePerGuest) > 0 ? `${money(p.pricePerGuest)} per guest` : ''}{Number(p.basePrice) > 0 ? `${Number(p.pricePerGuest) > 0 ? ' + ' : ''}${money(p.basePrice)} fixed` : ''} · from {p.minGuests} guests</div>
                {p.inclusions && <div className="meta">{p.inclusions}</div>}
                {p.lines.length > 0 && <div className="meta">Ingredient cost about {money(p.costPerGuest)} per guest ({p.lines.map((l) => `${l.name} ${qtyText(l.qtyPerGuest)}`).join(', ')})</div>}
              </div>
              {manage && <button className="btn sm" onClick={() => setDlg({ kind: 'pkg', pkg: p })}>Edit</button>}
            </div>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="row between" style={{ padding: '12px 16px' }}><h2 style={{ margin: 0 }}>Additional services</h2>{manage && <button className="btn primary sm" onClick={() => setDlg({ kind: 'svc' })}><Plus size={16} /> New service</button>}</div>
        <ErrorBox error={svcs.error} onRetry={svcs.reload} />
        {svcs.loading && <ListSkeleton rows={2} />}
        {svcs.data && svcs.data.length === 0 && <Empty title="No services yet">Add extras customers can choose, like waiters, chairs or delivery.</Empty>}
        <div className="list">
          {(svcs.data || []).map((s) => (
            <div className="list-item" key={s.id} style={{ cursor: 'default' }}>
              <div className="grow"><div className="title">{s.name} {!s.active && <span className="badge gray">Not offered</span>}</div><div className="meta">{money(s.price)}{s.basis === 'PER_GUEST' ? ' per guest' : ''}{s.description ? ` · ${s.description}` : ''}</div></div>
              {manage && <button className="btn sm" onClick={() => setDlg({ kind: 'svc', service: s })}>Edit</button>}
            </div>
          ))}
        </div>
      </section>
      {dlg?.kind === 'pkg' && <PackageForm pkg={dlg.pkg} onClose={() => setDlg(null)} onDone={pkgs.reload} />}
      {dlg?.kind === 'svc' && <ServiceForm service={dlg.service} onClose={() => setDlg(null)} onDone={svcs.reload} />}
    </div>
  )
}
