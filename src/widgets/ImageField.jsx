import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { api } from '../lib/api'
import { useToast } from '../components.jsx'

/** Shrinks the photo on the phone first (max 900px JPEG) so uploads stay small on slow connections. */
async function shrink(file) {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 900 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not read that image'))), 'image/jpeg', 0.82))
}

export default function ImageField({ productId, url, onChange }) {
  const toast = useToast()
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const blob = await shrink(file)
      const fd = new FormData()
      fd.append('file', blob, 'photo.jpg')
      const r = await api.upload(`/products/${productId}/image`, fd)
      onChange(r.imageUrl); toast('Photo saved')
    } catch (err) { toast(err.message || 'Could not upload the photo', 'error') } finally { setBusy(false) }
  }
  async function remove() {
    try { await api.del(`/products/${productId}/image`); onChange(null) } catch (err) { toast(err.message, 'error') }
  }
  return (
    <div className="row">
      {url ? <img src={url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} /> : <div className="shop-img ph" style={{ width: 72, height: 72, borderRadius: 8 }}><ImagePlus size={24} /></div>}
      <div className="stack-sm">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
        <button type="button" className="btn sm" disabled={busy} onClick={() => input.current.click()}>{busy ? 'Uploading…' : url ? 'Change photo' : 'Add photo'}</button>
        {url && <button type="button" className="btn sm danger" onClick={remove}>Remove</button>}
      </div>
    </div>
  )
}
