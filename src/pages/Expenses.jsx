import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Confirm, Empty, ErrorBox, Field, ListSkeleton, Modal, RangePicker, useLoad, useToast } from '../components.jsx'
import { dateOnly, money, rangeQuery } from '../lib/format.js'

const METHOD = { CASH: 'Cash', TRANSFER: 'Bank transfer', CARD: 'Card' }
const CATEGORIES = ['Rent', 'Transport', 'Salaries', 'Electricity', 'Stock purchase', 'Packaging', 'Airtime and data', 'Repairs', 'Other']

function AddExpense({ onClose, onDone }) {
  const toast = useToast()
  const [f, setF] = useState({ category: '', amount: '', description: '', paymentMethod: 'CASH', expenseDate: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    const errs = {}
    if (!f.category.trim()) errs.category = 'What was it for?'
    if (!(Number(f.amount) > 0)) errs.amount = 'Enter an amount above zero'
    setErrors(errs); setFormError('')
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await api.post('/expenses', { category: f.category, amount: Number(f.amount), description: f.description || null, paymentMethod: f.paymentMethod, expenseDate: f.expenseDate || null })
      toast('Expense added'); onDone(); onClose()
    } catch (e) { setFormError(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Add expense" onClose={onClose}>
      <Field label="What was it for?" htmlFor="ecat" error={errors.category}>
        <input id="ecat" className="input" list="expense-cats" value={f.category} autoFocus onChange={(e) => setF({ ...f, category: e.target.value })} />
        <datalist id="expense-cats">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="Amount (₦)" htmlFor="eamt" error={errors.amount}><input id="eamt" className="input" type="number" inputMode="decimal" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
      <div className="seg" role="group" aria-label="Paid with">
        {Object.entries(METHOD).map(([id, label]) => <button key={id} className={`chip ${f.paymentMethod === id ? 'on' : ''}`} aria-pressed={f.paymentMethod === id} onClick={() => setF({ ...f, paymentMethod: id })}>{label}</button>)}
      </div>
      <Field label="Date" htmlFor="edate" hint="Leave empty for today"><input id="edate" className="input" type="date" value={f.expenseDate} onChange={(e) => setF({ ...f, expenseDate: e.target.value })} /></Field>
      <Field label="Note (optional)" htmlFor="enote"><input id="enote" className="input" value={f.description} maxLength={300} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save expense'}</button>
    </Modal>
  )
}

export default function Expenses() {
  const toast = useToast()
  const { can } = useAuth()
  const [sp, setSp] = useSearchParams()
  const range = sp.get('range') || 'thisMonth'
  const from = sp.get('from') || ''
  const to = sp.get('to') || ''
  const ready = range !== 'custom' || (from && to)
  const list = useLoad(() => (ready ? api.get('/expenses', { ...rangeQuery(range, from, to), size: 100 }) : Promise.resolve(null)), [range, from, to])
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState(null)
  const [busy, setBusy] = useState(false)
  const rows = list.data?.page?.content

  async function remove() {
    setBusy(true)
    try { await api.del(`/expenses/${removing.id}`); toast('Expense deleted'); setRemoving(null); list.reload() }
    catch (e) { toast(e.message, 'error'); setRemoving(null) } finally { setBusy(false) }
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Expenses</h1><p className="sub">Money your business spent</p></div>
        {can('EXPENSES_CREATE') && <button className="btn primary" onClick={() => setAdding(true)}><Plus size={18} /> Add expense</button>}
      </div>
      <RangePicker value={range} from={from} to={to} onChange={({ range: r, from: f, to: t }) => setSp(r === 'custom' ? { range: r, ...(f ? { from: f } : {}), ...(t ? { to: t } : {}) } : { range: r }, { replace: true })} />
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && <ListSkeleton />}
      {list.data && <section className="section"><div className="kv"><span className="k">Total spent</span><span className="v num">{money(list.data.total)}</span></div></section>}
      {rows && rows.length === 0 && <div className="section"><Empty title="No expenses in this period">Record rent, transport, salaries and other costs so your profit is accurate.</Empty></div>}
      {rows && rows.length > 0 && (
        <div className="section list">
          {rows.map((e) => (
            <div className="list-item" key={e.id} style={{ cursor: 'default' }}>
              <div className="grow"><div className="title">{e.category}</div><div className="meta">{dateOnly(e.expenseDate)} · {METHOD[e.paymentMethod]}{e.description ? ` · ${e.description}` : ''}</div></div>
              <div className="num title">{money(e.amount)}</div>
              {can('EXPENSES_EDIT') && <button className="icon-btn" aria-label={`Delete ${e.category} expense`} onClick={() => setRemoving(e)}><Trash2 size={18} /></button>}
            </div>
          ))}
        </div>
      )}
      {adding && <AddExpense onClose={() => setAdding(false)} onDone={list.reload} />}
      {removing && <Confirm title="Delete this expense?" danger busy={busy} message={`${removing.category} · ${money(removing.amount)} will be removed from your expenses and profit figures.`} confirmLabel="Delete" onConfirm={remove} onClose={() => setRemoving(null)} />}
    </div>
  )
}
