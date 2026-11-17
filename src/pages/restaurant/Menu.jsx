import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Empty, ErrorBox, Field, ListSkeleton, Modal, useLoad, useToast } from '../../components.jsx'
import { money } from '../../lib/format.js'
import RecipeModal from './RecipeModal.jsx'
import { loadProducts, variantName } from './shared.js'

const KIND = { MENU: 'Menu item', FINISHED: 'Finished', GOODS: 'Item', INGREDIENT: 'Ingredient' }

function OptionsPicker({ product, groups, onClose }) {
  const toast = useToast()
  const cur = useLoad(() => api.get(`/restaurant/products/${product.id}/modifier-groups`), [product.id])
  const [chosen, setChosen] = useState(null)
  const [busy, setBusy] = useState(false)
  if (cur.data && !chosen) setChosen(cur.data)
  async function save() {
    setBusy(true)
    try { await api.put(`/restaurant/products/${product.id}/modifier-groups`, chosen); toast('Options saved'); onClose() } catch (e) { toast(e.message, 'error') } finally { setBusy(false) }
  }
  return (
    <Modal title={`Options for ${product.name}`} onClose={onClose}>
      {cur.loading && <ListSkeleton rows={2} />}
      <ErrorBox error={cur.error} onRetry={cur.reload} />
      {groups.length === 0 && <div className="banner">Create option groups first (the Options tab), for example "Extras" or "Spice level".</div>}
      {chosen && groups.map((g) => (
        <label key={g.id} className="row"><input type="checkbox" checked={chosen.includes(g.id)} onChange={() => setChosen(chosen.includes(g.id) ? chosen.filter((x) => x !== g.id) : [...chosen, g.id])} /><span>{g.name}{!g.active ? ' (hidden)' : ''}</span></label>
      ))}
      <button className="btn primary block" onClick={save} disabled={busy || !chosen}>{busy ? 'Saving…' : 'Save'}</button>
    </Modal>
  )
}

