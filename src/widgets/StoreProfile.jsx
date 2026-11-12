import { useEffect, useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { api } from '../lib/api'
import { Field, Skeleton, useLoad, useToast } from '../components.jsx'

/** Keeps a logo under the server's 300 KB limit; a PNG is re-drawn smaller so transparency survives. */
async function fit(file) {
  if (file.size <= 280 * 1024) return file
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 480 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not read that image'))), 'image/png'))
}

/** Logo, social links and opening hours: the business details shown in the online store's header and footer. */
export default function StoreProfile({ canEdit }) {
  const p = useLoad(() => api.get('/store/profile'), [])
  const toast = useToast()
  const input = useRef(null)
  const [f, setF] = useState(null)
  const [busy, setBusy] = useState('')
  useEffect(() => { if (p.data) setF({ instagramUrl: p.data.instagramUrl || '', facebookUrl: p.data.facebookUrl || '', xUrl: p.data.xUrl || '', tiktokUrl: p.data.tiktokUrl || '', openingHours: p.data.openingHours || '' }) }, [p.data])
  if (p.error) return null
  if (!f) return <Skeleton height={160} />
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    setBusy('save')
    try { p.setData(await api.put('/store/profile', f)); toast('Store profile saved') } catch (x) { toast(x.message, 'error') } finally { setBusy('') }
  }
  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy('logo')
    try {
      const blob = await fit(file)
      const fd = new FormData()
      fd.append('file', blob, 'logo')
      p.setData(await api.upload('/store/logo', fd)); toast('Logo saved')
    } catch (x) { toast(x.message || 'Could not upload the logo', 'error') } finally { setBusy('') }
  }
  async function removeLogo() {
    setBusy('logo')
    try { p.setData(await api.del('/store/logo')); toast('Logo removed') } catch (x) { toast(x.message, 'error') } finally { setBusy('') }
  }
  return (
    <section className="section pad stack">
      <h2>Logo, links and opening hours</h2>
      <p className="muted small">Shown in your store's header, footer and contact page. Anything you leave empty is not shown.</p>
      <div className="row">
        {p.data.logoUrl ? <img src={p.data.logoUrl} alt="Your logo" style={{ height: 56, maxWidth: 160, objectFit: 'contain', background: '#f2f2f2', borderRadius: 8, padding: 4 }} /> : <div className="shop-img ph" style={{ width: 56, height: 56, borderRadius: 8 }}><ImagePlus size={22} /></div>}
        <div className="stack-sm">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
          <button type="button" className="btn sm" disabled={!canEdit || !!busy} onClick={() => input.current.click()}>{busy === 'logo' ? 'Uploading…' : p.data.logoUrl ? 'Change logo' : 'Add logo'}</button>
          {p.data.logoUrl && <button type="button" className="btn sm danger" disabled={!canEdit || !!busy} onClick={removeLogo}>Remove</button>}
        </div>
      </div>
      <form className="form-grid" onSubmit={save}>
        <fieldset disabled={!canEdit} style={{ border: 0, padding: 0, margin: 0 }} className="form-grid">
          <div className="form-grid two">
            <Field label="Instagram link" htmlFor="sp1"><input id="sp1" className="input" inputMode="url" placeholder="https://instagram.com/yourbusiness" value={f.instagramUrl} onChange={set('instagramUrl')} /></Field>
            <Field label="Facebook link" htmlFor="sp2"><input id="sp2" className="input" inputMode="url" placeholder="https://facebook.com/yourbusiness" value={f.facebookUrl} onChange={set('facebookUrl')} /></Field>
            <Field label="X (Twitter) link" htmlFor="sp3"><input id="sp3" className="input" inputMode="url" placeholder="https://x.com/yourbusiness" value={f.xUrl} onChange={set('xUrl')} /></Field>
            <Field label="TikTok link" htmlFor="sp4"><input id="sp4" className="input" inputMode="url" placeholder="https://tiktok.com/@yourbusiness" value={f.tiktokUrl} onChange={set('tiktokUrl')} /></Field>
          </div>
          <Field label="Opening hours" htmlFor="sp5" hint="One line per day or range, for example Mon-Sat 8am-7pm"><textarea id="sp5" className="input" rows={3} maxLength={600} value={f.openingHours} onChange={set('openingHours')} /></Field>
          <div><button className="btn primary" disabled={!!busy}>{busy === 'save' ? 'Saving…' : 'Save'}</button></div>
        </fieldset>
      </form>
    </section>
  )
}
