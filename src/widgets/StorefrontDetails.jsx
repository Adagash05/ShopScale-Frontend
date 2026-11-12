import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { money } from '../lib/format.js'
import { Field, Skeleton, useLoad, useToast } from '../components.jsx'

async function shrink(file) {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 1100 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not read that image'))), 'image/jpeg', 0.8))
}

/** Online-store details of one saved product: sale price, specifications and extra photos. Not a form, so it can sit inside the product form. */
export default function StorefrontDetails({ productId, canEdit }) {
  const d = useLoad(() => api.get(`/store/products/${productId}/presentation`), [productId])
  const toast = useToast()
  const input = useRef(null)
  const [specs, setSpecs] = useState('')
  const [was, setWas] = useState({})
  const [busy, setBusy] = useState('')
  useEffect(() => {
    if (!d.data) return
    setSpecs(d.data.specs || '')
    setWas(Object.fromEntries(d.data.variants.map((v) => [v.variantId, v.compareAtPrice ? String(v.compareAtPrice) : ''])))
  }, [d.data])
  if (d.error) return null
  if (!d.data) return <Skeleton height={120} />

  async function save() {
    setBusy('save')
    try {
      const compareAt = Object.fromEntries(Object.entries(was).map(([k, v]) => [k, v === '' ? null : Number(v)]))
      d.setData(await api.put(`/store/products/${productId}/presentation`, { specs, compareAt })); toast('Online store details saved')
    } catch (e) { toast(e.message, 'error') } finally { setBusy('') }
  }
  async function add(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy('photo')
    try { const fd = new FormData(); fd.append('file', await shrink(file), 'photo.jpg'); d.setData(await api.upload(`/store/products/${productId}/gallery`, fd)); toast('Photo added') } catch (x) { toast(x.message || 'Could not upload the photo', 'error') } finally { setBusy('') }
  }
  async function remove(id) {
    setBusy('photo')
    try { d.setData(await api.del(`/store/products/${productId}/gallery/${id}`)); toast('Photo removed') } catch (x) { toast(x.message, 'error') } finally { setBusy('') }
  }
  return (
    <div className="section pad form-grid">
      <h2>Online store details</h2>
      <p className="muted small">Shown on this product's page in your online store. Your selling price below is always what customers pay.</p>
      <Field label="Sale price" hint="To show a price as reduced, enter the higher original price. Leave empty for no sale.">
        <div className="stack-sm">
          {d.data.variants.map((v) => (
            <label key={v.variantId} className="row" style={{ gap: 10 }}>
              <span style={{ minWidth: 120 }}>{v.label || 'Price'} · now {money(v.price)}</span>
              <input className="input" inputMode="decimal" placeholder="Original price" aria-label={`Original price for ${v.label || 'this product'}`} disabled={!canEdit} value={was[v.variantId] ?? ''} onChange={(e) => setWas({ ...was, [v.variantId]: e.target.value.replace(/[^\d.]/g, '') })} />
            </label>
          ))}
        </div>
      </Field>
      <Field label="Specifications" htmlFor="spx" hint="One per line as Label: value, for example Material: Cotton"><textarea id="spx" className="input" rows={4} maxLength={2000} disabled={!canEdit} value={specs} onChange={(e) => setSpecs(e.target.value)} /></Field>
      <div><button type="button" className="btn primary" disabled={!canEdit || !!busy} onClick={save}>{busy === 'save' ? 'Saving…' : 'Save store details'}</button></div>
      <Field label={`Extra photos (${d.data.gallery.length} of 8)`} hint="Shown as a gallery under the main photo">
        <div className="row wrap" style={{ gap: 10 }}>
          {d.data.gallery.map((g) => (
            <div key={g.id} style={{ position: 'relative' }}>
              <img src={g.url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
              {canEdit && <button type="button" className="icon-btn" aria-label="Remove photo" disabled={!!busy} onClick={() => remove(g.id)} style={{ position: 'absolute', top: -8, right: -8, background: '#fff', borderRadius: '50%' }}><Trash2 size={14} /></button>}
            </div>
          ))}
          {canEdit && d.data.gallery.length < 8 && (
            <>
              <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={add} />
              <button type="button" className="btn sm" disabled={!!busy} onClick={() => input.current.click()}><ImagePlus size={16} /> {busy === 'photo' ? 'Uploading…' : 'Add photo'}</button>
            </>
          )}
        </div>
      </Field>
    </div>
  )
}
