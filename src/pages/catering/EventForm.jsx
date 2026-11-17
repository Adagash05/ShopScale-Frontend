import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../../lib/api'
import { Field, ErrorBox, ListSkeleton, useDebounced, useLoad, useToast } from '../../components.jsx'
import { money } from '../../lib/format.js'

const today = () => new Date().toISOString().slice(0, 10)

export default function EventForm() {
  const { id } = useParams()
  const editing = !!id
  const nav = useNavigate()
  const toast = useToast()
  const pk = useLoad(() => api.get('/catering/packages'), [])
  const sv = useLoad(() => api.get('/catering/services'), [])
  const existing = useLoad(() => (editing ? api.get(`/catering/events/${id}`) : Promise.resolve(null)), [id])
  const [f, setF] = useState({ title: '', customerName: '', customerPhone: '', customerId: null, venue: '', eventDate: '', startTime: '', guests: '50', requirements: '', packageId: '', discount: '', depositRequired: '', quoteValidUntil: '' })
  const [picked, setPicked] = useState({})
  const [quote, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState('')
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const found = useLoad(() => (dq.length >= 2 ? api.get('/customers', { q: dq, size: 6 }) : Promise.resolve(null)), [dq])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loadedFor, setLoadedFor] = useState(null)

  useEffect(() => {
    const e = existing.data
    if (!e || loadedFor === e.id) return
    setLoadedFor(e.id)
    setF({ title: e.title, customerName: e.customerName, customerPhone: e.customerPhone || '', customerId: e.customerId, venue: e.venue || '', eventDate: e.eventDate, startTime: e.startTime ? e.startTime.slice(0, 5) : '', guests: String(e.guests), requirements: e.requirements || '',
      packageId: e.packageId || '', discount: e.quote ? String(e.quote.discount) : '', depositRequired: e.depositRequired != null ? String(e.depositRequired) : '', quoteValidUntil: e.quoteValidUntil || '' })
    setPicked(Object.fromEntries((e.quote?.services || []).map((s) => [s.id, s.quantity])))
  }, [existing.data, loadedFor])

  const services = Object.entries(picked).map(([serviceId, quantity]) => ({ serviceId, quantity: Number(quantity) || 1 }))
  const guests = Number(f.guests)
  const key = JSON.stringify([f.packageId, guests, services, f.discount])
  const dkey = useDebounced(key, 400)
  useEffect(() => {
    if (!(guests >= 1)) { setQuote(null); return }
    let live = true
    api.post('/catering/quote-preview', { packageId: f.packageId || null, guests, services, discount: Number(f.discount) || 0 }).then((r) => { if (live) { setQuote(r); setQuoteError('') } }, (e) => { if (live) { setQuote(null); setQuoteError(e.message) } })
    return () => { live = false }
  }, [dkey]) // eslint-disable-line react-hooks/exhaustive-deps

  async function save(e) {
    e.preventDefault()
    if (!f.title.trim()) { setError('Give the event a name, for example "Ade wedding reception"'); return }
    if (!f.customerName.trim() && !f.customerId) { setError('Enter the customer\'s name'); return }
    if (!f.eventDate) { setError('Choose the event date'); return }
    if (!(guests >= 1)) { setError('Enter the number of guests'); return }
    setBusy(true); setError('')
    const body = { title: f.title.trim(), customerId: f.customerId, customerName: f.customerName.trim() || null, customerPhone: f.customerPhone.trim() || null, venue: f.venue || null, eventDate: f.eventDate, startTime: f.startTime || null,
      guests, requirements: f.requirements || null, packageId: f.packageId || null, services, discount: Number(f.discount) || 0, depositRequired: Number(f.depositRequired) || 0, quoteValidUntil: f.quoteValidUntil || null }
    try {
      const res = editing ? await api.put(`/catering/events/${id}`, body) : await api.post('/catering/events', body)
      toast(editing ? 'Event saved' : 'Enquiry saved')
      nav(`/events/${res.id}`)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  if (editing && existing.loading) return <ListSkeleton />
  if (editing && existing.error) return <ErrorBox error={existing.error} onRetry={existing.reload} />
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <form className="stack" onSubmit={save} noValidate>
      <div className="page-head"><div className="row"><Link to={editing ? `/events/${id}` : '/events'} className="icon-btn" aria-label="Back"><ArrowLeft size={20} /></Link><h1>{editing ? 'Edit event' : 'New enquiry'}</h1></div></div>
      <div className="section pad form-grid">
        <Field label="Event name" htmlFor="ev-title"><input id="ev-title" className="input" autoFocus={!editing} maxLength={150} value={f.title} onChange={set('title')} /></Field>
        {f.customerId ? (
          <div className="row"><strong className="grow">{f.customerName}</strong><button type="button" className="btn sm" onClick={() => setF({ ...f, customerId: null })}>Not this customer</button></div>
        ) : (
          <>
            <Field label="Find an existing customer (optional)" htmlFor="ev-find"><input id="ev-find" className="input" placeholder="Search by name or phone" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
            {(found.data?.content || []).map((c) => <button type="button" key={c.id} className="btn block" onClick={() => { setF({ ...f, customerId: c.id, customerName: c.name, customerPhone: c.phone || '' }); setQ('') }}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</button>)}
            <div className="form-grid two">
              <Field label="Customer name" htmlFor="ev-cname"><input id="ev-cname" className="input" maxLength={150} value={f.customerName} onChange={set('customerName')} /></Field>
              <Field label="Phone" htmlFor="ev-cphone"><input id="ev-cphone" className="input" inputMode="tel" maxLength={40} value={f.customerPhone} onChange={set('customerPhone')} /></Field>
            </div>
          </>
        )}
        <div className="form-grid two">
          <Field label="Event date" htmlFor="ev-date"><input id="ev-date" className="input" type="date" min={editing ? undefined : today()} value={f.eventDate} onChange={set('eventDate')} /></Field>
          <Field label="Start time" htmlFor="ev-time"><input id="ev-time" className="input" type="time" value={f.startTime} onChange={set('startTime')} /></Field>
        </div>
        <div className="form-grid two">
          <Field label="Expected guests" htmlFor="ev-guests"><input id="ev-guests" className="input" type="number" inputMode="numeric" min="1" value={f.guests} onChange={set('guests')} /></Field>
          <Field label="Venue" htmlFor="ev-venue"><input id="ev-venue" className="input" maxLength={250} value={f.venue} onChange={set('venue')} /></Field>
        </div>
        <Field label="Requirements" htmlFor="ev-req" hint="Allergies, theme, serving style, timing"><textarea id="ev-req" className="textarea" rows={3} maxLength={2000} value={f.requirements} onChange={set('requirements')} /></Field>
      </div>

      <div className="section pad form-grid">
        <h2 style={{ margin: 0 }}>Price</h2>
        <Field label="Package" htmlFor="ev-pkg">
          <select id="ev-pkg" className="select" value={f.packageId} onChange={set('packageId')} disabled={existing.data?.status === 'BOOKED'}>
            <option value="">No package (services only)</option>
            {(pk.data || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        {(sv.data || []).length > 0 && (
          <fieldset className="stack-sm" style={{ border: 0, padding: 0 }}>
            <legend><strong>Additional services</strong></legend>
            {sv.data.map((s) => {
              const on = picked[s.id] != null
              return (
                <div className="row" key={s.id}>
                  <label className="row grow"><input type="checkbox" checked={on} onChange={() => { const n = { ...picked }; if (on) delete n[s.id]; else n[s.id] = 1; setPicked(n) }} /><span>{s.name} <span className="muted">{money(s.price)}{s.basis === 'PER_GUEST' ? ' per guest' : ''}</span></span></label>
                  {on && <input className="input" style={{ maxWidth: 80 }} type="number" min="1" aria-label={`Quantity of ${s.name}`} value={picked[s.id]} onChange={(e) => setPicked({ ...picked, [s.id]: e.target.value })} />}
                </div>
              )
            })}
          </fieldset>
        )}
        <div className="form-grid two">
          <Field label="Discount (₦)" htmlFor="ev-disc"><input id="ev-disc" className="input" type="number" inputMode="decimal" min="0" value={f.discount} onChange={set('discount')} /></Field>
          <Field label="Deposit needed to confirm (₦)" htmlFor="ev-dep"><input id="ev-dep" className="input" type="number" inputMode="decimal" min="0" value={f.depositRequired} onChange={set('depositRequired')} /></Field>
        </div>
        <Field label="Quotation valid until" htmlFor="ev-valid" hint="Leave empty for 14 days after you send it"><input id="ev-valid" className="input" type="date" value={f.quoteValidUntil} onChange={set('quoteValidUntil')} /></Field>
        {quoteError && <div className="banner warn" role="alert">{quoteError}</div>}
        {quote && (
          <div className="section" aria-live="polite">
            {f.packageId && <div className="kv"><span className="k">Package ({quote.billedGuests} guests charged)</span><span className="v num">{money(quote.packageTotal)}</span></div>}
            {quote.services.map((s) => <div className="kv" key={s.id}><span className="k">{s.name}{s.quantity > 1 ? ` × ${s.quantity}` : ''}</span><span className="v num">{money(s.lineTotal)}</span></div>)}
            {Number(quote.discount) > 0 && <div className="kv"><span className="k">Discount</span><span className="v num">-{money(quote.discount)}</span></div>}
            <div className="kv"><span className="k"><strong>Total</strong></span><span className="v num">{money(quote.total)}</span></div>
          </div>
        )}
        <p className="muted">The final price is always worked out again when you save.</p>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn primary block" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Save enquiry'}</button>
    </form>
  )
}
