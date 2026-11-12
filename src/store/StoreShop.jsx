import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { SORTS, filterProducts, sortProducts } from './presentation.js'
import { useStore } from './StoreContext.jsx'
import { usePageTitle } from './StoreLayout.jsx'
import { Empty, MenuRow, ProductCard, Skeletons } from './ui.jsx'

const PAGE = 24

export default function StoreShop() {
  const { info, base, pres, products, categories, itemsLoading, itemsError, reload } = useStore()
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') || ''
  const category = sp.get('category') || ''
  const sort = sp.get('sort') || 'featured'
  const inStock = sp.get('stock') === '1'
  const [shown, setShown] = useState(PAGE)
  const cat = categories.find((c) => c.id === category)
  usePageTitle(`${cat ? cat.name : pres.all} | ${info.name}`)
  const set = (k, v) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); setShown(PAGE) }
  const list = useMemo(() => sortProducts(filterProducts(products, { q, category, inStockOnly: inStock }), sort), [products, q, category, sort, inStock])
  const filtered = q || category || inStock
  const menu = pres.layout === 'menu'

  // Menu layout: grouped by section (category) like a printed menu.
  const sections = useMemo(() => {
    if (!menu) return []
    const g = new Map()
    for (const p of list) { const k = p.categoryName || 'More'; (g.get(k) || g.set(k, []).get(k)).push(p) }
    return [...g.entries()].sort((a, b) => (a[0] === 'More') - (b[0] === 'More') || a[0].localeCompare(b[0]))
  }, [list, menu])

  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb"><Link to={base}>Home</Link><span>/</span><span>{cat ? <><Link to={`${base}/shop`}>{pres.shop}</Link> / {cat.name}</> : pres.shop}</span></nav>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>{cat ? cat.name : q ? `Results for “${q}”` : pres.all}</h1>
          {!itemsLoading && <p className="muted" style={{ marginTop: 8 }}>{list.length} {list.length === 1 ? 'item' : 'items'}</p>}
        </div>
      </div>
      <div className="wrap">
        <div className="toolbar">
          <div className="toolbar-row">
            <div className="search-box"><Search size={16} aria-hidden="true" /><input className="input" type="search" value={q} onChange={(e) => set('q', e.target.value)} placeholder={`Search ${pres.shop.toLowerCase()}`} aria-label="Search" /></div>
            <div className="toolbar-row" style={{ gap: 14 }}>
              <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={inStock} onChange={(e) => set('stock', e.target.checked ? '1' : '')} style={{ accentColor: 'var(--accent)' }} /> Available only</label>
              {!menu && <select className="select" value={sort} onChange={(e) => set('sort', e.target.value === 'featured' ? '' : e.target.value)} aria-label="Sort"> {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
            </div>
          </div>
          {categories.length > 0 && (
            <div className="chips" role="group" aria-label="Categories">
              <button className={`chip ${!category ? 'on' : ''}`} onClick={() => set('category', '')}>All</button>
              {categories.map((c) => <button key={c.id} className={`chip ${category === c.id ? 'on' : ''}`} onClick={() => set('category', c.id)}>{c.name}</button>)}
            </div>
          )}
        </div>

        {itemsError && <Empty title="We could not load the catalogue" action={<button className="btn" onClick={reload}>Try again</button>}>Check your connection and try again.</Empty>}
        {itemsLoading && <Skeletons n={8} />}
        {!itemsLoading && !itemsError && list.length === 0 && (
          <Empty title={filtered ? 'No matches' : 'Nothing here yet'} action={filtered ? <button className="btn" onClick={() => setSp({}, { replace: true })}>Clear filters</button> : null}>
            {filtered ? 'Try a different search or category.' : 'This store has not added any products yet. Please check back soon.'}
          </Empty>
        )}
        {menu ? sections.map(([name, ps]) => <section className="menu-cat" key={name}><h2>{name}</h2>{ps.map((p) => <MenuRow key={p.id} p={p} />)}</section>)
          : list.length > 0 && <div className="grid">{list.slice(0, shown).map((p) => <ProductCard key={p.id} p={p} />)}</div>}
        {!menu && list.length > shown && <div style={{ textAlign: 'center', padding: '40px 0' }}><button className="btn" onClick={() => setShown((n) => n + PAGE)}>Show more ({list.length - shown} left)</button></div>}
        <div style={{ height: 64 }} />
      </div>
    </>
  )
}
