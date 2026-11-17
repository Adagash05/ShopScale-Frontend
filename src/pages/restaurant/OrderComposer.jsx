import { useMemo, useState } from 'react'
import { Minus, Plus, Search } from 'lucide-react'
import { api } from '../../lib/api'
import { newRequestId } from '../../lib/cart.js'
import { Empty, ErrorBox, Field, ListSkeleton, Modal, useDebounced, useLoad, useToast } from '../../components.jsx'
import { money } from '../../lib/format.js'
import { ORDER_TYPES, loadProducts, variantName } from './shared.js'

/**
 * Pick menu items for a new order, or add items to an open order. Prices shown here are for guidance only:
 * the server prices every line from the menu and the chosen options.
 */
export default function OrderComposer({ order, tables, presetTable, onClose, onDone }) {
  const toast = useToast()
  const adding = !!order
  const [requestId] = useState(newRequestId)
  const [type, setType] = useState(presetTable ? 'DINE_IN' : 'DINE_IN')
  const [tableId, setTableId] = useState(presetTable || '')
  const [customerName, setCustomerName] = useState('')
  const [note, setNote] = useState('')
  const [cart, setCart] = useState([])
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const [cat, setCat] = useState('')
  const [picking, setPicking] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const menu = useLoad(async () => {
    const [products, groups] = await Promise.all([loadProducts(), api.get('/restaurant/modifier-groups')])
    return { products: products.filter((p) => p.kind !== 'INGREDIENT'), groups }
  }, [])
  const products = menu.data?.products || []
  const categories = useMemo(() => [...new Set(products.map((p) => p.categoryName).filter(Boolean))].sort(), [products])
  const shown = products.filter((p) => (!cat || p.categoryName === cat) && (!dq || p.name.toLowerCase().includes(dq.toLowerCase())))
  const freeTables = (tables || []).filter((t) => t.active)

  async function pick(p) {
    if (p.soldOut) return
    let groupIds = []
    try { groupIds = await api.get(`/restaurant/products/${p.id}/modifier-groups`) } catch { /* no options for this item */ }
    const groups = (menu.data?.groups || []).filter((g) => groupIds.includes(g.id) && g.active)
    if (p.variants.length === 1 && groups.length === 0) addLine(p, p.variants[0], [])
    else setPicking({ p, groups, variantId: p.variants[0]?.id, chosen: {} })
  }
  function addLine(p, v, mods) {
    const key = `${v.id}|${mods.map((m) => m.id).sort().join(',')}`
    const mt = mods.reduce((s, m) => s + Number(m.priceDelta), 0)
    setCart((c) => {
      const hit = c.find((l) => l.key === key && !l.note)
      if (hit) return c.map((l) => (l === hit ? { ...l, quantity: l.quantity + 1 } : l))
      return [...c, { key, variantId: v.id, name: variantName(p, v), price: Number(v.price) + mt, quantity: 1, note: '', modifierIds: mods.map((m) => m.id), modNames: mods.map((m) => m.name) }]
    })
  }
  function confirmPick() {
    const { p, groups, variantId, chosen } = picking
    const v = p.variants.find((x) => x.id === variantId)
    for (const g of groups) {
      const n = (chosen[g.id] || []).length
      if (g.required && n === 0) { toast(`Choose an option for ${g.name}`, 'error'); return }
    }
    const mods = groups.flatMap((g) => g.modifiers.filter((m) => m.active && (chosen[g.id] || []).includes(m.id)))
    addLine(p, v, mods)
    setPicking(null)
  }
  const bump = (key, d) => setCart((c) => c.map((l) => (l.key === key ? { ...l, quantity: l.quantity + d } : l)).filter((l) => l.quantity > 0))
  const total = cart.reduce((s, l) => s + l.price * l.quantity, 0)

  async function submit() {
    if (cart.length === 0) { setError('Add at least one item'); return }
    if (!adding && type === 'DINE_IN' && !tableId) { setError('Choose the table'); return }
    setBusy(true); setError('')
    const items = cart.map((l) => ({ variantId: l.variantId, quantity: l.quantity, note: l.note || null, modifierIds: l.modifierIds }))
    try {
      const res = adding
        ? await api.post(`/restaurant/orders/${order.id}/items`, { items })
        : await api.post('/restaurant/orders', { orderType: type, tableId: type === 'DINE_IN' ? tableId : (tableId || null), customerName: customerName || null, note: note || null, clientRequestId: requestId, items })
      toast(adding ? 'Items added' : `Order #${res.number} created`)
      onDone(res)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <Modal title={adding ? `Add to order #${order.number}` : 'New order'} onClose={onClose}>
      {!adding && (
        <div className="stack-sm">
          <div className="seg" role="group" aria-label="Order type">
            {Object.entries(ORDER_TYPES).map(([id, label]) => <button key={id} className={`chip ${type === id ? 'on' : ''}`} aria-pressed={type === id} onClick={() => setType(id)}>{label}</button>)}
          </div>
          {type === 'DINE_IN' && (
            <Field label="Table" htmlFor="o-table">
              <select id="o-table" className="select" value={tableId} onChange={(e) => setTableId(e.target.value)}>
                <option value="">Choose a table</option>
                {freeTables.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.seats} seats)</option>)}
              </select>
            </Field>
          )}
          {type !== 'DINE_IN' && <Field label="Customer name (optional)" htmlFor="o-name"><input id="o-name" className="input" value={customerName} maxLength={150} onChange={(e) => setCustomerName(e.target.value)} /></Field>}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--muted)' }} aria-hidden="true" />
        <input className="input" style={{ paddingLeft: 38 }} placeholder="Search the menu" aria-label="Search the menu" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {categories.length > 0 && (
        <div className="pill-bar" role="group" aria-label="Menu category">
          <button className={`chip ${cat === '' ? 'on' : ''}`} aria-pressed={cat === ''} onClick={() => setCat('')}>All</button>
          {categories.map((c) => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
        </div>
      )}
      {menu.loading && <ListSkeleton rows={3} />}
      <ErrorBox error={menu.error} onRetry={menu.reload} />
      {menu.data && shown.length === 0 && <Empty title="No menu items found">{products.length === 0 ? 'Add dishes in Menu and tables first.' : 'Try a different search.'}</Empty>}
      <div className="tile-grid">
        {shown.map((p) => (
          <button key={p.id} className="tile" disabled={p.soldOut} onClick={() => pick(p)}>
            <span className="t-title">{p.name}</span>
            <span className="t-meta">{p.soldOut ? 'Sold out' : p.variants.length > 1 ? `from ${money(Math.min(...p.variants.map((v) => Number(v.price))))}` : money(p.variants[0]?.price)}</span>
          </button>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="section list" aria-label="Items in this order">
          {cart.map((l) => (
            <div className="list-item" key={l.key + l.note} style={{ cursor: 'default', alignItems: 'flex-start' }}>
              <div className="grow">
                <div className="title">{l.name}</div>
                {l.modNames.length > 0 && <div className="meta">{l.modNames.join(', ')}</div>}
                <input className="input" style={{ marginTop: 6 }} placeholder="Note for the kitchen (optional)" aria-label={`Note for ${l.name}`} maxLength={300} value={l.note}
                  onChange={(e) => setCart((c) => c.map((x) => (x === l ? { ...x, note: e.target.value } : x)))} />
              </div>
              <div className="qty-ctl">
                <button aria-label={`Fewer ${l.name}`} onClick={() => bump(l.key, -1)}><Minus size={16} /></button>
                <span className="num" aria-live="polite">{l.quantity}</span>
                <button aria-label={`More ${l.name}`} onClick={() => bump(l.key, 1)}><Plus size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="sticky-foot">
        {!adding && <Field label="Order note (optional)" htmlFor="o-note"><input id="o-note" className="input" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} /></Field>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn primary block" onClick={submit} disabled={busy || cart.length === 0}>{busy ? 'Saving…' : `${adding ? 'Add to order' : 'Create order'} · about ${money(total)}`}</button>
      </div>

      {picking && (
        <Modal title={picking.p.name} onClose={() => setPicking(null)}>
          {picking.p.variants.length > 1 && (
            <div className="stack-sm" role="radiogroup" aria-label="Size or type">
              {picking.p.variants.map((v) => (
                <label key={v.id} className="row"><input type="radio" name="variant" checked={picking.variantId === v.id} onChange={() => setPicking({ ...picking, variantId: v.id })} /><span className="grow">{v.label || 'Regular'}</span><span className="num">{money(v.price)}</span></label>
              ))}
            </div>
          )}
          {picking.groups.map((g) => (
            <fieldset key={g.id} className="stack-sm" style={{ border: 0, padding: 0 }}>
              <legend><strong>{g.name}</strong> <span className="muted">{g.required ? 'Required' : 'Optional'} · up to {g.maxSelect}</span></legend>
              {g.modifiers.filter((m) => m.active).map((m) => {
                const on = (picking.chosen[g.id] || []).includes(m.id)
                return (
                  <label key={m.id} className="row">
                    <input type="checkbox" checked={on} onChange={() => {
                      const cur = picking.chosen[g.id] || []
                      let next = on ? cur.filter((x) => x !== m.id) : [...cur, m.id]
                      if (g.maxSelect === 1 && !on) next = [m.id]
                      if (next.length > g.maxSelect) { toast(`Choose at most ${g.maxSelect} for ${g.name}`, 'error'); return }
                      setPicking({ ...picking, chosen: { ...picking.chosen, [g.id]: next } })
                    }} />
                    <span className="grow">{m.name}</span>{Number(m.priceDelta) > 0 && <span className="num">+{money(m.priceDelta)}</span>}
                  </label>
                )
              })}
            </fieldset>
          ))}
          <button className="btn primary block" onClick={confirmPick}>Add to order</button>
        </Modal>
      )}
    </Modal>
  )
}
