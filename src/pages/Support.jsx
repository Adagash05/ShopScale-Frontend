import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../lib/api'
import { Empty, ErrorBox, Field, ListSkeleton, useLoad, useToast } from '../components.jsx'

const CATS = [['BILLING', 'Billing and plan'], ['ACCOUNT', 'My account'], ['STORE', 'Online store'], ['PAYMENTS', 'Payments'], ['INVENTORY', 'Stock'], ['SALES', 'Sales'], ['BUG', 'Something is broken'], ['OTHER', 'Other']]
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '')
const STATUS = { OPEN: 'Open', IN_PROGRESS: 'We are working on it', WAITING_FOR_CUSTOMER: 'Waiting for your reply', RESOLVED: 'Resolved', CLOSED: 'Closed' }

/** Contact the ShopScale team from inside the app and follow the replies. */
export default function Support() {
  const toast = useToast()
  const list = useLoad(() => api.get('/support/tickets'), [])
  const [open, setOpen] = useState(null)
  const [form, setForm] = useState(null)
  return (
    <div className="stack">
      <div className="page-head"><div className="row"><Link to="/more" className="icon-btn" aria-label="Back"><ArrowLeft size={20} /></Link><div><h1>Support</h1><p className="sub">Ask the ShopScale Team for help</p></div></div>
        <button className="btn primary" onClick={() => setForm({ subject: '', description: '', category: 'OTHER', priority: 'NORMAL' })}>New request</button></div>
      {form && <NewTicket form={form} setForm={setForm} onDone={() => { toast('Request sent'); setForm(null); list.reload() }} />}
      {open ? <Thread id={open} onBack={() => { setOpen(null); list.reload() }} />
        : list.loading ? <ListSkeleton rows={3} /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} />
        : list.data.length === 0 ? <Empty title="No requests yet">Tell us what you need and we will reply here.</Empty>
        : <div className="section list">{list.data.map((t) => <button key={t.id} className="list-item" onClick={() => setOpen(t.id)}><div><div className="title">{t.subject}</div><div className="meta">{STATUS[t.status] || t.status} · updated {when(t.updatedAt)}</div></div></button>)}</div>}
    </div>
  )
}

function NewTicket({ form, setForm, onDone }) {
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  async function go(e) {
    e.preventDefault(); setErr('')
    if (form.subject.trim().length < 3) { setErr('Give your request a short title.'); return }
    if (form.description.trim().length < 10) { setErr('Describe what you need in a sentence or two.'); return }
    setBusy(true)
    try { await api.post('/support/tickets', { ...form, subject: form.subject.trim(), description: form.description.trim() }); onDone() } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <form className="section pad stack" onSubmit={go} noValidate>
      <Field label="Title" htmlFor="sp-s"><input id="sp-s" className="input" maxLength={200} value={form.subject} onChange={set('subject')} /></Field>
      <Field label="What is it about?" htmlFor="sp-c"><select id="sp-c" className="select" value={form.category} onChange={set('category')}>{CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
      <Field label="Details" htmlFor="sp-d"><textarea id="sp-d" className="textarea" rows={4} maxLength={4000} value={form.description} onChange={set('description')} /></Field>
      {err && <p className="form-error" role="alert">{err}</p>}
      <div className="row"><button className="btn primary" disabled={busy}>{busy ? 'Sending…' : 'Send'}</button><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button></div>
    </form>
  )
}

function Thread({ id, onBack }) {
  const toast = useToast()
  const d = useLoad(() => api.get(`/support/tickets/${id}`), [id])
  const [body, setBody] = useState(''), [busy, setBusy] = useState(false)
  async function send(e) {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    try { await api.post(`/support/tickets/${id}/reply`, { body: body.trim() }); setBody(''); d.reload() } catch (x) { toast(x.message, 'error') } finally { setBusy(false) }
  }
  if (d.loading) return <ListSkeleton rows={3} />
  if (d.error) return <ErrorBox error={d.error} onRetry={d.reload} />
  const t = d.data.ticket
  return (
    <div className="stack">
      <button className="btn sm" onClick={onBack} style={{ justifySelf: 'start' }}>Back to requests</button>
      <div className="section pad stack-sm"><strong>{t.subject}</strong><div className="muted small">{STATUS[t.status] || t.status} · opened {when(t.createdAt)}</div><p style={{ whiteSpace: 'pre-wrap' }}>{t.description}</p>{t.resolution && <p><b>Resolution:</b> {t.resolution}</p>}</div>
      {d.data.notes.map((n) => <div key={n.id} className="section pad stack-sm"><div className="muted small">{n.fromYou ? 'You' : 'ShopScale'} · {when(n.createdAt)}</div><p style={{ whiteSpace: 'pre-wrap' }}>{n.body}</p></div>)}
      {t.status !== 'CLOSED' && <form className="stack" onSubmit={send}><textarea className="textarea" rows={3} aria-label="Reply" maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} /><button className="btn primary" disabled={busy || !body.trim()} style={{ justifySelf: 'start' }}>{busy ? 'Sending…' : 'Send reply'}</button></form>}
    </div>
  )
}
