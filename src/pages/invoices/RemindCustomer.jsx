import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, MessageCircle } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { api } from '../../lib/api'
import { Field, Modal, useToast } from '../../components.jsx'
import { TEMPLATES, reminderLink, reminderText, suggestTemplate } from '../../lib/reminders.js'
import { reminderExhausted, reminderUsageText } from '../../lib/entitlements.js'

const newRequestId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `r-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`)

/**
 * Reminder for money a customer owes. The person picks a template, edits the text, then copies it or opens WhatsApp. Nothing is sent from ShopScale.
 * Plans include a monthly number of reminders. Copying or opening WhatsApp asks the server to count one first; if the server says no
 * (plan, or allowance used up) nothing opens and nothing is used. The same reminder counts once however many times it is copied or opened.
 */
export default function RemindCustomer({ customerName, phone, balance, invoiceNumber, dueDate, reviewTo, invoiceId, customerId, onClose }) {
  const { business } = useAuth()
  const toast = useToast()
  const ctx = { customerName, businessName: business?.name, balance, invoiceNumber, dueDate }
  const [key, setKey] = useState(() => suggestTemplate(dueDate))
  const [text, setText] = useState(() => reminderText(suggestTemplate(dueDate), ctx))
  const [usage, setUsage] = useState(null)
  const [busy, setBusy] = useState(false)
  const [refused, setRefused] = useState(null)
  const requestId = useRef(newRequestId())
  const link = useMemo(() => reminderLink(phone, text), [phone, text])

  useEffect(() => { let live = true; api.get('/reminders/usage').then((u) => { if (live) setUsage(u) }).catch(() => {}); return () => { live = false } }, [])

  const pick = (k) => { setKey(k); setText(reminderText(k, ctx)) }
  const notIncluded = !!usage && !usage.included
  const exhausted = reminderExhausted(usage)

  /** Asks the server to count this reminder. Resolves true only when the server accepted it (or had already counted it). */
  async function count() {
    if (!invoiceId && !customerId) return true   // no record to attach it to (should not happen in the app); nothing to count against
    setBusy(true); setRefused(null)
    try {
      const r = await api.post('/reminders', { requestId: requestId.current, invoiceId: invoiceId || undefined, customerId: customerId || undefined })
      setUsage(r.usage)
      return true
    } catch (e) {
      if (e.status === 402) setRefused(e.message)
      else toast(e.message || 'Could not record this reminder. Please try again.', 'error')
      return false
    } finally { setBusy(false) }
  }
  async function copy() {
    if (!(await count())) return
    try { await navigator.clipboard.writeText(text); toast('Message copied') } catch { toast('Could not copy. Select the text and copy it.', 'error') }
  }
  async function openWhatsApp(e) {
    e.preventDefault()
    if (!(await count())) return
    const w = window.open(link, '_blank', 'noopener,noreferrer')
    if (!w) toast('Your browser blocked WhatsApp from opening. Tap Open WhatsApp again; this reminder is already counted once.', 'error')
  }

  const usageText = reminderUsageText(usage)
  return (
    <Modal title="Remind customer" onClose={onClose}>
      <div className="stack">
        <p className="muted small">Choose a message, change it if you like, then open WhatsApp. ShopScale does not send it for you, so you decide when it goes.</p>
        {usageText && <p className="small" role="status"><strong>{usageText}</strong></p>}
        {notIncluded && <div className="banner warn" role="status">WhatsApp invoice reminders are not included in your plan. <Link to="/more/plan" onClick={onClose}><strong>See plans</strong></Link></div>}
        {(refused || exhausted) && <div className="banner warn" role="alert">{refused || 'You have used all your WhatsApp reminders for this billing month.'} <Link to="/more/plan" onClick={onClose}><strong>See plans</strong></Link></div>}
        <div className="chips" role="group" aria-label="Message type">
          {TEMPLATES.map((t) => <button key={t.key} type="button" className={`chip ${key === t.key ? 'on' : ''}`} aria-pressed={key === t.key} onClick={() => pick(t.key)}>{t.label}</button>)}
        </div>
        <Field label="Message" htmlFor="rem-text"><textarea id="rem-text" className="textarea" rows={9} value={text} onChange={(e) => setText(e.target.value)} /></Field>
        {!link && <p className="muted small" role="status">There is no usable phone number saved for this customer, so WhatsApp cannot open. You can still copy the message.</p>}
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <button className="btn" onClick={copy} disabled={busy || notIncluded || exhausted}><Copy size={18} /> Copy message</button>
          {link && <a className="btn primary" href={link} target="_blank" rel="noopener noreferrer" onClick={openWhatsApp} aria-disabled={busy || notIncluded || exhausted}><MessageCircle size={18} /> Open WhatsApp</a>}
          {reviewTo && <Link className="btn" to={reviewTo} onClick={onClose}>Review first</Link>}
        </div>
      </div>
    </Modal>
  )
}
