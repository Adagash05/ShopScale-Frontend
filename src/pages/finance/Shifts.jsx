import { useState } from 'react'
import { api } from '../../lib/api'
import { Empty, ErrorBox, Field, ListSkeleton, Modal, useLoad, useToast } from '../../components.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { dateTime, money } from '../../lib/format.js'
import { BranchSelect, useBranch } from '../../lib/branch.js'

function OpenShift({ onClose, onSaved }) {
  const toast = useToast()
  const branch = useBranch()
  const [float, setFloat] = useState('')
  const [err, setErr] = useState('')
  async function save() {
    try { await api.post('/finance/shifts', { openingFloat: float === '' ? 0 : Number(float), branchId: branch.branchId }); toast('Shift started'); onSaved(); onClose() } catch (e) { setErr(e.message) }
  }
  return (
    <Modal title="Start your shift" onClose={onClose}>
      <BranchSelect branch={branch} label="Working at" id="sh-branch" />
      <Field label="Cash in the till at the start (₦)" htmlFor="sh-float" error={err}><input id="sh-float" className="input" type="number" inputMode="decimal" min="0" value={float} autoFocus onChange={(e) => setFloat(e.target.value)} /></Field>
      <button className="btn primary block" onClick={save}>Start shift</button>
    </Modal>
  )
}

function CloseShift({ shift, onClose, onSaved }) {
  const toast = useToast()
  const [counted, setCounted] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  async function save() {
    if (counted === '' || Number(counted) < 0) { setErr('Count the cash and enter the total'); return }
    try { const r = await api.post(`/finance/shifts/${shift.id}/close`, { countedCash: Number(counted), note: note || null }); toast(Number(r.variance) === 0 ? 'Shift closed. The till balances.' : 'Shift closed'); onSaved(); onClose() } catch (e) { setErr(e.message) }
  }
  return (
    <Modal title="Close your shift" onClose={onClose}>
      <p className="muted">Count the cash in the till and enter the total. We compare it with what the sales say you should have.</p>
      <Field label="Cash counted (₦)" htmlFor="sh-count" error={err}><input id="sh-count" className="input" type="number" inputMode="decimal" min="0" value={counted} autoFocus onChange={(e) => setCounted(e.target.value)} /></Field>
      <Field label="Note (optional)" htmlFor="sh-note"><input id="sh-note" className="input" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <button className="btn primary block" onClick={save}>Close shift</button>
    </Modal>
  )
}

export default function Shifts() {
  const { can } = useAuth()
  const toast = useToast()
  const current = useLoad(() => (can('SHIFTS_MANAGE') ? api.get('/finance/shifts/current') : Promise.resolve(null)), [])
  const list = useLoad(() => api.get('/finance/shifts', { size: 50 }), [])
  const [opening, setOpening] = useState(false)
  const [closing, setClosing] = useState(null)
  const reload = () => { current.reload(); list.reload() }
  const mine = current.data
  async function review(s) {
    try { await api.post(`/finance/shifts/${s.id}/review`, {}); toast('Marked as reviewed'); list.reload() } catch (e) { toast(e.message, 'error') }
  }
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Cashier shifts</h1><p className="sub">Open a shift, close it, and check the till balances</p></div></div>
      {can('SHIFTS_MANAGE') && (
        <section className="section pad stack-sm">
          {mine ? (
            <>
              <strong>Your shift is open</strong>
              <div className="meta">Since {dateTime(mine.openedAt)} · started with {money(mine.openingFloat)} · the till should hold about {money(mine.expectedCash)}</div>
              <button className="btn primary" onClick={() => setClosing(mine)}>Close my shift</button>
            </>
          ) : <><strong>No shift open</strong><button className="btn primary" onClick={() => setOpening(true)}>Start my shift</button></>}
        </section>
      )}
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && <ListSkeleton />}
      {list.data?.content.length === 0 && <div className="section"><Empty title="No shifts yet" /></div>}
      <div className="stack-sm">
        {list.data?.content.map((s) => {
          const v = Number(s.variance)
          return (
            <div className="section pad stack-sm" key={s.id}>
              <div className="row between"><strong>{s.userName}{s.branchName ? ` · ${s.branchName}` : ''}</strong>
                <span className={`badge ${s.status === 'OPEN' ? 'blue' : v === 0 ? 'teal' : 'warn'}`}>{s.status === 'OPEN' ? 'Open' : v === 0 ? 'Balanced' : v < 0 ? `Short ${money(-v)}` : `Over ${money(v)}`}</span></div>
              <div className="meta">{dateTime(s.openedAt)}{s.closedAt ? ` → ${dateTime(s.closedAt)}` : ''}</div>
              <div className="kv"><span className="k">Started with</span><span className="num">{money(s.openingFloat)}</span></div>
              <div className="kv"><span className="k">Should hold</span><span className="num">{s.expectedCash == null ? '—' : money(s.expectedCash)}</span></div>
              {s.countedCash != null && <div className="kv"><span className="k">Counted</span><span className="num">{money(s.countedCash)}</span></div>}
              {s.note && <div className="meta">{s.note}</div>}
              {s.status === 'CLOSED' && can('SHIFTS_RECONCILE') && !s.reviewed && <button className="btn" onClick={() => review(s)}>Mark as reviewed</button>}
              {s.reviewed && <span className="badge gray">Reviewed</span>}
            </div>
          )
        })}
      </div>
      {opening && <OpenShift onClose={() => setOpening(false)} onSaved={reload} />}
      {closing && <CloseShift shift={closing} onClose={() => setClosing(null)} onSaved={reload} />}
    </div>
  )
}
