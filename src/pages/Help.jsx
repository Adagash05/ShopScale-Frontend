import { AnalyticsPreferences } from '../analytics/AnalyticsRouter.jsx'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SmartLink } from '../lib/SmartLink.jsx'
import { ArrowLeft, Search } from 'lucide-react'
import { InstallLink } from '../pwa/InstallPrompt.jsx'

import { ARTICLES, CATEGORIES, searchArticles } from './helpContent.js'
export default function Help() {
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState('')
  const found = useMemo(() => searchArticles(q).filter((a) => cat === 'all' || a.cat === cat), [q, cat])
  const groups = CATEGORIES.map((c) => ({ ...c, items: found.filter((a) => a.cat === c.id) })).filter((g) => g.items.length)
  return (
    <div className="stack">
      <div className="page-head"><div className="row"><Link to="/more" className="icon-btn" aria-label="Back"><ArrowLeft size={20} /></Link><div><h1>Help</h1><p className="sub">Quick answers in plain language</p></div></div></div>

      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--muted)' }} aria-hidden="true" />
        <input className="input" style={{ paddingLeft: 38 }} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help, for example receipt or stock" aria-label="Search help" />
      </div>
      <div className="help-cats chips" role="group" aria-label="Help topics">
        {[{ id: 'all', title: 'All' }, ...CATEGORIES].map((c) => (
          <button key={c.id} className={`chip ${cat === c.id ? 'on' : ''}`} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.title}</button>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="section pad stack-sm"><strong>Nothing matched "{q}"</strong><p className="muted">Try a different word, or <SmartLink to="/help">search the full Help Centre</SmartLink>, or <Link to="/more/support">ask the ShopScale Team</Link>.</p></div>
      )}
      {groups.map((g) => (
        <section key={g.id} className="section pad help-group">
          <h2>{g.title}</h2>
          {g.items.map((a) => (
            <details key={a.id} open={open === a.id || (!!q && g.items.length <= 3)} onToggle={(e) => e.target.open && setOpen(a.id)}>
              <summary>{a.title}</summary>
              {a.body.map((t, i) => <p key={i}>{t}</p>)}
              {a.guide && <p><SmartLink to={a.guide}>Read the full guide</SmartLink></p>}
            </details>
          ))}
        </section>
      ))}

      <div className="section pad stack-sm"><strong>Use ShopScale like an app</strong><p className="muted small">Install it on your phone or computer so it opens full screen and keeps working on a weak connection.</p><InstallLink /></div>
      <div className="section pad stack-sm"><strong>Privacy</strong><AnalyticsPreferences /></div>
      <p className="muted small">Need step-by-step guides? <SmartLink to="/help">Open the Help Centre</SmartLink>. Still stuck? <Link to="/more/support">Ask the ShopScale Team</Link>.</p>
    </div>
  )
}
