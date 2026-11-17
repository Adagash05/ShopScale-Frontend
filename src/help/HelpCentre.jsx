import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Outlet, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Calendar, ChevronDown, ChevronRight, Clock, Menu as MenuIcon, MapPin, MessageCircle, Package, Phone, Rocket, Search, Settings, ShoppingBasket, ShoppingCart, Store, ThumbsDown, ThumbsUp, Truck, UtensilsCrossed, Users, Wallet, Wrench, X } from 'lucide-react'
import { useSeo } from '../marketing/Seo.jsx'
import { ARTICLES, CATEGORIES, POPULAR, byPath, catById, excerpt, neighbours, related, search } from './data.js'
import { Blocks } from './blocks.jsx'
import { SUPPORT_PHONE, SUPPORT_TEL, SUPPORT_WHATSAPP } from './support.js'
import './help.css'

const ICONS = { rocket: Rocket, package: Package, store: Store, orders: ShoppingBasket, cart: ShoppingCart, truck: Truck, kitchen: UtensilsCrossed, calendar: Calendar, users: Users, map: MapPin, wallet: Wallet, settings: Settings, wrench: Wrench }
export const CatIcon = ({ name, size = 22 }) => { const I = ICONS[name] || BookOpen; return <I size={size} aria-hidden="true" /> }

/** The call and WhatsApp buttons. These are the only support channels. */
export function SupportCard({ compact = false }) {
  return (
    <section className={`hc-support ${compact ? 'compact' : ''}`} aria-labelledby={compact ? undefined : 'hc-support-title'}>
      <div>
        <h2 id="hc-support-title">Still need help? We're here to assist.</h2>
        <p>If you need additional information or assistance using ShopScale, contact our support team by phone or send us a message on WhatsApp.</p>
      </div>
      <div className="hc-support-actions">
        <a className="btn primary" href={SUPPORT_TEL}><Phone size={18} aria-hidden="true" /> Call: {SUPPORT_PHONE}</a>
        <a className="btn wa" href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> WhatsApp: Chat with ShopScale Support</a>
      </div>
    </section>
  )
}

/** A small, always-available way to reach support that does not cover the article. */
function SupportFab() {
  const [open, setOpen] = useState(false)
  return (
    <div className="hc-fab">
      {open && (
        <div className="hc-fab-pop" role="dialog" aria-label="Contact ShopScale Support">
          <strong>ShopScale Support</strong>
          <a href={SUPPORT_TEL}><Phone size={16} aria-hidden="true" /> Call {SUPPORT_PHONE}</a>
          <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true" /> Chat on WhatsApp</a>
        </div>
      )}
      <button className="hc-fab-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? <X size={18} aria-hidden="true" /> : <MessageCircle size={18} aria-hidden="true" />}<span>Need help?</span></button>
    </div>
  )
}

export function SearchBox({ initial = '', size = 'lg', autoFocus = false }) {
  const nav = useNavigate()
  const [q, setQ] = useState(initial)
  const [focus, setFocus] = useState(false)
  const box = useRef(null)
  useEffect(() => setQ(initial), [initial])
  const hits = useMemo(() => (q.trim().length >= 2 ? search(q, 6) : []), [q])
  useEffect(() => {
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setFocus(false) }
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [])
  function go(e) { e.preventDefault(); if (q.trim()) { setFocus(false); nav(`/help/search?q=${encodeURIComponent(q.trim())}`) } }
  return (
    <form className={`hc-search ${size}`} role="search" onSubmit={go} ref={box}>
      <Search size={20} aria-hidden="true" />
      <input type="search" value={q} autoFocus={autoFocus} placeholder="Search the Help Centre, for example: add products, Paystack, refunds" aria-label="Search the Help Centre" onFocus={() => setFocus(true)} onChange={(e) => { setQ(e.target.value); setFocus(true) }} />
      <button className="btn primary" type="submit">Search</button>
      {focus && hits.length > 0 && (
        <ul className="hc-suggest" aria-label="Suggested articles">
          {hits.map((a) => <li key={a.path}><Link to={a.path} onClick={() => setFocus(false)}><strong>{a.title}</strong><span>{a.catTitle}</span></Link></li>)}
          <li className="all"><Link to={`/help/search?q=${encodeURIComponent(q.trim())}`} onClick={() => setFocus(false)}>See all results for "{q.trim()}"</Link></li>
        </ul>
      )}
    </form>
  )
}

