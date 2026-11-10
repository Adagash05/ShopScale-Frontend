import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { Empty, ErrorBox, Field, ListSkeleton, useDebounced, useLoad, useToast } from '../../components.jsx'
import { money, qtyText } from '../../lib/format.js'

function Tiers() {
  const toast = useToast()
  const tiers = useLoad(() => api.get('/pricing/tiers'), [])
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  async function add() {
    if (!name.trim()) { setErr('Enter a name, for example Wholesale'); return }
    try { await api.post('/pricing/tiers', { name }); setName(''); setErr(''); tiers.reload() } catch (e) { setErr(e.message) }
  }
  async function toggle(t) {
    try { await api.post(`/pricing/tiers/${t.id}/${t.active ? 'deactivate' : 'activate'}`); tiers.reload() } catch (e) { toast(e.message, 'error') }
  }
  return (
    <section className="section pad stack-sm">
      <h2>Price tiers</h2>
      <p className="muted small">Group customers (for example Wholesale or Distributor), then give each group its own prices. Put a customer on a tier from their customer page.</p>
      <ErrorBox error={tiers.error} onRetry={tiers.reload} />
      {tiers.loading && <ListSkeleton rows={2} />}
      {tiers.data?.map((t) => (
        <div className="row between" key={t.id}><span>{t.name}{!t.active && <span className="badge gray" style={{ marginLeft: 8 }}>Off</span>}</span><button className="btn sm" onClick={() => toggle(t)}>{t.active ? 'Turn off' : 'Turn on'}</button></div>
      ))}
      <div className="row">
        <input className="input grow" aria-label="New tier name" placeholder="New tier name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn primary" onClick={add}>Add tier</button>
      </div>
      {err && <p className="error">{err}</p>}
    </section>
  )
}

function Rules({ variant, tiers, onBack }) {
  const toast = useToast()
  const rules = useLoad(() => api.get(`/pricing/variants/${variant.variantId}`), [variant.variantId])
  const [cq, setCq] = useState('')
  const dcq = useDebounced(cq)
  const customers = useLoad(() => api.get('/customers', { q: dcq, size: 8 }), [dcq])
  const [who, setWho] = useState('ALL')
  const [customer, setCustomer] = useState(null)
  const [minQty, setMinQty] = useState('1')
  const [price, setPrice] = useState('')
  const [err, setErr] = useState('')
  async function add() {
    if (!(Number(price) >= 0) || price === '') { setErr('Enter the price'); return }
    if (!(Number(minQty) > 0)) { setErr('Minimum quantity must be above zero'); return }
    if (who === 'CUSTOMER' && !customer) { setErr('Choose the customer'); return }
    try {
      await api.post('/pricing/rules', {
        variantId: variant.variantId, minQuantity: Number(minQty), price: Number(price),
        priceTierId: who !== 'ALL' && who !== 'CUSTOMER' ? who : null, customerId: who === 'CUSTOMER' ? customer.id : null,
      })
      setPrice(''); setErr(''); rules.reload()
    } catch (e) { setErr(e.message) }
  }
  async function del(id) {
    try { await api.del(`/pricing/rules/${id}`); rules.reload() } catch (e) { toast(e.message, 'error') }
  }
  const title = variant.label ? `${variant.productName} (${variant.label})` : variant.productName
  return (
    <section className="section pad stack-sm">
      <div className="row between"><h2>{title}</h2><button className="btn sm" onClick={onBack}>Back</button></div>
      <p className="muted small">Standard price {money(variant.price)}. A price agreed with one customer wins over their tier price, which wins over a bulk price for everyone.</p>
      <ErrorBox error={rules.error} onRetry={rules.reload} />
      {rules.data?.length === 0 && <Empty title="No special prices yet" />}
      {rules.data?.map((r) => (
        <div className="kv" key={r.id}>
          <span className="k">{r.customerName ? `${r.customerName} (agreed)` : r.tierName ? r.tierName : 'Everyone'} · from {qtyText(r.minQuantity)}</span>
          <span className="num">{money(r.price)} <button className="icon-btn" aria-label="Remove price" onClick={() => del(r.id)}><Trash2 size={16} /></button></span>
        </div>
      ))}
      <h3>Add a price</h3>
      <Field label="Who gets it" htmlFor="pr-who">
        <select id="pr-who" className="input" value={who} onChange={(e) => setWho(e.target.value)}>
          <option value="ALL">Everyone (bulk price)</option>
          {tiers.filter((t) => t.active).map((t) => <option key={t.id} value={t.id}>{t.name} tier</option>)}
          <option value="CUSTOMER">One customer</option>
        </select>
      </Field>
      {who === 'CUSTOMER' && (customer ? <div className="row between"><strong>{customer.name}</strong><button className="btn sm" onClick={() => setCustomer(null)}>Change</button></div> : (
        <>
          <input className="input" aria-label="Search customers" placeholder="Find the customer" value={cq} onChange={(e) => setCq(e.target.value)} />
          {customers.data?.content.map((c) => <button key={c.id} className="list-item" onClick={() => setCustomer(c)}><div className="grow title">{c.name}</div></button>)}
        </>
      ))}
      <div className="row">
        <Field label="From quantity" htmlFor="pr-min"><input id="pr-min" className="input" type="number" inputMode="decimal" min="0" step="any" value={minQty} onChange={(e) => setMinQty(e.target.value)} /></Field>
        <Field label="Price each (₦)" htmlFor="pr-price"><input id="pr-price" className="input" type="number" inputMode="decimal" min="0" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
      </div>
      {err && <p className="error">{err}</p>}
      <button className="btn primary block" onClick={add}>Save price</button>
    </section>
  )
}

export default function Pricing() {
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const found = useLoad(() => api.get('/products/sellable', { q: dq }), [dq])
  const tiers = useLoad(() => api.get('/pricing/tiers'), [])
  const [variant, setVariant] = useState(null)
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Wholesale prices</h1><p className="sub">Tier prices, bulk prices and prices agreed with one customer</p></div></div>
      {variant ? <Rules variant={variant} tiers={tiers.data || []} onBack={() => setVariant(null)} /> : (
        <>
          <Tiers />
          <section className="section pad stack-sm">
            <h2>Set prices for a product</h2>
            <input className="input" aria-label="Search products" placeholder="Search product" value={q} onChange={(e) => setQ(e.target.value)} />
            {found.data?.map((it) => (
              <button key={it.variantId} className="list-item" onClick={() => setVariant(it)}>
                <div className="grow"><div className="title">{it.label ? `${it.productName} (${it.label})` : it.productName}</div><div className="meta">Standard {money(it.price)}</div></div>
              </button>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
