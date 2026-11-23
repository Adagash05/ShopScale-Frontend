import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, MessageCircle } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Field, Modal, useToast } from '../../components.jsx'
import { TEMPLATES, reminderLink, reminderText, suggestTemplate } from '../../lib/reminders.js'

/** Reminder for money a customer owes. The person picks a template, edits the text, then copies it or opens WhatsApp. Nothing is sent from ShopScale. */
export default function RemindCustomer({ customerName, phone, balance, invoiceNumber, dueDate, reviewTo, onClose }) {
  const { business } = useAuth()
  const toast = useToast()
  const ctx = { customerName, businessName: business?.name, balance, invoiceNumber, dueDate }
  const [key, setKey] = useState(() => suggestTemplate(dueDate))
  const [text, setText] = useState(() => reminderText(suggestTemplate(dueDate), ctx))
  const link = useMemo(() => reminderLink(phone, text), [phone, text])

  const pick = (k) => { setKey(k); setText(reminderText(k, ctx)) }
  async function copy() {
    try { await navigator.clipboard.writeText(text); toast('Message copied') } catch { toast('Could not copy. Select the text and copy it.', 'error') }
  }

  return (
    <Modal title="Remind customer" onClose={onClose}>
      <div className="stack">
        <p className="muted small">Choose a message, change it if you like, then open WhatsApp. ShopScale does not send it for you, so you decide when it goes.</p>
        <div className="chips" role="group" aria-label="Message type">
          {TEMPLATES.map((t) => <button key={t.key} type="button" className={`chip ${key === t.key ? 'on' : ''}`} aria-pressed={key === t.key} onClick={() => pick(t.key)}>{t.label}</button>)}
        </div>
        <Field label="Message" htmlFor="rem-text"><textarea id="rem-text" className="textarea" rows={9} value={text} onChange={(e) => setText(e.target.value)} /></Field>
        {!link && <p className="muted small" role="status">There is no usable phone number saved for this customer, so WhatsApp cannot open. You can still copy the message.</p>}
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <button className="btn" onClick={copy}><Copy size={18} /> Copy message</button>
          {link && <a className="btn primary" href={link} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /> Open WhatsApp</a>}
          {reviewTo && <Link className="btn" to={reviewTo} onClick={onClose}>Review first</Link>}
        </div>
      </div>
    </Modal>
  )
}
