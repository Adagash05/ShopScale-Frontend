import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Upload } from 'lucide-react'
import { api } from '../lib/api'
import { useToast } from '../components.jsx'

/** Add many products at once from a CSV file (Excel or Google Sheets can save one). Each row is checked by the server. */
export default function ProductImport() {
  const toast = useToast()
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function template() {
    try {
      const blob = await api.download('/products/import-template.csv')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'shopscale-product-import-template.csv'; a.click(); URL.revokeObjectURL(url)
    } catch (e) { toast(e.message, 'error') }
  }

  async function send(e) {
    e.preventDefault()
    if (!file) { setError('Choose a CSV file first'); return }
    setBusy(true); setError(''); setResult(null)
    try {
      const fd = new FormData(); fd.append('file', file)
      setResult(await api.upload('/products/import', fd))
    } catch (x) { setError(x.message || 'Could not import that file') } finally { setBusy(false) }
  }

  return (
    <form className="stack" onSubmit={send} noValidate>
      <div className="page-head"><div><h1>Import products</h1><p className="sub">Add many products at once from a CSV file</p></div></div>
      <section className="section pad stack-sm">
        <h2>1. Get the template</h2>
        <p className="muted">Columns: name, category, selling price, cost price, quantity (what you have now), low stock level, sku, barcode. Only name and selling price are required. Delete the sample row before you import.</p>
        <button type="button" className="btn" onClick={template}><Download size={18} aria-hidden="true" /> Download template</button>
      </section>
      <section className="section pad stack-sm">
        <h2>2. Upload your file</h2>
        <input type="file" accept=".csv,text/csv" aria-label="CSV file" onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); setError('') }} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy || !file}><Upload size={18} aria-hidden="true" /> {busy ? 'Importing…' : 'Import products'}</button>
        <p className="muted small">Up to 500 products at a time. A product whose name already exists is skipped, so importing the same file twice does not create copies. Your plan's product limit still applies.</p>
      </section>
      {result && (
        <section className="section pad stack-sm" role="status">
          <h2>{result.created} {result.created === 1 ? 'product' : 'products'} added{result.failed ? `, ${result.failed} not imported` : ''}</h2>
          {result.errors.map((r) => <div className="kv" key={r.row}><span className="k">Row {r.row}{r.name ? `: ${r.name}` : ''}</span><span className="v">{r.message}</span></div>)}
          <Link className="btn" to="/products">See products</Link>
        </section>
      )}
    </form>
  )
}