function Sidebar({ current, onNavigate }) {
  const [open, setOpen] = useState(() => new Set(current ? [current.cat] : ['getting-started']))
  useEffect(() => { if (current) setOpen((s) => new Set([...s, current.cat])) }, [current?.cat])
  const toggle = (id) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  return (
    <nav className="hc-side" aria-label="Help Centre contents">
      {CATEGORIES.map((c) => {
        const isOpen = open.has(c.id)
        return (
          <div key={c.id} className="hc-side-cat">
            <button className={current?.cat === c.id ? 'on' : ''} aria-expanded={isOpen} onClick={() => toggle(c.id)}>
              <CatIcon name={c.icon} size={18} /><span>{c.title}</span><ChevronDown size={16} className={isOpen ? 'open' : ''} aria-hidden="true" />
            </button>
            {isOpen && (
              <ul>
                <li><Link to={`/help/${c.id}`} onClick={onNavigate} className={!current?.id && current?.cat === c.id ? 'on' : ''}>All {c.title.toLowerCase()} articles</Link></li>
                {c.articles.map((a) => <li key={a.id}><Link to={`/help/${c.id}/${a.id}`} onClick={onNavigate} aria-current={current?.cat === c.id && current?.id === a.id ? 'page' : undefined} className={current?.cat === c.id && current?.id === a.id ? 'on' : ''}>{a.title}</Link></li>)}
              </ul>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export function Breadcrumbs({ items }) {
  return (
    <nav className="hc-crumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((it, i) => (
          <li key={it.label}>
            {it.to && i < items.length - 1 ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
            {i < items.length - 1 && <ChevronRight size={14} aria-hidden="true" />}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** Layout for every /help page: dedicated header, sidebar, mobile drawer and the persistent support option. */
export function HelpLayout() {
  const params = useParams()
  const { pathname } = useLocation()
  const [drawer, setDrawer] = useState(false)
  const current = params.cat && params.article ? byPath[`${params.cat}/${params.article}`] : params.cat ? { cat: params.cat } : null
  useEffect(() => { setDrawer(false) }, [pathname])
  return (
    <div className="hc">
      <div className="hc-bar">
        <div className="mk-wrap hc-bar-in">
          <Link to="/help" className="hc-bar-title"><BookOpen size={20} aria-hidden="true" /> ShopScale Help Centre</Link>
          <div className="hc-bar-search"><SearchBox size="sm" /></div>
          <button className="btn sm hc-drawer-btn" aria-expanded={drawer} onClick={() => setDrawer((d) => !d)}>{drawer ? <X size={16} aria-hidden="true" /> : <MenuIcon size={16} aria-hidden="true" />} Topics</button>
        </div>
      </div>
      <div className="mk-wrap hc-grid">
        <aside className={`hc-aside ${drawer ? 'open' : ''}`}><Sidebar current={current} onNavigate={() => setDrawer(false)} /></aside>
        <div className="hc-main"><Outlet /></div>
      </div>
      <SupportFab />
    </div>
  )
}

export function HelpHome() {
  useSeo({ title: 'Help Centre', description: 'Step-by-step guides for ShopScale: set up your business, add products, open your online store, process orders and manage your money.', path: '/help' })
  const popular = POPULAR.map((k) => byPath[k]).filter(Boolean)
  return (
    <div className="hc-home">
      <section className="hc-hero">
        <h1>How can we help you?</h1>
        <p>Guides for every part of ShopScale, written for business owners. Search, or pick a topic.</p>
        <SearchBox autoFocus={false} />
        <p className="hc-hero-hint">Popular: {popular.slice(0, 4).map((a, i) => <span key={a.path}>{i > 0 && ', '}<Link to={a.path}>{a.title}</Link></span>)}</p>
      </section>
      <section aria-labelledby="hc-cats"><h2 id="hc-cats" className="hc-sec-title">Browse by topic</h2>
        <div className="hc-cards">
          {CATEGORIES.map((c) => (
            <Link key={c.id} className="hc-card" to={`/help/${c.id}`}>
              <span className="ic"><CatIcon name={c.icon} /></span>
              <strong>{c.title}</strong>
              <span>{c.desc}</span>
              <em>{c.articles.length} articles</em>
            </Link>
          ))}
        </div>
      </section>
      <section aria-labelledby="hc-pop"><h2 id="hc-pop" className="hc-sec-title">Start here</h2>
        <div className="hc-list-cards">
          {popular.map((a) => <Link key={a.path} to={a.path}><strong>{a.title}</strong><span>{a.desc}</span><em><Clock size={13} aria-hidden="true" /> {a.minutes} min read</em></Link>)}
        </div>
        <p className="hc-hiw"><Link to="/how-it-works">New to ShopScale? See how it works <ArrowRight size={16} aria-hidden="true" /></Link></p>
      </section>
      <SupportCard />
    </div>
  )
}

export function HelpSearch() {
  const [sp] = useSearchParams()
  const q = sp.get('q') || ''
  useSeo({ title: q ? `Search: ${q}` : 'Search the Help Centre', description: 'Search ShopScale help articles.', path: '/help/search', noindex: true })
  const results = useMemo(() => search(q, 40), [q])
  const groups = useMemo(() => {
    const g = new Map()
    for (const a of results) { if (!g.has(a.cat)) g.set(a.cat, []); g.get(a.cat).push(a) }
    return [...g.entries()]
  }, [results])
  return (
    <div className="hc-page">
      <Breadcrumbs items={[{ label: 'Help Centre', to: '/help' }, { label: 'Search' }]} />
      <h1>{q ? <>Results for "{q}"</> : 'Search the Help Centre'}</h1>
      <SearchBox initial={q} />
      {q && <p className="muted" aria-live="polite">{results.length === 0 ? 'No articles found.' : `${results.length} article${results.length === 1 ? '' : 's'} found.`}</p>}
      {groups.map(([cat, list]) => (
        <section key={cat} className="hc-results">
          <h2><CatIcon name={catById[cat].icon} size={18} /> {catById[cat].title}</h2>
          <ul>{list.map((a) => <li key={a.path}><Link to={a.path}><strong>{a.title}</strong><span>{excerpt(a, q)}</span></Link></li>)}</ul>
        </section>
      ))}
      {q && results.length === 0 && (
        <div className="hc-empty">
          <h2>We could not find a match</h2>
          <p>Try fewer or different words, for example "payment" instead of "pay online". Or start from a popular article:</p>
          <ul>{POPULAR.map((k) => byPath[k]).filter(Boolean).map((a) => <li key={a.path}><Link to={a.path}>{a.title}</Link></li>)}</ul>
        </div>
      )}
      <SupportCard />
    </div>
  )
}

export function HelpCategory() {
  const { cat } = useParams()
  const c = catById[cat]
  useSeo({ title: c ? `${c.title} · Help Centre` : 'Help Centre', description: c?.desc, path: `/help/${cat}` })
  if (!c) return <HelpNotFound />
  return (
    <div className="hc-page">
      <Breadcrumbs items={[{ label: 'Help Centre', to: '/help' }, { label: c.title }]} />
      <header className="hc-cat-head"><span className="ic"><CatIcon name={c.icon} size={26} /></span><div><h1>{c.title}</h1><p>{c.desc}</p></div></header>
      <ul className="hc-art-list">
        {c.articles.map((a) => { const x = byPath[`${c.id}/${a.id}`]; return <li key={a.id}><Link to={x.path}><strong>{a.title}</strong><span>{a.desc}</span><em><Clock size={13} aria-hidden="true" /> {x.minutes} min read</em></Link></li> })}
      </ul>
      <SupportCard />
    </div>
  )
}

const FB_KEY = 'shopscale.help.feedback'
function readFb() { try { return JSON.parse(localStorage.getItem(FB_KEY) || '{}') } catch { return {} } }

/** Feedback is kept on this device only. There is no server endpoint for it, so the page says exactly that. */
function Feedback({ path }) {
  const [v, setV] = useState(null)
  useEffect(() => { setV(readFb()[path] || null) }, [path])
  function vote(x) { setV(x); try { localStorage.setItem(FB_KEY, JSON.stringify({ ...readFb(), [path]: x })) } catch { /* private mode: still thank them */ } }
  return (
    <section className="hc-feedback" aria-label="Was this article helpful?">
      {v ? (
        <p role="status">{v === 'up' ? 'Thanks. We are glad this helped.' : 'Sorry this did not help. Call or message ShopScale Support below and we will sort it out.'} <span className="muted">Your answer is saved on this device.</span></p>
      ) : (
        <>
          <strong>Was this article helpful?</strong>
          <div><button className="btn sm" onClick={() => vote('up')}><ThumbsUp size={16} aria-hidden="true" /> Yes</button><button className="btn sm" onClick={() => vote('down')}><ThumbsDown size={16} aria-hidden="true" /> No</button></div>
        </>
      )}
    </section>
  )
}

function Toc({ headings }) {
  const [active, setActive] = useState('')
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !headings.length) return
    const io = new IntersectionObserver((es) => { const v = es.find((e) => e.isIntersecting); if (v) setActive(v.target.id) }, { rootMargin: '-90px 0px -65% 0px' })
    headings.forEach((h) => { const el = document.getElementById(h.id); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [headings])
  if (headings.length < 2) return null
  return (
    <nav className="hc-toc" aria-label="On this page">
      <strong>On this page</strong>
      <ul>{headings.map((h) => <li key={h.id}><a href={`#${h.id}`} className={active === h.id ? 'on' : ''} onClick={(e) => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); try { history.replaceState(null, '', `#${h.id}`) } catch { /* ignore */ } }}>{h.text}</a></li>)}</ul>
    </nav>
  )
}

export function HelpArticle() {
  const { cat, article } = useParams()
  const a = byPath[`${cat}/${article}`]
  useSeo({ title: a ? `${a.title} · Help Centre` : 'Help Centre', description: a?.desc, path: a?.path || '/help' })
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0) }, [cat, article])
  if (!a) return <HelpNotFound />
  const { prev, next } = neighbours(a)
  const rel = related(a)
  return (
    <div className="hc-art-wrap">
      <article className="hc-page hc-article">
        <Breadcrumbs items={[{ label: 'Help Centre', to: '/help' }, { label: a.catTitle, to: `/help/${a.cat}` }, { label: a.title }]} />
        <h1>{a.title}</h1>
        <p className="hc-lead">{a.desc}</p>
        <p className="hc-meta"><Clock size={14} aria-hidden="true" /> {a.minutes} min read</p>
        <div className="hc-toc-inline"><Toc headings={a.headings} /></div>
        <div className="hc-body"><Blocks blocks={a.blocks} /></div>
        <Feedback path={`${a.cat}/${a.id}`} />
        {rel.length > 0 && (
          <section className="hc-related" aria-label="Related articles"><h2>Related articles</h2>
            <ul>{rel.map((r) => <li key={r.path}><Link to={r.path}><strong>{r.title}</strong><span>{r.catTitle}</span></Link></li>)}</ul>
          </section>
        )}
        <nav className="hc-prevnext" aria-label="Previous and next articles">
          {prev ? <Link to={prev.path} rel="prev"><span><ArrowLeft size={14} aria-hidden="true" /> Previous</span><strong>{prev.title}</strong></Link> : <i />}
          {next ? <Link to={next.path} rel="next" className="next"><span>Next <ArrowRight size={14} aria-hidden="true" /></span><strong>{next.title}</strong></Link> : <i />}
        </nav>
        <SupportCard compact />
      </article>
      <aside className="hc-toc-side"><Toc headings={a.headings} /></aside>
    </div>
  )
}

export function HelpNotFound() {
  useSeo({ title: 'Article not found', description: 'That Help Centre page does not exist.', path: '/help', noindex: true })
  return (
    <div className="hc-page hc-empty">
      <h1>We could not find that page</h1>
      <p>It may have moved. Search for what you need, or browse the topics.</p>
      <SearchBox />
      <p><Link to="/help">Back to the Help Centre</Link></p>
      <SupportCard compact />
    </div>
  )
}