function ItemsTab({ groups }) {
  const toast = useToast()
  const { can } = useAuth()
  const [filter, setFilter] = useState('MENU')
  const list = useLoad(async () => (await loadProducts()).filter((p) => p.kind !== 'INGREDIENT'), [])
  const [recipe, setRecipe] = useState(null)
  const [options, setOptions] = useState(null)
  const rows = (list.data || []).filter((p) => filter === 'ALL' || (filter === 'MENU' ? p.kind === 'MENU' : p.kind !== 'MENU'))

  async function toggle(p) {
    try {
      await api.post(`/restaurant/products/${p.id}/availability`, { soldOut: !p.soldOut })
      list.setData(list.data.map((x) => (x.id === p.id ? { ...x, soldOut: !p.soldOut } : x)))
      toast(p.soldOut ? `${p.name} is available again` : `${p.name} marked sold out`)
    } catch (e) { toast(e.message, 'error') }
  }
  async function archive(p) {
    try { await api.post(`/products/${p.id}/archive`); toast(`${p.name} archived`); list.reload() } catch (e) { toast(e.message, 'error') }
  }
  const byCat = {}
  rows.forEach((p) => { (byCat[p.categoryName || 'No category'] ||= []).push(p) })

  return (
    <div className="stack">
      <div className="row wrap between">
        <div className="pill-bar" role="group" aria-label="Show">
          {[['MENU', 'Menu items'], ['OTHER', 'Drinks and other items'], ['ALL', 'Everything']].map(([id, label]) => <button key={id} className={`chip ${filter === id ? 'on' : ''}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}
        </div>
        {can('PRODUCTS_CREATE') && <Link className="btn primary" to="/products/new?kind=MENU"><Plus size={18} /> Add menu item</Link>}
      </div>
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && <ListSkeleton />}
      {list.data && rows.length === 0 && <div className="section"><Empty title="Nothing here yet">Add your dishes with their prices. Choose "Menu item" as the type.</Empty></div>}
      {Object.entries(byCat).sort(([a], [b]) => a.localeCompare(b)).map(([cat, ps]) => (
        <section key={cat} className="section">
          <h2 className="section-title">{cat}</h2>
          <div className="list">
            {ps.map((p) => (
              <div className="list-item" key={p.id} style={{ cursor: 'default', alignItems: 'flex-start' }}>
                <div className="grow">
                  <div className="title">{p.name} {p.soldOut && <span className="badge danger">Sold out</span>} <span className="badge gray">{KIND[p.kind]}</span></div>
                  <div className="meta">{p.variants.map((v) => `${v.label ? v.label + ' ' : ''}${money(v.price)}`).join(' · ')}</div>
                  <div className="row wrap" style={{ marginTop: 6 }}>
                    {(can('PRODUCTS_EDIT') || can('KITCHEN_STATUS_UPDATE')) && <button className="btn sm" onClick={() => toggle(p)}>{p.soldOut ? 'Make available' : 'Mark sold out'}</button>}
                    {can('PRODUCTS_EDIT') && <Link className="btn sm" to={`/products/${p.id}`}>Edit</Link>}
                    {can('RECIPES_MANAGE') && p.variants.map((v) => <button key={v.id} className="btn sm" onClick={() => setRecipe({ product: p, variant: v })}>Recipe{p.variants.length > 1 ? `: ${v.label || 'Regular'}` : ''}</button>)}
                    {can('PRODUCTS_EDIT') && p.kind === 'MENU' && <button className="btn sm" onClick={() => setOptions(p)}>Options</button>}
                    {can('PRODUCTS_EDIT') && <button className="btn sm danger" onClick={() => archive(p)}>Archive</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      {recipe && <RecipeModal {...recipe} onClose={() => setRecipe(null)} onDone={list.reload} />}
      {options && <OptionsPicker product={options} groups={groups} onClose={() => setOptions(null)} />}
    </div>
  )
}

function GroupForm({ group, onClose, onDone }) {
  const toast = useToast()
  const [f, setF] = useState({ name: group?.name || '', required: group?.required || false, maxSelect: String(group?.maxSelect || 1), active: group ? group.active : true })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save() {
    if (!f.name.trim()) { setError('Give the group a name'); return }
    setBusy(true); setError('')
    const body = { name: f.name.trim(), required: f.required, maxSelect: Number(f.maxSelect) || 1 }
    try {
      if (group) await api.put(`/restaurant/modifier-groups/${group.id}?active=${f.active}`, body)
      else await api.post('/restaurant/modifier-groups', body)
      toast('Saved'); onDone(); onClose()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={group ? 'Edit option group' : 'New option group'} onClose={onClose}>
      <Field label="Group name" htmlFor="g-name" hint="For example Extras, Spice level, Size of drink"><input id="g-name" className="input" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Customer can choose up to" htmlFor="g-max"><input id="g-max" className="input" type="number" min="1" max="20" value={f.maxSelect} onChange={(e) => setF({ ...f, maxSelect: e.target.value })} /></Field>
      <label className="row"><input type="checkbox" checked={f.required} onChange={(e) => setF({ ...f, required: e.target.checked })} /><span>They must choose one</span></label>
      {group && <label className="row"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /><span>Show this group when ordering</span></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
    </Modal>
  )
}

function ModifierForm({ group, modifier, ingredients, onClose, onDone }) {
  const toast = useToast()
  const [f, setF] = useState({ name: modifier?.name || '', priceDelta: String(modifier?.priceDelta ?? '0'), ingredient: modifier?.ingredientVariantId || '', qty: modifier?.ingredientQuantity ? String(modifier.ingredientQuantity) : '', active: modifier ? modifier.active : true })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save() {
    if (!f.name.trim()) { setError('Give the option a name'); return }
    if (f.ingredient && !(Number(f.qty) > 0)) { setError('Enter how much of the ingredient it uses'); return }
    setBusy(true); setError('')
    const body = { name: f.name.trim(), priceDelta: Number(f.priceDelta) || 0, ingredientVariantId: f.ingredient || null, ingredientQuantity: f.ingredient ? Number(f.qty) : null }
    try {
      if (modifier) await api.put(`/restaurant/modifiers/${modifier.id}?active=${f.active}`, body)
      else await api.post(`/restaurant/modifier-groups/${group.id}/modifiers`, body)
      toast('Saved'); onDone(); onClose()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={modifier ? 'Edit option' : `Add option to ${group.name}`} onClose={onClose}>
      <Field label="Option name" htmlFor="m-name" hint="For example Extra cheese"><input id="m-name" className="input" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Extra price (₦)" htmlFor="m-price" hint="0 if it is free"><input id="m-price" className="input" type="number" inputMode="decimal" min="0" value={f.priceDelta} onChange={(e) => setF({ ...f, priceDelta: e.target.value })} /></Field>
      <Field label="Uses this ingredient (optional)" htmlFor="m-ing">
        <select id="m-ing" className="select" value={f.ingredient} onChange={(e) => setF({ ...f, ingredient: e.target.value })}>
          <option value="">None</option>
          {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </Field>
      {f.ingredient && <Field label="Amount used each time" htmlFor="m-qty"><input id="m-qty" className="input" type="number" inputMode="decimal" min="0" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></Field>}
      {modifier && <label className="row"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /><span>Available</span></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
    </Modal>
  )
}

function OptionsTab({ groups, reload }) {
  const { can } = useAuth()
  const ing = useLoad(async () => (await loadProducts()).filter((p) => p.kind === 'INGREDIENT').flatMap((p) => p.variants.map((v) => ({ id: v.id, name: variantName(p, v) }))), [])
  const [dlg, setDlg] = useState(null)
  const edit = can('PRODUCTS_EDIT')
  return (
    <div className="stack">
      {edit && <div><button className="btn primary" onClick={() => setDlg({ kind: 'group' })}><Plus size={18} /> New option group</button></div>}
      {groups.length === 0 && <div className="section"><Empty title="No options yet">Options let guests add extras that cost more, like extra meat or a bigger portion.</Empty></div>}
      {groups.map((g) => (
        <section className="section" key={g.id}>
          <div className="row between" style={{ padding: '12px 16px' }}>
            <div><strong>{g.name}</strong> {!g.active && <span className="badge gray">Hidden</span>}<div className="muted">{g.required ? 'Must choose' : 'Optional'} · up to {g.maxSelect}</div></div>
            {edit && <div className="row"><button className="btn sm" onClick={() => setDlg({ kind: 'group', group: g })}>Edit</button><button className="btn sm" onClick={() => setDlg({ kind: 'mod', group: g })}>Add option</button></div>}
          </div>
          <div className="list">
            {g.modifiers.length === 0 && <div className="list-item muted" style={{ cursor: 'default' }}>No options in this group yet.</div>}
            {g.modifiers.map((m) => (
              <div className="list-item" key={m.id} style={{ cursor: 'default' }}>
                <div className="grow"><div className="title">{m.name} {!m.active && <span className="badge gray">Unavailable</span>}</div><div className="meta">{Number(m.priceDelta) > 0 ? `+${money(m.priceDelta)}` : 'Free'}{m.ingredientVariantId ? ' · uses stock' : ''}</div></div>
                {edit && <button className="btn sm" onClick={() => setDlg({ kind: 'mod', group: g, modifier: m })}>Edit</button>}
              </div>
            ))}
          </div>
        </section>
      ))}
      {dlg?.kind === 'group' && <GroupForm group={dlg.group} onClose={() => setDlg(null)} onDone={reload} />}
      {dlg?.kind === 'mod' && <ModifierForm group={dlg.group} modifier={dlg.modifier} ingredients={ing.data || []} onClose={() => setDlg(null)} onDone={reload} />}
    </div>
  )
}

function TablesTab() {
  const toast = useToast()
  const { can } = useAuth()
  const tables = useLoad(() => api.get('/restaurant/tables'), [])
  const [dlg, setDlg] = useState(null)
  const [f, setF] = useState({ name: '', seats: '4' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save() {
    if (!f.name.trim()) { setError('Give the table a name'); return }
    setBusy(true); setError('')
    const body = { name: f.name.trim(), seats: Number(f.seats) || 1 }
    try {
      if (dlg.table) await api.put(`/restaurant/tables/${dlg.table.id}`, body)
      else await api.post('/restaurant/tables', body)
      toast('Table saved'); setDlg(null); tables.reload()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function setActive(t, active) {
    try { await api.put(`/restaurant/tables/${t.id}?active=${active}`, { name: t.name, seats: t.seats }); tables.reload() } catch (e) { toast(e.message, 'error') }
  }
  const manage = can('TABLES_MANAGE')
  return (
    <div className="stack">
      {manage && <div><button className="btn primary" onClick={() => { setF({ name: '', seats: '4' }); setError(''); setDlg({}) }}><Plus size={18} /> Add table</button></div>}
      <ErrorBox error={tables.error} onRetry={tables.reload} />
      {tables.loading && <ListSkeleton />}
      {tables.data && tables.data.length === 0 && <div className="section"><Empty title="No tables yet">Add your tables so waiters can start dine-in orders.</Empty></div>}
      {tables.data && tables.data.length > 0 && (
        <div className="section list">
          {tables.data.map((t) => (
            <div className="list-item" key={t.id} style={{ cursor: 'default' }}>
              <div className="grow"><div className="title">{t.name} {!t.active && <span className="badge gray">Not in use</span>}</div><div className="meta">{t.seats} seats</div></div>
              {manage && <><button className="btn sm" onClick={() => { setF({ name: t.name, seats: String(t.seats) }); setError(''); setDlg({ table: t }) }}>Edit</button><button className="btn sm" onClick={() => setActive(t, !t.active)}>{t.active ? 'Stop using' : 'Use again'}</button></>}
            </div>
          ))}
        </div>
      )}
      {dlg && (
        <Modal title={dlg.table ? 'Edit table' : 'Add table'} onClose={() => setDlg(null)}>
          <Field label="Table name" htmlFor="t-name" hint="For example Table 1 or Patio 3"><input id="t-name" className="input" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Seats" htmlFor="t-seats"><input id="t-seats" className="input" type="number" min="1" max="100" value={f.seats} onChange={(e) => setF({ ...f, seats: e.target.value })} /></Field>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </Modal>
      )}
    </div>
  )
}

export default function Menu() {
  const { can } = useAuth()
  const [tab, setTab] = useState('items')
  const groups = useLoad(() => api.get('/restaurant/modifier-groups'), [])
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Menu and tables</h1><p className="sub">Dishes, prices, recipes, options and tables</p></div></div>
      <div className="tabs" role="tablist">
        <button role="tab" className="tab" aria-selected={tab === 'items'} onClick={() => setTab('items')}>Menu items</button>
        <button role="tab" className="tab" aria-selected={tab === 'options'} onClick={() => setTab('options')}>Options and extras</button>
        {(can('TABLES_MANAGE') || can('SALES_CREATE')) && <button role="tab" className="tab" aria-selected={tab === 'tables'} onClick={() => setTab('tables')}>Tables</button>}
      </div>
      <ErrorBox error={groups.error} onRetry={groups.reload} />
      {tab === 'items' && <ItemsTab groups={groups.data || []} />}
      {tab === 'options' && <OptionsTab groups={groups.data || []} reload={groups.reload} />}
      {tab === 'tables' && <TablesTab />}
    </div>
  )
}
