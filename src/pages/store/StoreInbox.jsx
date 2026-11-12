import { useState } from 'react'
import { api } from '../../lib/api'
import { dateTime } from '../../lib/format.js'
import { Empty, ErrorBox, ListSkeleton, useLoad, useToast } from '../../components.jsx'

const TABS = [['reviews', 'Reviews'], ['enquiries', 'Enquiries'], ['subscribers', 'Subscribers']]
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

/** Everything customers send through the online store that is not an order: reviews to approve, catering enquiries, newsletter sign-ups. */
export default function StoreInbox() {
  const [tab, setTab] = useState('reviews')
  const list = useLoad(() => api.get(`/store/${tab}`), [tab])
  const toast = useToast()
  const [busy, setBusy] = useState('')

  async function act(path, ok) {
    setBusy(path)
    try { await api.post(path); toast(ok); list.reload() } catch (e) { toast(e.message, 'error') } finally { setBusy('') }
  }
  async function copyEmails() {
    const text = (list.data || []).map((s) => s.email).join(', ')
    try { await navigator.clipboard.writeText(text); toast('Emails copied') } catch { toast('Could not copy. Select the addresses instead.', 'error') }
  }

  return (
    <div className="stack">
      <div className="page-head"><div><h1>Store inbox</h1><p className="sub">What customers send you from your online store</p></div></div>
      <div className="chips">{TABS.map(([k, label]) => <button key={k} className={`chip ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{label}</button>)}</div>
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && !list.data && <ListSkeleton />}

      {tab === 'reviews' && list.data && (list.data.length === 0 ? <div className="section"><Empty title="No reviews yet">Customers can review an item after you complete their order. You approve each review before it appears in your store.</Empty></div> : (
        <div className="section list">
          {list.data.map((r) => (
            <div className="list-row" key={r.id} style={{ alignItems: 'flex-start' }}>
              <div className="grow">
                <div><b>{r.product}</b> <span aria-label={`${r.rating} out of 5`} style={{ color: '#b7791f' }}>{stars(r.rating)}</span></div>
                <p style={{ margin: '4px 0' }}>{r.body}</p>
                <span className="muted small">{r.author} · {dateTime(r.createdAt)}</span>
              </div>
              <div className="stack-sm" style={{ alignItems: 'flex-end' }}>
                <span className={`badge ${r.status === 'APPROVED' ? 'ok' : r.status === 'HIDDEN' ? 'gray' : 'warn'}`}>{r.status === 'APPROVED' ? 'Showing' : r.status === 'HIDDEN' ? 'Hidden' : 'Waiting'}</span>
                {r.status !== 'APPROVED' && <button className="btn sm primary" disabled={!!busy} onClick={() => act(`/store/reviews/${r.id}/status/APPROVED`, 'Review is now showing')}>Approve</button>}
                {r.status !== 'HIDDEN' && <button className="btn sm" disabled={!!busy} onClick={() => act(`/store/reviews/${r.id}/status/HIDDEN`, 'Review hidden')}>Hide</button>}
              </div>
            </div>
          ))}
        </div>
      ))}

      {tab === 'enquiries' && list.data && (list.data.length === 0 ? <div className="section"><Empty title="No enquiries yet">Catering stores show an enquiry form. Requests appear here and in your notifications.</Empty></div> : (
        <div className="section list">
          {list.data.map((e) => (
            <div className="list-row" key={e.id} style={{ alignItems: 'flex-start' }}>
              <div className="grow">
                <div><b>{e.name}</b> <span className={`badge ${e.status === 'NEW' ? 'warn' : e.status === 'CLOSED' ? 'gray' : 'ok'}`}>{e.status === 'NEW' ? 'New' : e.status === 'CONTACTED' ? 'Contacted' : 'Closed'}</span></div>
                <div className="muted small"><a href={`tel:${e.phone.replace(/\s+/g, '')}`}>{e.phone}</a>{e.email ? <> · <a href={`mailto:${e.email}`}>{e.email}</a></> : null}</div>
                {(e.eventDate || e.guests) && <div className="small">{e.eventDate ? `Event ${e.eventDate}` : ''}{e.eventDate && e.guests ? ' · ' : ''}{e.guests ? `${e.guests} guests` : ''}</div>}
                <p style={{ margin: '6px 0', whiteSpace: 'pre-line' }}>{e.message}</p>
                <span className="muted small">{dateTime(e.createdAt)}</span>
              </div>
              <div className="stack-sm">
                {e.status === 'NEW' && <button className="btn sm primary" disabled={!!busy} onClick={() => act(`/store/enquiries/${e.id}/status/CONTACTED`, 'Marked as contacted')}>Mark contacted</button>}
                {e.status !== 'CLOSED' && <button className="btn sm" disabled={!!busy} onClick={() => act(`/store/enquiries/${e.id}/status/CLOSED`, 'Closed')}>Close</button>}
                {e.status === 'CLOSED' && <button className="btn sm" disabled={!!busy} onClick={() => act(`/store/enquiries/${e.id}/status/NEW`, 'Reopened')}>Reopen</button>}
              </div>
            </div>
          ))}
        </div>
      ))}

      {tab === 'subscribers' && list.data && (list.data.length === 0 ? <div className="section"><Empty title="No subscribers yet">Customers can join your list from the footer of your online store.</Empty></div> : (
        <>
          <div className="row"><span className="muted">{list.data.length} subscriber{list.data.length === 1 ? '' : 's'}</span><button className="btn sm" onClick={copyEmails}>Copy all emails</button></div>
          <div className="section list">
            {list.data.map((s) => <div className="list-row" key={s.email}><div className="grow">{s.email}</div><span className="muted small">{dateTime(s.createdAt)}</span></div>)}
          </div>
        </>
      ))}
    </div>
  )
}
