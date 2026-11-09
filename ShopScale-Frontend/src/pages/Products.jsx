import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, ChevronRight } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Empty, ErrorBox, ListSkeleton, useDebounced, useLoad } from '../components.jsx'
import { money } from '../lib/format.js'

function priceText(vs) {
  if (!vs.length) return '—'
  const ps = vs.map((v) => Number(v.price))
  const lo = Math.min(...ps), hi = Math.max(...ps)
  return lo === hi ? money(lo) : `${money(lo)} – ${money(hi)}`
}

export default function Products() {
  const { can } = useAuth()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const [q, setQ] = useState(sp.get('q') || '')
  const dq = useDebounced(q)
  const [cat, setCat] = useState('')
  const [archived, setArchived] = useState(false)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [more, setMore] = useState(false)
  const [state, setState] = useState({ loading: true, error: null })
  const cats = useLoad(() => api.get('/categories'), [])

  useEffect(() => { setPage(0) }, [dq, cat, archived])

  function load() {
    let live = true
    setState({ loading: true, error: null })
    api.get('/products', { q: dq, categoryId: cat, archived, page, size: 20 }).then(
      (r) => { if (!live) return; setRows((prev) => (page === 0 ? r.content : [...prev, ...r.content])); setMore(!r.last); setState({ loading: false, error: null }) },
      (error) => live && setState({ loading: false, error }),
    )
    return () => { live = false }
  }
  useEffect(load, [dq, cat, archived, page]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Products</h1><p className="sub">What you sell and how many you have</p></div>
        {can('PRODUCTS_CREATE') && <Link to="/products/new" className="btn primary"><Plus size={18} /> Add product</Link>}
      </div>
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--muted)' }} aria-hidden="true" />
        <input className="input" style={{ paddingLeft: 38 }} placeholder="Search by name, SKU or barcode" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="chips" role="group" aria-label="Filter">
        <button className={`chip ${!cat && !archived ? 'on' : ''}`} onClick={() => { setCat(''); setArchived(false) }}>All</button>
        {cats.data?.map((c) => <button key={c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => { setCat(c.id); setArchived(false) }}>{c.name}</button>)}
        <button className={`chip ${archived ? 'on' : ''}`} onClick={() => { setArchived(true); setCat('') }}>Archived</button>
      </div>
      <ErrorBox error={state.error} onRetry={load} />
      {state.loading && page === 0 && <ListSkeleton />}
      {!state.loading && !state.error && rows.length === 0 && (
        <div className="section"><Empty title={archived ? 'No archived products' : dq || cat ? 'No products found' : 'Add your first product'}
          action={!dq && !cat && !archived && can('PRODUCTS_CREATE') && <Link className="btn primary" to="/products/new">Add product</Link>}>
          {!dq && !cat && !archived && 'Enter a name, a price and how many you have. That is all you need.'}
        </Empty></div>
      )}
      {rows.length > 0 && (
        <div className="section list">
          {rows.map((p) => {
            const low = p.variants.some((v) => v.quantity <= v.lowStockThreshold)
            return (
              <button key={p.id} className="list-item" onClick={() => nav(`/products/${p.id}`)}>
                <div className="grow">
                  <div className="title">{p.name}</div>
                  <div className="meta">{p.categoryName ? `${p.categoryName} · ` : ''}{p.variants.length > 1 ? `${p.variants.length} options · ` : ''}{p.totalQuantity} in stock {low && <span className="badge warn">Running low</span>}</div>
                </div>
                <div className="num title">{priceText(p.variants)}</div>
                <ChevronRight size={18} className="chev" />
              </button>
            )
          })}
        </div>
      )}
      {more && <button className="btn block" disabled={state.loading} onClick={() => setPage((n) => n + 1)}>{state.loading ? 'Loading…' : 'Show more'}</button>}
    </div>
  )
}
