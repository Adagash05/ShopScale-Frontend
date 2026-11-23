import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Empty, ErrorBox, RangePicker, Skeleton, useLoad } from '../components.jsx'
import { money, qtyText, rangeQuery } from '../lib/format.js'

const fmt = (type, v) => (v == null ? '—' : type === 'money' ? money(v) : type === 'percent' ? `${Number(v).toLocaleString('en-NG', { maximumFractionDigits: 1 })}%` : qtyText(v))

function Upgrade() {
  return (
    <div className="dash-card stack-sm">
      <h2>Ask ShopScale is on the Essential plan and above</h2>
      <p className="muted">Pick a question such as "Which products sold the most?" or "Which customers owe me money?" and get a plain answer from your own sales, payments and expenses. It is not a chatbot: it answers a fixed set of questions using your records.</p>
      <div><Link to="/more/plan" className="btn primary">See plans</Link></div>
    </div>
  )
}

function Answer({ a }) {
  return (
    <section className="dash-card" aria-live="polite">
      <p className="ask-headline" style={a.available ? undefined : { color: 'var(--muted)' }}>{a.headline}</p>
      {a.figures.length > 0 && (
        <div className="ask-figs">{a.figures.map((f) => <div key={f.label}><b className="num">{fmt(f.type, f.value)}</b><span>{f.label}</span>{f.note && <span style={{ display: 'block' }}>{f.note}</span>}</div>)}</div>
      )}
      {a.rows.length > 0 && (
        <ol className="rank people">{a.rows.map((r, i) => (
          <li key={`${r.label}-${i}`}>
            <span className="n">{i + 1}</span>
            <div style={{ minWidth: 0 }}>{r.link ? <Link className="name" to={r.link}>{r.label}</Link> : <span className="name">{r.label}</span>}{r.detail && <div className="meta">{r.detail}</div>}</div>
            <span className="amt">{fmt(r.type, r.value)}</span>
          </li>))}</ol>
      )}
      {a.notes.map((n) => <p key={n} className="note-line" style={{ marginTop: 8 }}>{n}</p>)}
      {a.links.length > 0 && <div className="row" style={{ marginTop: 12, flexWrap: 'wrap' }}>{a.links.map((l) => <Link key={l.to} to={l.to} className="btn">{l.label}</Link>)}</div>}
    </section>
  )
}

export default function AskShopScale() {
  const { can, hasFeature } = useAuth()
  const [sp, setSp] = useSearchParams()
  const [key, setKey] = useState(sp.get('q') || '')
  const range = sp.get('range') || 'thisMonth'
  const from = sp.get('from') || ''
  const to = sp.get('to') || ''
  const entitled = hasFeature('ASK_SHOPSCALE')
  const questions = useLoad(() => (entitled ? api.get('/ask/questions') : Promise.resolve(null)), [entitled])
  const q = (questions.data || []).find((x) => x.key === key)
  const ready = q && q.allowed && (!q.usesPeriod || range !== 'custom' || (from && to))
  const answer = useLoad(() => (ready ? api.get(`/ask/${key}`, q.usesPeriod ? rangeQuery(range, from, to) : undefined) : Promise.resolve(null)), [key, range, from, to, ready])

  if (!can('DASHBOARD_VIEW')) return <Navigate to="/more" replace />

  function pickPeriod({ range: r, from: f, to: t }) {
    const next = { range: r }
    if (key) next.q = key
    if (r === 'custom') { if (f) next.from = f; if (t) next.to = t }
    setSp(next, { replace: true })
  }
  function pickQuestion(k) { setKey(k); const next = { range }; if (range === 'custom') { next.from = from; next.to = to }; next.q = k; setSp(next, { replace: true }) }

  return (
    <div className="stack">
      <div className="page-head"><div><h1>Ask ShopScale</h1><p className="sub">Pick a question. Answers come from your own records.</p></div></div>
      {!entitled && <Upgrade />}
      {entitled && (
        <>
          <ErrorBox error={questions.error} onRetry={questions.reload} />
          {questions.loading && <div className="stack-sm"><Skeleton height={48} /><Skeleton height={48} /><Skeleton height={48} /></div>}
          {questions.data && (
            <div className="ask-qs" role="group" aria-label="Questions you can ask">
              {questions.data.map((x) => (
                <button key={x.key} className="ask-q" aria-pressed={key === x.key} disabled={!x.allowed} onClick={() => pickQuestion(x.key)}
                  title={x.allowed ? undefined : 'Only the owner and managers can see this'}>{x.title}</button>))}
            </div>
          )}
          {q?.usesPeriod && <RangePicker value={range} from={from} to={to} onChange={pickPeriod} />}
          {!key && questions.data && <Empty title="Choose a question">Tap one above to see the answer for the period you pick.</Empty>}
          <ErrorBox error={answer.error} onRetry={answer.reload} />
          {answer.loading && <div className="dash-card"><Skeleton height={20} width="70%" /><Skeleton height={60} style={{ marginTop: 12 }} /></div>}
          {answer.data && !answer.loading && <Answer a={answer.data} />}
          <p className="note-line">Sales are not the same as money received, and neither is profit. Each answer says which one it shows.</p>
        </>
      )}
    </div>
  )
}
