import { useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../../lib/api'
import { Empty, ErrorBox, Field, ListSkeleton, Modal, useLoad, useToast } from '../../components.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { dateTime, money } from '../../lib/format.js'

const KIND = { CASH: 'Cash', BANK: 'Bank', MOBILE_MONEY: 'Mobile money' }
const MOVE = {
  SALE: 'Sale', CUSTOMER_PAYMENT: 'Customer payment', INVOICE_PAYMENT: 'Invoice payment', REFUND: 'Refund', EXPENSE: 'Expense', EXPENSE_REVERSAL: 'Expense removed',
  SUPPLIER_PAYMENT: 'Paid supplier', PURCHASE: 'Stock bought', DEPOSIT: 'Money added', WITHDRAWAL: 'Money taken out',
  TRANSFER_IN: 'Moved in', TRANSFER_OUT: 'Moved out', CATERING_DEPOSIT: 'Catering deposit', ONLINE_ORDER: 'Online order',
}

function AccountForm({ onClose, onSaved }) {
  const toast = useToast()
  const [f, setF] = useState({ name: '', kind: 'BANK', openingBalance: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    if (!f.name.trim()) { setErr('Enter a name'); return }
    setBusy(true); setErr('')
    try { await api.post('/finance/accounts', { name: f.name, kind: f.kind, openingBalance: f.openingBalance === '' ? 0 : Number(f.openingBalance) }); toast('Account added'); onSaved(); onClose() }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Add account" onClose={onClose}>
      <Field label="Name" htmlFor="ac-name" error={err}><input id="ac-name" className="input" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <div className="seg" role="group" aria-label="Type">
        {Object.entries(KIND).map(([id, label]) => <button key={id} className={`chip ${f.kind === id ? 'on' : ''}`} aria-pressed={f.kind === id} onClick={() => setF({ ...f, kind: id })}>{label}</button>)}
      </div>
      <Field label="Money in it today (₦)" htmlFor="ac-open"><input id="ac-open" className="input" type="number" inputMode="decimal" min="0" value={f.openingBalance} onChange={(e) => setF({ ...f, openingBalance: e.target.value })} /></Field>
      <button className="btn primary block" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save account'}</button>
    </Modal>
  )
}

function MoveMoney({ accounts, onClose, onSaved }) {
  const toast = useToast()
  const [type, setType] = useState('DEPOSIT')
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    if (!(Number(amount) > 0)) { setErr('Enter an amount above zero'); return }
    setBusy(true); setErr('')
    try {
      if (type === 'TRANSFER') {
        if (!toId) { setErr('Choose where the money goes'); setBusy(false); return }
        await api.post('/finance/transfer', { fromAccountId: accountId, toAccountId: toId, amount: Number(amount), note: note || null })
      } else await api.post('/finance/manual', { accountId, type, amount: Number(amount), note: note || null })
      toast('Saved'); onSaved(); onClose()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Add, take out or move money" onClose={onClose}>
      <div className="seg" role="group" aria-label="What are you doing?">
        <button className={`chip ${type === 'DEPOSIT' ? 'on' : ''}`} aria-pressed={type === 'DEPOSIT'} onClick={() => setType('DEPOSIT')}>Add money</button>
        <button className={`chip ${type === 'WITHDRAWAL' ? 'on' : ''}`} aria-pressed={type === 'WITHDRAWAL'} onClick={() => setType('WITHDRAWAL')}>Take money out</button>
        <button className={`chip ${type === 'TRANSFER' ? 'on' : ''}`} aria-pressed={type === 'TRANSFER'} onClick={() => setType('TRANSFER')}>Move between accounts</button>
      </div>
      <Field label={type === 'TRANSFER' ? 'From' : 'Account'} htmlFor="mm-acc"><select id="mm-acc" className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
      {type === 'TRANSFER' && <Field label="To" htmlFor="mm-to"><select id="mm-to" className="input" value={toId} onChange={(e) => setToId(e.target.value)}><option value="">Choose…</option>{accounts.filter((a) => a.id !== accountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>}
      <Field label="Amount (₦)" htmlFor="mm-amt"><input id="mm-amt" className="input" type="number" inputMode="decimal" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      <Field label="Note (optional)" htmlFor="mm-note" error={err}><input id="mm-note" className="input" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <button className="btn primary block" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
    </Modal>
  )
}

function History({ account, onClose }) {
  const list = useLoad(() => api.get(`/finance/accounts/${account.id}/movements`, { size: 50 }), [account.id])
  return (
    <Modal title={account.name} onClose={onClose}>
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && <ListSkeleton rows={3} />}
      {list.data?.content.length === 0 && <Empty title="No money has moved yet" />}
      <div className="list">
        {list.data?.content.map((m) => (
          <div className="list-item" key={m.id} style={{ cursor: 'default' }}>
            <div className="grow"><div className="title">{MOVE[m.kind] || m.kind}</div><div className="meta">{dateTime(m.createdAt)}{m.note ? ` · ${m.note}` : ''}</div></div>
            <div className="num title" style={{ color: m.direction === 'IN' ? 'var(--ok)' : 'var(--danger)' }}>{m.direction === 'IN' ? '+' : '−'}{money(m.amount)}</div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default function Accounts() {
  const { can } = useAuth()
  const list = useLoad(() => api.get('/finance/accounts'), [])
  const [adding, setAdding] = useState(false)
  const [moving, setMoving] = useState(false)
  const [viewing, setViewing] = useState(null)
  const manage = can('CASH_ACCOUNTS_MANAGE')
  const total = (list.data || []).filter((a) => a.active).reduce((s, a) => s + Number(a.balance), 0)
  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Cash and bank</h1><p className="sub">Where your money is right now</p></div>
        {manage && <div className="row"><button className="btn" onClick={() => setMoving(true)}>Move money</button><button className="btn primary" onClick={() => setAdding(true)}><Plus size={18} /> Add account</button></div>}
      </div>
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && <ListSkeleton />}
      {list.data && <section className="section"><div className="kv"><span className="k">Total money you hold</span><span className="v num">{money(total)}</span></div></section>}
      <div className="section list">
        {list.data?.map((a) => (
          <button key={a.id} className="list-item" onClick={() => setViewing(a)}>
            <div className="grow"><div className="title">{a.name} {!a.active && <span className="badge gray">Switched off</span>}</div><div className="meta">{KIND[a.kind]}</div></div>
            <div className="num title">{money(a.balance)}</div>
          </button>
        ))}
      </div>
      <p className="muted small">Cash sales go to your cash account. Transfers and card payments go to your bank account.</p>
      {adding && <AccountForm onClose={() => setAdding(false)} onSaved={list.reload} />}
      {moving && list.data && <MoveMoney accounts={list.data.filter((a) => a.active)} onClose={() => setMoving(false)} onSaved={list.reload} />}
      {viewing && <History account={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
