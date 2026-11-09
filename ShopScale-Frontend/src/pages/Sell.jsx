import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Trash2, UserPlus, Printer } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Empty, ErrorBox, Field, Modal, useDebounced, useLoad, useToast } from '../components.jsx'
import { addLine, buildPayments, computeTotals, newRequestId, validateSale } from '../lib/cart.js'
import { dateTime, money, qtyText } from '../lib/format.js'
import { BranchSelect, useBranch } from '../lib/branch.js'

const METHODS = [['CASH', 'Cash'], ['TRANSFER', 'Transfer'], ['CARD', 'Card']]

function CustomerPicker({ onPick, onClose }) {
  const toast = useToast()
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const list = useLoad(() => api.get('/customers', { q: dq, size: 20 }), [dq])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [err, setErr] = useState('')

  async function create() {
    if (!form.name.trim()) { setErr('Enter a name'); return }
    try {
      const c = await api.post('/customers', { name: form.name, phone: form.phone || null })
      toast('Customer added'); onPick(c)
    } catch (e) { setErr(e.message) }
  }

  return (
    <Modal title="Choose customer" onClose={onClose}>
      {!adding ? (
        <>
          <input className="input" placeholder="Search by name or phone" aria-label="Search customers" value={q} autoFocus onChange={(e) => setQ(e.target.value)} />
          <div className="section list" style={{ maxHeight: 280, overflowY: 'auto' }}>
            {list.data?.content?.map((c) => (
              <button key={c.id} className="list-item" onClick={() => onPick(c)}>
                <div className="grow"><div className="title">{c.name}</div><div className="meta">{c.phone || 'No phone'}</div></div>
                {Number(c.balance) > 0 && <span className="badge warn">Owes {money(c.balance)}</span>}
              </button>
            ))}
            {list.data && list.data.content.length === 0 && <Empty title="No customers found" />}
          </div>
          <button className="btn block" onClick={() => setAdding(true)}><UserPlus size={18} /> New customer</button>
        </>
      ) : (
        <>
          <Field label="Name" htmlFor="cn" error={err}><input id="cn" className="input" value={form.name} autoFocus onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Phone (optional)" htmlFor="cp"><input id="cp" className="input" type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <div className="row"><button className="btn" onClick={() => setAdding(false)}>Back</button><button className="btn primary grow" onClick={create}>Save customer</button></div>
        </>
      )}
    </Modal>
  )
}

function Receipt({ sale, business, onClose }) {
  return (
    <Modal title={`Sale #${sale.saleNumber} recorded`} onClose={onClose}>
      <div className="receipt receipt-print">
        <h3>{business.name}</h3>
        <p className="muted small">{dateTime(sale.createdAt)}{sale.customerName ? ` · ${sale.customerName}` : ''}</p>
        <hr style={{ border: 0, borderTop: '1px dashed var(--line)', margin: '10px 0' }} />
        {sale.items.map((i, idx) => (
          <div className="line" key={idx}><span>{i.quantity} × {i.variantLabel ? `${i.productName} (${i.variantLabel})` : i.productName}</span><span>{money(i.lineTotal)}</span></div>
        ))}
        <hr style={{ border: 0, borderTop: '1px dashed var(--line)', margin: '10px 0' }} />
        {Number(sale.discount) > 0 && <div className="line"><span>Discount</span><span>-{money(sale.discount)}</span></div>}
        <div className="line"><strong>Total</strong><strong>{money(sale.total)}</strong></div>
        <div className="line"><span>Paid</span><span>{money(sale.amountPaid)}</span></div>
        {Number(sale.amountOwed) > 0 && <div className="line"><span>Amount remaining</span><strong>{money(sale.amountOwed)}</strong></div>}
        <p className="muted small" style={{ marginTop: 10 }}>Thank you for your business</p>
      </div>
      <div className="row"><button className="btn grow" onClick={() => window.print()}><Printer size={18} /> Print</button><button className="btn primary grow" onClick={onClose}>New sale</button></div>
    </Modal>
  )
}

