import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Empty, useToast } from '../components.jsx'
import { discardExpense, discardSale, listExpenses, listSales, retryExpense, retrySale, syncAll } from '../lib/offlineQueue.js'
import { dateTime, money, qtyText } from '../lib/format.js'
import { useOnline } from '../pwa/useOnline.js'
import { useSyncStatus } from '../lib/useOfflineSync.js'

const LABEL = {
  PENDING: ['Saved on this device', 'warn'],
  SYNCING: ['Sending…', 'warn'],
  FAILED: ['Refused by the server', 'danger'],
  SYNCED: ['Confirmed by the server', 'ok'],
}

export default function PendingSales() {
  const { business } = useAuth()
  const toast = useToast()
  const online = useOnline()
  const [rows, setRows] = useState(null)
  const [busy, setBusy] = useState(false)
  const [exp, setExp] = useState(null)
  const st = useSyncStatus()
  const load = () => { listSales(business.id).then(setRows); listExpenses(business.id).then(setExp) }
  useEffect(() => {
    load()
    window.addEventListener('shopscale:queue', load)
    return () => window.removeEventListener('shopscale:queue', load)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.id])

  async function syncNow() {
    setBusy(true)
    try { const r = await syncAll(business.id); toast(r.stopped === 'network' ? 'Still offline. Your sales are safe on this device.' : r.sent ? `${r.sent} confirmed` : 'Nothing to send') } finally { setBusy(false) }
  }
  async function discard(r) {
    if (!window.confirm('Discard this sale? It was never recorded on the server, and the stock was not reduced.')) return
    await discardSale(r.clientRequestId)
  }
  void api
  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Records saved on this device</h1><p className="sub">{online ? 'Online' : 'Offline'} · {st.running ? `Sending ${st.done}/${st.total}…` : st.lastSync ? `Last successful sync ${dateTime(st.lastSync)}` : 'Not synced yet'} · a record is only real once the server confirms it</p></div>
        <button className="btn primary" disabled={busy || !online} onClick={syncNow}>{busy ? 'Sending…' : 'Send now'}</button>
      </div>
      {rows && rows.length === 0 && exp && exp.length === 0 && <div className="section"><Empty title="No saved sales">Sales you record without a connection appear here until they are confirmed.</Empty></div>}
      {exp && exp.length > 0 && <h2>Expenses</h2>}
      <div className="stack-sm">
        {exp?.map((r) => {
          const [label, tone] = LABEL[r.status] || [r.status, 'gray']
          return (
            <div className="section pad stack-sm" key={r.clientRequestId}>
              <div className="row between"><strong>{dateTime(r.createdAt)}</strong><span className={`badge ${tone}`}>{label}</span></div>
              <div className="kv"><span className="k">{r.payload.category}{r.payload.description ? ` · ${r.payload.description}` : ''}</span><span className="num">{money(r.payload.amount)}</span></div>
              {r.error && <p className="form-error">{r.error}</p>}
              {r.status === 'FAILED' && <div className="row"><button className="btn" onClick={() => retryExpense(r.clientRequestId)}>Try again</button><button className="btn" onClick={() => discardExpense(r.clientRequestId)}>Discard</button></div>}
              {r.status === 'PENDING' && <div className="row"><button className="btn sm" onClick={() => discardExpense(r.clientRequestId)}>Discard</button></div>}
            </div>
          )
        })}
      </div>
      {rows && rows.length > 0 && <h2>Sales</h2>}
      <div className="stack-sm">
        {rows?.map((r) => {
          const [label, tone] = LABEL[r.status] || [r.status, 'gray']
          return (
            <div className="section pad stack-sm" key={r.clientRequestId}>
              <div className="row between"><strong>{dateTime(r.createdAt)}</strong><span className={`badge ${tone}`}>{label}</span></div>
              {r.lines.map((l, i) => <div className="kv" key={i}><span className="k">{l.name}</span><span className="num">{qtyText(l.quantity)}</span></div>)}
              <div className="kv"><span className="k">{r.status === 'SYNCED' ? `Server total (sale #${r.serverSaleNumber})` : 'Estimated total (the server sets the final price)'}</span><span className="num">{money(r.status === 'SYNCED' ? r.serverTotal : r.estimatedTotal)}</span></div>
              {r.error && <p className="form-error">{r.error}</p>}
              {r.status === 'FAILED' && <div className="row"><button className="btn" onClick={() => retrySale(r.clientRequestId)}>Try again</button><button className="btn" onClick={() => discard(r)}>Discard</button></div>}
              {r.status === 'PENDING' && <div className="row"><button className="btn sm" onClick={() => discard(r)}>Discard</button></div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
