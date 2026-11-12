import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Ban, CheckCircle2, Download, MessageCircle, Printer, Wallet } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext.jsx'
import { track } from '../../analytics/analytics.js'
import { Confirm, ErrorBox, Field, ListSkeleton, Modal, useLoad, useToast } from '../../components.jsx'
import { dateOnly, dateTime, money } from '../../lib/format.js'
import { STATUS_BADGE, STATUS_LABEL, canShareFile, shareFile, toWaNumber, waLink, waMessage } from '../../lib/invoiceShare.js'

const METHODS = [['CASH', 'Cash'], ['TRANSFER', 'Bank transfer'], ['CARD', 'Card']]

function PaymentModal({ invoice, onClose, onSaved }) {
  const toast = useToast()
  const [amount, setAmount] = useState(String(invoice.balance))
  const [method, setMethod] = useState('TRANSFER')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  // One id per opening of this dialog: a double tap or a retry after a bad network cannot record the payment twice.
  const [requestId] = useState(() => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()))
  async function save() {
    setBusy(true); setErr('')
    try {
      const r = await api.post(`/invoices/${invoice.id}/payments`, { amount: Number(amount), method, note: note || null, clientRequestId: requestId })
      toast('Payment recorded'); onSaved(r); onClose()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Record a payment" onClose={onClose}>
      <p className="muted">Still owed: <strong>{money(invoice.balance)}</strong></p>
      <Field label="Amount (₦)" htmlFor="pamt" error={err}><input id="pamt" className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></Field>
      <Field label="Paid by" htmlFor="pmeth"><select id="pmeth" className="input" value={method} onChange={(e) => setMethod(e.target.value)}>{METHODS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></Field>
      <Field label="Note" htmlFor="pnote"><input id="pnote" className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <button className="btn primary block" disabled={busy || !(Number(amount) > 0)} onClick={save}>{busy ? 'Saving…' : 'Record payment'}</button>
    </Modal>
  )
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const { can, business } = useAuth()
  const toast = useToast()
  const q = useLoad(() => api.get(`/invoices/${id}`), [id])
  const inv = q.data
  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [busy, setBusy] = useState(false)
  const [waState, setWaState] = useState(null)   // null | 'opened' | 'shared'

  if (q.loading) return <ListSkeleton />
  if (q.error) return <ErrorBox error={q.error} onRetry={q.reload} />

  const apply = (r) => q.setData(r)
  const waText = () => waMessage({ businessName: business?.name || 'our business', invoice: inv, link: inv.shareUrl })

  async function pdfBlob() { return api.download(`/invoices/${inv.id}/pdf`) }

  async function download() {
    setBusy(true)
    try {
      const url = URL.createObjectURL(await pdfBlob())
      const a = document.createElement('a'); a.href = url; a.download = `${inv.number}.pdf`; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch (e) { toast(e.message) } finally { setBusy(false) }
  }

  async function print() {
    setBusy(true)
    try {
      const url = URL.createObjectURL(await pdfBlob())
      const w = window.open(url, '_blank')
      if (!w) toast('Allow pop-ups to print, or download the PDF instead')
      else w.addEventListener('load', () => { try { w.print() } catch { /* the PDF viewer has its own print button */ } })
    } catch (e) { toast(e.message) } finally { setBusy(false) }
  }

  // Best route first: hand the real PDF file to the device's share sheet (WhatsApp appears there).
  // Fallback: open WhatsApp with a prepared message that contains a secure download link.
  // Neither tells us the message was actually sent, so the invoice is only marked Sent when the person confirms.
  async function shareWhatsApp() {
    setBusy(true)
    try {
      const file = new File([await pdfBlob()], `${inv.number}.pdf`, { type: 'application/pdf' })
      if (canShareFile(file)) {
        const r = await shareFile(file, { title: `Invoice ${inv.number}`, text: waText() })
        track('invoice_share', { method: 'native' })
        if (r === 'shared') setWaState('shared')
        return
      }
    } catch (e) { toast(e.message || 'Could not prepare the PDF'); setBusy(false); return }
    window.open(waLink(inv.customerPhone, waText()), '_blank', 'noopener')
    track('invoice_share', { method: 'link' })
    setWaState('opened')
    setBusy(false)
  }

  async function markSent() {
    try { apply(await api.post(`/invoices/${inv.id}/sent`)); setWaState(null); toast('Marked as sent') } catch (e) { toast(e.message) }
  }
  async function cancel() {
    setBusy(true)
    try { apply(await api.post(`/invoices/${inv.id}/cancel`)); toast('Invoice cancelled') } catch (e) { toast(e.message) } finally { setBusy(false); setCancelling(false) }
  }

  const hasPhone = !!toWaNumber(inv.customerPhone)
  const cancelled = inv.status === 'CANCELLED'

  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>{inv.number}</h1><p className="sub">{inv.customerName}{inv.customerPhone ? ` · ${inv.customerPhone}` : ''}</p></div>
        <span className={`badge ${STATUS_BADGE[inv.status]}`}>{STATUS_LABEL[inv.status]}</span>
      </div>

      <div className="section pad stack">
        <div className="kv"><span>Issued</span><strong>{dateOnly(inv.issueDate)}</strong></div>
        <div className="kv"><span>Due</span><strong>{inv.dueDate ? dateOnly(inv.dueDate) : 'On receipt'}</strong></div>
        {inv.paymentTerms && <div className="kv"><span>Terms</span><strong>{inv.paymentTerms}</strong></div>}
        {inv.sourceSaleId && <div className="muted small">Made from a sale. What the customer already paid on that sale is counted here and is not recorded twice.</div>}
        {inv.sourceDocumentId && <div className="muted small">Made from an order. To take payment, turn the order into a sale.</div>}
      </div>

      <div className="section list">
        {inv.items.map((l, i) => (
          <div key={i} className="list-item">
            <div className="grow"><div className="title">{l.description}</div><div className="meta">{l.quantity} × {money(l.unitPrice)}{Number(l.discount) > 0 ? ` − ${money(l.discount)}` : ''}{Number(l.taxRate) > 0 ? ` + ${l.taxRate}% tax` : ''}</div></div>
            <strong className="num">{money(l.amount)}</strong>
          </div>
        ))}
      </div>

      <div className="section pad stack">
        <div className="kv"><span>Subtotal</span><strong className="num">{money(inv.subtotal)}</strong></div>
        {Number(inv.tax) > 0 && <div className="kv"><span>Tax</span><strong className="num">{money(inv.tax)}</strong></div>}
        {Number(inv.invoiceDiscount) > 0 && <div className="kv"><span>Discount</span><strong className="num">−{money(inv.invoiceDiscount)}</strong></div>}
        <div className="kv"><span>Total</span><strong className="num">{money(inv.total)}</strong></div>
        <div className="kv"><span>Paid</span><strong className="num">{money(inv.amountPaid)}</strong></div>
        <div className="kv"><span><strong>Balance due</strong></span><strong className="num">{money(inv.balance)}</strong></div>
      </div>

      {!cancelled && (
        <div className="section pad stack">
          <h2>Send to customer</h2>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button className="btn primary" disabled={busy} onClick={shareWhatsApp}><MessageCircle size={18} /> Share via WhatsApp</button>
            <button className="btn" disabled={busy} onClick={download}><Download size={18} /> Download PDF</button>
            <button className="btn" disabled={busy} onClick={print}><Printer size={18} /> Print</button>
          </div>
          {!hasPhone && <p className="muted small">No valid WhatsApp number on this invoice, so WhatsApp will ask you to choose the contact.</p>}
          <p className="muted small">On phones that support it, the PDF itself is shared. Otherwise WhatsApp opens with a message and a secure link, because WhatsApp links cannot attach files.</p>
          {waState && inv.status === 'DRAFT' && can('CUSTOMER_INVOICES_MANAGE') && (
            <div className="banner">
              {waState === 'shared' ? 'The share sheet was opened.' : 'WhatsApp was opened with the message.'} We cannot see whether you sent it. Did you send it?{' '}
              <button className="btn sm" onClick={markSent}><CheckCircle2 size={16} /> Yes, mark as sent</button>
            </div>
          )}
          {inv.status === 'DRAFT' && can('CUSTOMER_INVOICES_MANAGE') && !waState && <button className="btn sm" onClick={markSent}>Mark as sent</button>}
        </div>
      )}

      {inv.payments.length > 0 && (
        <div className="section list">
          <div className="pad"><h2>Payments</h2></div>
          {inv.payments.map((p) => <div key={p.id} className="list-item"><div className="grow"><div className="title">{money(p.amount)} · {p.method.toLowerCase()}</div><div className="meta">{dateTime(p.createdAt)}{p.note ? ` · ${p.note}` : ''}</div></div></div>)}
        </div>
      )}

      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        {inv.canRecordPayments && can('CUSTOMER_INVOICES_PAYMENT_RECORD') && <button className="btn primary" onClick={() => setPaying(true)}><Wallet size={18} /> Record payment</button>}
        {!cancelled && can('CUSTOMER_INVOICES_MANAGE') && inv.payments.length === 0 && inv.status !== 'PAID' && <button className="btn danger" onClick={() => setCancelling(true)}><Ban size={18} /> Cancel invoice</button>}
      </div>

      {inv.note && <div className="section pad"><h2>Note</h2><p>{inv.note}</p></div>}
      {paying && <PaymentModal invoice={inv} onClose={() => setPaying(false)} onSaved={apply} />}
      {cancelling && <Confirm title="Cancel this invoice?" message="The invoice stops being valid and its share link stops working. You cannot undo this." confirmLabel="Cancel invoice" danger busy={busy} onConfirm={cancel} onClose={() => setCancelling(false)} />}
    </div>
  )
}