export default function Sell() {
  const { business, can } = useAuth()
  const toast = useToast()
  const sub = useLoad(() => api.get('/subscriptions/current'), [])
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const branch = useBranch()
  const items = useLoad(() => (branch.branchId ? api.get('/products/sellable', { q: dq, branchId: branch.branchId }) : Promise.resolve([])), [dq, branch.branchId])
  const [lines, setLines] = useState([])
  const [discount, setDiscount] = useState('')
  const [customer, setCustomer] = useState(null)
  const [pickCustomer, setPickCustomer] = useState(false)
  const [mode, setMode] = useState('full')
  const [method, setMethod] = useState('CASH')
  const [part, setPart] = useState('')
  const [requestId, setRequestId] = useState(newRequestId)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState(null)

  const totals = useMemo(() => computeTotals(lines, discount), [lines, discount])
  const { payments, owed } = useMemo(() => buildPayments(mode, method, part, totals.total), [mode, method, part, totals.total])
  const canUseCredit = !sub.data || sub.data.features?.includes('CUSTOMER_CREDIT')
  const stockLines = lines.map((l) => ({ ...l, allowNegative: business.allowNegativeStock }))

  useEffect(() => { setError('') }, [lines, mode, customer, discount, part])

  const setQty = (id, delta) => setLines((ls) => ls.map((l) => (l.variantId === id ? { ...l, quantity: Math.max(l.allowDecimal ? 0.001 : 1, Math.round((l.quantity + delta) * 1000) / 1000) } : l)))
  const setQtyExact = (id, raw) => setLines((ls) => ls.map((l) => (l.variantId === id ? { ...l, quantity: raw === '' ? '' : Number(raw) } : l)))

  async function confirm() {
    const problem = validateSale({ lines: stockLines, total: totals.total, owed, customer, canUseCredit })
    if (problem) { setError(problem); return }
    setBusy(true); setError('')
    try {
      const sale = await api.post('/sales', {
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        discount: totals.discount || 0,
        customerId: customer?.id ?? null,
        payments,
        clientRequestId: requestId,
        branchId: branch.branchId,
      })
      setReceipt(sale)
      setLines([]); setDiscount(''); setCustomer(null); setMode('full'); setPart('')
      setRequestId(newRequestId())
      items.reload()
    } catch (e) {
      setError(e.message)
      if (e.status === 409 || e.status === 400) items.reload()
      toast(e.message, 'error')
    } finally { setBusy(false) }
  }

  return (
    <div className="stack">
      <div className="page-head"><div><h1>Record a sale</h1><p className="sub">Tap a product, check the total, confirm.</p></div></div>
      {sub.data && !sub.data.writable && <div className="banner danger">Your account is read-only, so new sales cannot be recorded. <Link to="/more/plan">See plans</Link></div>}
      <BranchSelect branch={branch} label="Selling from" />
      <div className="sell-grid">
        <section className="stack-sm">
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--muted)' }} aria-hidden="true" />
            <input className="input" style={{ paddingLeft: 38 }} placeholder="Search product, SKU or barcode" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <ErrorBox error={items.error} onRetry={items.reload} />
          <div className="section list" style={{ maxHeight: 420, overflowY: 'auto' }}>
            {items.data?.map((it) => (
              <button key={it.variantId} className="list-item" disabled={it.quantity <= 0 && !business.allowNegativeStock} onClick={() => setLines((ls) => addLine(ls, it))}>
                <div className="grow"><div className="title">{it.label ? `${it.productName} (${it.label})` : it.productName}</div>
                  <div className="meta">{it.quantity <= 0 ? <span style={{ color: 'var(--danger)' }}>Out of stock</span> : `${qtyText(it.quantity)} ${it.unit && it.unit !== 'piece' ? it.unit : ''} in stock`}</div></div>
                <div className="num title">{money(it.price)}</div>
              </button>
            ))}
            {items.data && items.data.length === 0 && (
              <Empty title={q ? 'No product found' : 'No products yet'} action={!q && <Link className="btn primary" to="/products/new">Add your first product</Link>}>
                {q ? 'Try another name.' : 'Add products first, then you can sell them here.'}
              </Empty>
            )}
          </div>
        </section>

        <section className="stack">
          <div className="section">
            <div className="section-title"><h2>Items ({lines.length})</h2></div>
            {lines.length === 0 ? <Empty title="Nothing added yet">Tap a product to add it.</Empty> : (
              <div className="list">
                {lines.map((l) => (
                  <div className="list-item" key={l.variantId} style={{ cursor: 'default' }}>
                    <div className="grow"><div className="title">{l.name}</div><div className="meta num">{money(l.price)} {l.unit && l.unit !== 'piece' ? `per ${l.unit}` : 'each'}</div></div>
                    <div className="qty"><button aria-label={`Less ${l.name}`} onClick={() => setQty(l.variantId, -1)}>−</button><input className="input" style={{ width: 76, textAlign: 'center' }} aria-label={`Quantity of ${l.name}`} type="number" inputMode="decimal" min="0" step={l.allowDecimal ? '0.001' : '1'} value={l.quantity} onChange={(e) => setQtyExact(l.variantId, e.target.value)} /><button aria-label={`More ${l.name}`} onClick={() => setQty(l.variantId, 1)}>+</button></div>
                    <button className="icon-btn" aria-label={`Remove ${l.name}`} onClick={() => setLines((ls) => ls.filter((x) => x.variantId !== l.variantId))}><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {lines.length > 0 && (
            <div className="section pad stack">
              {can('SALES_DISCOUNT') && <Field label="Discount (optional)" htmlFor="disc"><input id="disc" className="input" type="number" inputMode="decimal" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>}
              <div className="stack-sm">
                <strong>How is the customer paying?</strong>
                <div className="seg" role="group" aria-label="Payment type">
                  <button className={`chip ${mode === 'full' ? 'on' : ''}`} aria-pressed={mode === 'full'} onClick={() => setMode('full')}>Paid in full</button>
                  <button className={`chip ${mode === 'part' ? 'on' : ''}`} aria-pressed={mode === 'part'} onClick={() => setMode('part')}>Part payment</button>
                  <button className={`chip ${mode === 'later' ? 'on' : ''}`} aria-pressed={mode === 'later'} onClick={() => setMode('later')}>Pay later</button>
                </div>
                {mode !== 'later' && (
                  <div className="seg" role="group" aria-label="Payment method">
                    {METHODS.map(([id, label]) => <button key={id} className={`chip ${method === id ? 'on' : ''}`} aria-pressed={method === id} onClick={() => setMethod(id)}>{label}</button>)}
                  </div>
                )}
                {mode === 'part' && <Field label="Amount paid now" htmlFor="part"><input id="part" className="input" type="number" inputMode="decimal" min="0" value={part} onChange={(e) => setPart(e.target.value)} /></Field>}
                {method === 'TRANSFER' && mode !== 'later' && <p className="muted small">Only record a transfer after the money has reached your account.</p>}
              </div>
              <div className="stack-sm">
                <div className="row between"><strong>Customer{owed > 0 ? '' : ' (optional)'}</strong>
                  <button className="btn sm" onClick={() => setPickCustomer(true)}>{customer ? 'Change' : 'Choose'}</button></div>
                {customer ? <p>{customer.name}{customer.phone ? ` · ${customer.phone}` : ''}</p> : owed > 0 && <p className="muted small">Choose who owes you the remaining money.</p>}
              </div>
            </div>
          )}

          <div className="total-bar" aria-live="polite">
            <div><div className="small" style={{ opacity: 0.85 }}>Total</div><div className="amt num">{money(totals.total)}</div></div>
            {owed > 0 && <div className="right small">Amount remaining<br /><strong className="num">{money(owed)}</strong></div>}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn primary block" style={{ minHeight: 54 }} disabled={busy || lines.length === 0 || (sub.data && !sub.data.writable)} onClick={confirm}>
            {busy ? 'Recording…' : 'Confirm sale'}
          </button>
        </section>
      </div>
      {pickCustomer && <CustomerPicker onClose={() => setPickCustomer(false)} onPick={(c) => { setCustomer(c); setPickCustomer(false) }} />}
      {receipt && <Receipt sale={receipt} business={business} onClose={() => setReceipt(null)} />}
    </div>
  )
}
