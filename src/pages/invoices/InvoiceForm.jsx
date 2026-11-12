import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { track } from '../../analytics/analytics.js'
import { ErrorBox, Field, useDebounced, useLoad, useToast } from '../../components.jsx'
import { money } from '../../lib/format.js'
import { previewTotals } from '../../lib/invoiceShare.js'
import { CustomerForm } from '../Customers.jsx'

const blank = () => ({ description: '', quantity: '1', unitPrice: '', discount: '', taxRate: '' })

/** New invoice: by hand, from a sale (?sale=ID) or from an order (?order=ID). The server works out every amount. */
export default function InvoiceForm() {
  const nav = useNavigate()
  const toast = useToast()
  const [sp] = useSearchParams()
  const saleId = sp.get('sale')
  const orderId = sp.get('order')
  const fromSource = !!(saleId || orderId)
  const settings = useLoad(() => api.get('/invoices/settings').catch(() => null), [])
  const [cust, setCust] = useState(null)             // chosen existing customer
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const found = useLoad(() => (dq.length >= 2 && !cust ? api.get('/customers', { q: dq, size: 6 }) : Promise.resolve(null)), [dq, cust])
  const [lines, setLines] = useState([blank()])
  const [invDiscount, setInvDiscount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [terms, setTerms] = useState('')
  const [note, setNote] = useState('')
  const [instructions, setInstructions] = useState('')
  const [addingCustomer, setAddingCustomer] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!settings.data) return
    setTerms((t) => t || settings.data.defaultTerms || '')
    setInstructions((t) => t || settings.data.paymentInstructions || '')
    if (settings.data.defaultTaxRate && Number(settings.data.defaultTaxRate) > 0) setLines((ls) => ls.map((l) => (l.taxRate === '' ? { ...l, taxRate: String(settings.data.defaultTaxRate) } : l)))
  }, [settings.data])

  const totals = previewTotals(lines, invDiscount)
  const setLine = (i, patch) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)))

  async function save() {
    setErr('')
    const body = { dueDate: dueDate || null, paymentTerms: terms || null, note: note || null, paymentInstructions: instructions || null }
    if (saleId) body.sourceSaleId = saleId
    else if (orderId) body.sourceDocumentId = orderId
    else {
      if (!cust && !name.trim()) { setErr('Choose a customer or type a name'); return }
      const items = lines.filter((l) => l.description.trim() || l.unitPrice)
      if (!items.length) { setErr('Add at least one item'); return }
      if (items.some((l) => !l.description.trim() || !(Number(l.quantity) > 0) || l.unitPrice === '')) { setErr('Each item needs a description, quantity and price'); return }
      Object.assign(body, {
        customerId: cust?.id || null, customerName: cust ? null : name.trim(), customerPhone: cust ? null : phone || null,
        invoiceDiscount: invDiscount === '' ? 0 : Number(invDiscount),
        items: items.map((l) => ({ description: l.description.trim(), quantity: Number(l.quantity), unitPrice: Number(l.unitPrice), discount: l.discount === '' ? 0 : Number(l.discount), taxRate: l.taxRate === '' ? 0 : Number(l.taxRate) })),
      })
    }
    setBusy(true)
    try {
      const inv = await api.post('/invoices', body)
      track('invoice_create', { source: saleId ? 'sale' : orderId ? 'order' : 'manual' })
      toast(`Invoice ${inv.number} created`)
      nav(`/more/invoices/${inv.id}`, { replace: true })
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="stack">
      <div className="page-head"><div><h1>New invoice</h1><p className="sub">{fromSource ? `Made from ${saleId ? 'a sale' : 'an order'}. Items and amounts come from the record.` : 'Amounts are checked by the server when you save'}</p></div></div>

      {!fromSource && (
        <div className="section pad stack">
          <h2>Customer</h2>
          {cust ? (
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div><strong>{cust.name}</strong><div className="muted small">{cust.phone || 'No phone'}</div></div>
              <button className="btn sm" onClick={() => setCust(null)}>Change</button>
            </div>
          ) : (
            <>
              <Field label="Find a customer" htmlFor="icq"><input id="icq" className="input" placeholder="Type a name or phone" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
              {found.data?.content?.map((c) => <button key={c.id} className="list-item" onClick={() => { setCust(c); setQ('') }}><div className="grow"><div className="title">{c.name}</div><div className="meta">{c.phone || 'No phone'}</div></div></button>)}
              <div className="muted small">Or invoice someone who is not saved:</div>
              <div className="form-grid two">
                <Field label="Name" htmlFor="icn"><input id="icn" className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label="WhatsApp / phone" htmlFor="icp"><input id="icp" className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
              </div>
              <button className="btn sm" onClick={() => setAddingCustomer(true)}><Plus size={16} /> Save as a new customer</button>
            </>
          )}
        </div>
      )}

      {!fromSource && (
        <div className="section pad stack">
          <h2>Items</h2>
          {lines.map((l, i) => (
            <div key={i} className="stack" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
              <Field label={`Item ${i + 1}`} htmlFor={`d${i}`}><input id={`d${i}`} className="input" placeholder="What are you charging for?" value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} /></Field>
              <div className="form-grid two">
                <Field label="Quantity" htmlFor={`q${i}`}><input id={`q${i}`} className="input" inputMode="decimal" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} /></Field>
                <Field label="Unit price (₦)" htmlFor={`p${i}`}><input id={`p${i}`} className="input" inputMode="decimal" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: e.target.value })} /></Field>
                <Field label="Discount (₦)" htmlFor={`x${i}`}><input id={`x${i}`} className="input" inputMode="decimal" value={l.discount} onChange={(e) => setLine(i, { discount: e.target.value })} /></Field>
                <Field label="Tax (%)" htmlFor={`t${i}`} hint="For example 7.5 for VAT"><input id={`t${i}`} className="input" inputMode="decimal" value={l.taxRate} onChange={(e) => setLine(i, { taxRate: e.target.value })} /></Field>
              </div>
              {lines.length > 1 && <button className="btn sm danger" onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))}><Trash2 size={16} /> Remove item</button>}
            </div>
          ))}
          <button className="btn" onClick={() => setLines((ls) => [...ls, blank()])}><Plus size={18} /> Add another item</button>
          <Field label="Extra discount on the whole invoice (₦)" htmlFor="idisc"><input id="idisc" className="input" inputMode="decimal" value={invDiscount} onChange={(e) => setInvDiscount(e.target.value)} /></Field>
          <div className="kv"><span>Subtotal</span><strong className="num">{money(totals.subtotal)}</strong></div>
          {totals.tax > 0 && <div className="kv"><span>Tax</span><strong className="num">{money(totals.tax)}</strong></div>}
          <div className="kv"><span>Total (confirmed when saved)</span><strong className="num">{money(totals.total)}</strong></div>
        </div>
      )}

      <div className="section pad stack">
        <h2>Terms</h2>
        <div className="form-grid two">
          <Field label="Due date" htmlFor="idue"><input id="idue" className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
          <Field label="Payment terms" htmlFor="iterms"><input id="iterms" className="input" placeholder="e.g. Pay within 14 days" value={terms} onChange={(e) => setTerms(e.target.value)} /></Field>
        </div>
        <Field label="How should they pay?" htmlFor="iins" hint="Bank name, account number, and so on. Saved as the default in invoice settings."><textarea id="iins" className="textarea" value={instructions} onChange={(e) => setInstructions(e.target.value)} /></Field>
        <Field label="Note" htmlFor="inote"><textarea id="inote" className="textarea" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
      {err && <ErrorBox error={{ message: err }} />}
      <button className="btn primary block" disabled={busy} onClick={save}>{busy ? 'Creating…' : 'Create invoice'}</button>
      {addingCustomer && <CustomerForm title="Add customer" initial={{ name, phone }} onClose={() => setAddingCustomer(false)} onSaved={(c) => setCust(c)} />}
    </div>
  )
}
