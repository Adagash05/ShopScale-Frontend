import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Confirm, ErrorBox, Field, Skeleton, useLoad, useToast } from '../components.jsx'
import StockAdjust from '../StockAdjust.jsx'
import ImageField from '../widgets/ImageField.jsx'

const UNITS = ['piece', 'kg', 'g', 'litre', 'ml', 'pack', 'carton', 'dozen', 'bag', 'bottle', 'crate', 'tray', 'portion', 'plate', 'bundle', 'metre']
const blankVariant = () => ({ key: Math.random().toString(36).slice(2), id: null, label: '', price: '', cost: '', quantity: '', sku: '', barcode: '', lowStockThreshold: '', stock: null })

export default function ProductForm() {
  const { id } = useParams()
  const editing = !!id
  const nav = useNavigate()
  const toast = useToast()
  const { can } = useAuth()
  const canSave = editing ? can('PRODUCTS_EDIT') : can('PRODUCTS_CREATE')
  const canStock = can('STOCK_ADJUST') || can('STOCK_RESTOCK')
  const cats = useLoad(() => api.get('/categories'), [])
  const [loaded, setLoaded] = useState(!editing)
  const [loadError, setLoadError] = useState(null)
  const [product, setProduct] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', categoryId: '', unit: 'piece', allowDecimal: false })
  const [variants, setVariants] = useState([blankVariant()])
  const [multi, setMulti] = useState(false)
  const [more, setMore] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [adjust, setAdjust] = useState(null)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [newCat, setNewCat] = useState('')

  function hydrate(p) {
    setProduct(p)
    setForm({ name: p.name, description: p.description || '', categoryId: p.categoryId || '', unit: p.variants[0]?.unit || 'piece', allowDecimal: !!p.variants[0]?.allowDecimal })
    const vs = p.variants.map((v) => ({ key: v.id, id: v.id, label: v.label || '', price: String(v.price), cost: String(v.cost), quantity: '', sku: v.sku || '', barcode: v.barcode || '', lowStockThreshold: String(v.lowStockThreshold), stock: v.quantity }))
    setVariants(vs.length ? vs : [blankVariant()])
    setMulti(p.variants.length > 1 || p.variants.some((v) => v.label))
    setMore(p.variants.some((v) => v.sku || v.barcode || Number(v.cost) > 0) || !!p.description || !!p.categoryId)
  }

  useEffect(() => {
    if (!editing) return
    api.get(`/products/${id}`).then((p) => { hydrate(p); setLoaded(true) }, setLoadError)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const setV = (key, patch) => setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)))

  async function addCategory() {
    if (!newCat.trim()) return
    try {
      const c = await api.post('/categories', { name: newCat.trim() })
      await cats.reload()
      setForm((f) => ({ ...f, categoryId: c.id })); setNewCat('')
    } catch (e) { toast(e.message, 'error') }
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Enter the product name'
    variants.forEach((v, i) => {
      if (v.price === '' || Number(v.price) < 0) errs[`price${i}`] = 'Enter the selling price'
      if (multi && !v.label.trim()) errs[`label${i}`] = 'Give this option a name, e.g. Size M'
      if (v.quantity !== '' && (!(Number(v.quantity) >= 0) || (!form.allowDecimal && !Number.isInteger(Number(v.quantity))))) errs[`qty${i}`] = form.allowDecimal ? 'Enter a quantity of zero or more' : 'Use a whole number'
    })
    return errs
  }

  async function save(e) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs); setFormError('')
    if (Object.keys(errs).length) return
    const body = {
      name: form.name.trim(), description: form.description || null, categoryId: form.categoryId || null, imageUrl: product?.imageUrl || null,
      variants: variants.map((v) => ({
        id: v.id, label: multi ? v.label.trim() : null, sku: v.sku || null, barcode: v.barcode || null,
        price: Number(v.price), cost: v.cost === '' ? 0 : Number(v.cost),
        quantity: v.id ? null : (v.quantity === '' ? 0 : Number(v.quantity)),
        lowStockThreshold: v.lowStockThreshold === '' ? null : Number(v.lowStockThreshold),
        unit: form.unit, allowDecimal: form.allowDecimal,
      })),
    }
    setBusy(true)
    try {
      if (editing) { hydrate(await api.put(`/products/${id}`, body)); toast('Product saved') }
      else { await api.post('/products', body); toast('Product added'); nav('/products') }
    } catch (err) { setFormError(err.message) } finally { setBusy(false) }
  }

  async function archiveOrRestore() {
    setBusy(true)
    try {
      const p = await api.post(`/products/${id}/${product.status === 'ARCHIVED' ? 'restore' : 'archive'}`)
      hydrate(p); toast(p.status === 'ARCHIVED' ? 'Product archived' : 'Product restored'); setConfirmArchive(false)
    } catch (err) { toast(err.message, 'error'); setConfirmArchive(false) } finally { setBusy(false) }
  }

  if (loadError) return <ErrorBox error={loadError} />
  if (!loaded) return <div className="stack"><Skeleton height={28} width="40%" /><Skeleton height={200} /></div>
  if (!canSave) return <div className="banner">You do not have permission to change products. <Link to="/products">Back</Link></div>
  const archived = product?.status === 'ARCHIVED'

  return (
    <form className="stack" onSubmit={save} noValidate>
      <div className="page-head">
        <div className="row"><Link to="/products" className="icon-btn" aria-label="Back to products"><ArrowLeft size={20} /></Link><h1>{editing ? 'Edit product' : 'Add product'}</h1></div>
        {archived && <span className="badge gray">Archived</span>}
      </div>

      <div className="section pad form-grid">
        {editing && product && <Field label="Photo (shown in your online store)"><ImageField productId={id} url={product.imageUrl} onChange={(u) => setProduct({ ...product, imageUrl: u })} /></Field>}
        <Field label="Product name" htmlFor="pname" error={errors.name}><input id="pname" className="input" value={form.name} autoFocus={!editing} aria-invalid={!!errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <div className="form-grid two">
          <Field label="Sold by" htmlFor="punit" hint="How you count or measure this product">
            <select id="punit" className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
          <label className="check"><input type="checkbox" checked={form.allowDecimal} onChange={(e) => setForm({ ...form, allowDecimal: e.target.checked })} /><span><strong>Can be sold in parts</strong><br /><span className="muted small">For example 1.5 kg or 0.25 litre.</span></span></label>
        </div>
        {!multi && variants.slice(0, 1).map((v, i) => (
          <div className="form-grid two" key={v.key}>
            <Field label="Selling price (₦)" htmlFor="pprice" error={errors[`price${i}`]}><input id="pprice" className="input" type="number" inputMode="decimal" min="0" value={v.price} aria-invalid={!!errors[`price${i}`]} onChange={(e) => setV(v.key, { price: e.target.value })} /></Field>
            {v.id ? (
              <Field label="In stock"><div className="row"><strong className="num">{v.stock}</strong>{canStock && <button type="button" className="btn sm" onClick={() => setAdjust({ variantId: v.id, name: form.name, current: v.stock })}>Update stock</button>}</div></Field>
            ) : (
              <Field label="How many do you have?" htmlFor="pqty" error={errors[`qty${i}`]}><input id="pqty" className="input" type="number" inputMode="decimal" min="0" step={form.allowDecimal ? '0.001' : '1'} value={v.quantity} onChange={(e) => setV(v.key, { quantity: e.target.value })} /></Field>
            )}
          </div>
        ))}
        <label className="check"><input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} /><span><strong>This product comes in sizes, colours or other options</strong><br /><span className="muted small">Each option has its own price and stock.</span></span></label>
      </div>

      {multi && (
        <div className="stack-sm">
          {variants.map((v, i) => (
            <div className="section pad form-grid" key={v.key}>
              <div className="row between"><h3>Option {i + 1}</h3>
                {variants.length > 1 && !v.stock && <button type="button" className="icon-btn" aria-label={`Remove option ${i + 1}`} onClick={() => setVariants((vs) => vs.filter((x) => x.key !== v.key))}><Trash2 size={18} /></button>}
              </div>
              <Field label="Name (e.g. Size M, Red)" htmlFor={`l${i}`} error={errors[`label${i}`]}><input id={`l${i}`} className="input" value={v.label} aria-invalid={!!errors[`label${i}`]} onChange={(e) => setV(v.key, { label: e.target.value })} /></Field>
              <div className="form-grid two">
                <Field label="Selling price (₦)" htmlFor={`p${i}`} error={errors[`price${i}`]}><input id={`p${i}`} className="input" type="number" inputMode="decimal" min="0" value={v.price} onChange={(e) => setV(v.key, { price: e.target.value })} /></Field>
                {v.id ? <Field label="In stock"><div className="row"><strong className="num">{v.stock}</strong>{canStock && <button type="button" className="btn sm" onClick={() => setAdjust({ variantId: v.id, name: `${form.name} (${v.label})`, current: v.stock })}>Update stock</button>}</div></Field>
                  : <Field label="How many?" htmlFor={`q${i}`} error={errors[`qty${i}`]}><input id={`q${i}`} className="input" type="number" inputMode="decimal" min="0" step={form.allowDecimal ? '0.001' : '1'} value={v.quantity} onChange={(e) => setV(v.key, { quantity: e.target.value })} /></Field>}
              </div>
              {more && (
                <div className="form-grid two">
                  <Field label="Cost price (₦)" htmlFor={`c${i}`}><input id={`c${i}`} className="input" type="number" inputMode="decimal" min="0" value={v.cost} onChange={(e) => setV(v.key, { cost: e.target.value })} /></Field>
                  <Field label="SKU" htmlFor={`s${i}`}><input id={`s${i}`} className="input" value={v.sku} onChange={(e) => setV(v.key, { sku: e.target.value })} /></Field>
                </div>
              )}
            </div>
          ))}
          <button type="button" className="btn" onClick={() => setVariants((vs) => [...vs, blankVariant()])}><Plus size={18} /> Add another option</button>
        </div>
      )}

      <button type="button" className="btn" onClick={() => setMore((m) => !m)} aria-expanded={more}>{more ? 'Hide extra details' : 'Add more details (optional)'}</button>
      {more && (
        <div className="section pad form-grid">
          {!multi && variants.slice(0, 1).map((v) => (
            <div className="form-grid two" key={v.key}>
              <Field label="Cost price (₦)" htmlFor="pcost" hint="What you paid. Used to estimate profit."><input id="pcost" className="input" type="number" inputMode="decimal" min="0" value={v.cost} onChange={(e) => setV(v.key, { cost: e.target.value })} /></Field>
              <Field label="Warn me when stock is below" htmlFor="plow" hint="Default is 5"><input id="plow" className="input" type="number" inputMode="decimal" min="0" step="any" value={v.lowStockThreshold} onChange={(e) => setV(v.key, { lowStockThreshold: e.target.value })} /></Field>
              <Field label="SKU" htmlFor="psku"><input id="psku" className="input" value={v.sku} onChange={(e) => setV(v.key, { sku: e.target.value })} /></Field>
              <Field label="Barcode" htmlFor="pbar"><input id="pbar" className="input" value={v.barcode} onChange={(e) => setV(v.key, { barcode: e.target.value })} /></Field>
            </div>
          ))}
          <Field label="Category" htmlFor="pcat">
            <select id="pcat" className="select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">No category</option>
              {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="row"><input className="input" placeholder="New category name" aria-label="New category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} /><button type="button" className="btn" onClick={addCategory}>Add</button></div>
          <Field label="Description" htmlFor="pdesc"><textarea id="pdesc" className="textarea" value={form.description} maxLength={2000} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </div>
      )}

      {formError && <p className="form-error" role="alert">{formError}</p>}
      <button className="btn primary block" style={{ minHeight: 52 }} disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
      {editing && can('PRODUCTS_ARCHIVE') && <button type="button" className={`btn block ${archived ? '' : 'danger'}`} onClick={() => setConfirmArchive(true)}>{archived ? 'Restore product' : 'Archive product'}</button>}

      {adjust && <StockAdjust {...adjust} onClose={() => setAdjust(null)} onDone={() => api.get(`/products/${id}`).then(hydrate)} />}
      {confirmArchive && <Confirm title={archived ? 'Restore this product?' : 'Archive this product?'} danger={!archived} busy={busy}
        message={archived ? 'It will appear in your product list and in Sell again.' : 'It will no longer appear in Sell. Your sales history stays exactly as it is, and you can restore it any time.'}
        confirmLabel={archived ? 'Restore' : 'Archive'} onConfirm={archiveOrRestore} onClose={() => setConfirmArchive(false)} />}
    </form>
  )
}
