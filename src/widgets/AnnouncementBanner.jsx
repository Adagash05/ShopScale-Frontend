import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const KEY = 'shopscale.announcements.dismissed'
const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || [] } catch { return [] } }
const write = (v) => { try { sessionStorage.setItem(KEY, JSON.stringify(v)) } catch { /* private mode: dismissal lasts until reload */ } }

/** Notices from the ShopScale team. Shown while published and inside their window; a critical notice cannot be dismissed. A failure to load is silent: it is never worth blocking the app. */
export default function AnnouncementBanner() {
  const [items, setItems] = useState([])
  const [gone, setGone] = useState(read)
  useEffect(() => {
    let live = true
    api.get('/announcements/active').then((r) => { if (live && Array.isArray(r)) setItems(r) }, () => {})
    return () => { live = false }
  }, [])
  const shown = items.filter((a) => a.level === 'CRITICAL' || !gone.includes(a.id))
  if (shown.length === 0) return null
  return (
    <div className="stack-sm" aria-label="Announcements">
      {shown.map((a) => (
        <div key={a.id} className={`banner ${a.level === 'CRITICAL' ? 'danger' : a.level === 'WARNING' ? 'warn' : ''}`} role={a.level === 'CRITICAL' ? 'alert' : 'status'}>
          <p><b>{a.title}</b> {a.body}</p>
          {a.level !== 'CRITICAL' && <button className="btn sm" onClick={() => { const n = [...gone, a.id]; setGone(n); write(n) }}>Dismiss</button>}
        </div>
      ))}
    </div>
  )
}
