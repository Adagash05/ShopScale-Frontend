import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Lightbulb } from 'lucide-react'
import { slugify } from './data.js'
import Illustration from './Illustrations.jsx'

/** **bold**, `code` and [label](/path) inside any text. Internal links use the router. */
export function Rich({ text }) {
  const out = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let last = 0, m, i = 0
  const s = String(text)
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index))
    const t = m[0]
    if (t.startsWith('**')) out.push(<strong key={i++}>{t.slice(2, -2)}</strong>)
    else if (t.startsWith('`')) out.push(<code key={i++}>{t.slice(1, -1)}</code>)
    else {
      const [, label, href] = t.match(/\[([^\]]+)\]\(([^)]+)\)/)
      out.push(/^(https?:|mailto:)/.test(href) ? <a key={i++} href={href} rel="noopener noreferrer">{label}</a> : <Link key={i++} to={href}>{label}</Link>)
    }
    last = m.index + t.length
  }
  if (last < s.length) out.push(s.slice(last))
  return <>{out}</>
}

const DEV = (() => { try { return !!import.meta.env.DEV } catch { return false } })()

/** The picture, with an optional outline (measured on the real page by the capture script) drawn over it. The image file itself is never edited. */
function Frame({ id, box, callout, onLoad, onError, alt }) {
  const pct = (v, t) => `${(v / t) * 100}%`
  const below = box && (box.y / box.vh) * 100 < 9
  return (
    <span className="hc-frame">
      <img src={`/help/shots/${id}.png`} alt={alt} loading="lazy" onLoad={onLoad} onError={onError} />
      {box && <span className="hc-hl" style={{ left: pct(box.x, box.vw), top: pct(box.y, box.vh), width: pct(box.w, box.vw), height: pct(box.h, box.vh) }} aria-hidden="true" />}
      {box && callout && <span className="hc-hl-label" style={{ left: pct(box.x, box.vw), top: pct(below ? box.y + box.h : box.y, box.vh), transform: below ? 'translateY(8px)' : 'translateY(calc(-100% - 6px))' }} aria-hidden="true">{callout}</span>}
    </span>
  )
}

/**
 * A real screenshot of the running app; click to enlarge. It renders only when the image file exists: in development a missing
 * one shows a clear marker (nothing is silently skipped); in production it renders nothing, never a broken image or empty box.
 * onState reports { state, portrait } so a step card can lay itself out around the picture.
 */
export function Shot({ id, caption, callout, wide, onState }) {
  const [state, setState] = useState('pending')
  const [dims, setDims] = useState(null)
  const [box, setBox] = useState(null)
  const [open, setOpen] = useState(false)
  const portrait = !!dims && dims.h > dims.w * 1.1
  useEffect(() => { if (onState) onState({ state, portrait }) }, [state, portrait])
  useEffect(() => {
    if (!open) return undefined
    const key = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open])
  const loaded = (e) => {
    setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
    setState('ok')
    fetch(`/help/shots/${id}.json`)
      .then((r) => (r.ok && /json/.test(r.headers.get('content-type') || '') ? r.json() : null))
      .then((j) => { if (j && j.box && j.vw && j.vh) setBox({ ...j.box, vw: j.vw, vh: j.vh }) })
      .catch(() => {})
  }
  if (state === 'missing') {
    if (!DEV) return null
    return (
      <figure className="hc-shot missing">
        <div role="status">Screenshot not captured yet: <code>{id}</code>. Run the capture script (docs/LOCAL_DEMO_AND_SCREENSHOTS.md). This marker shows in development only.</div>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    )
  }
  return (
    <>
      <figure className={`hc-shot ${portrait ? 'portrait' : 'landscape'} ${wide ? 'wide' : ''}`} hidden={state !== 'ok'}>
        <button type="button" className="hc-zoom" onClick={() => setOpen(true)} aria-label={`Enlarge screenshot: ${caption || id}`}>
          <Frame id={id} box={box} callout={callout} alt={caption || ''} onLoad={loaded} onError={() => setState('missing')} />
        </button>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
      {open && (
        <div className="hc-lb" role="dialog" aria-modal="true" aria-label={caption || 'Screenshot'} onClick={() => setOpen(false)}>
          <button type="button" className="hc-lb-close" onClick={() => setOpen(false)} aria-label="Close">Close</button>
          <div className="hc-lb-inner" onClick={(e) => e.stopPropagation()}>
            <Frame id={id} box={box} callout={callout} alt={caption || ''} />
            {caption && <p>{caption}</p>}
          </div>
        </div>
      )}
    </>
  )
}

/** One numbered instruction, optionally paired with the picture of the exact screen it refers to. */
function VStep({ n, item }) {
  const [pic, setPic] = useState({ state: 'pending', portrait: false })
  const shown = !!item.shot && pic.state === 'ok'
  return (
    <li className={`hc-vstep ${shown ? 'shown' : ''} ${shown && pic.portrait ? 'portrait' : ''}`}>
      <span className="n" aria-hidden="true">{n}</span>
      <div className="hc-vstep-body">
        <div className="hc-vstep-text">
          {item.title && <h3><span className="sr-only">Step {n}: </span>{item.title}</h3>}
          <p><Rich text={item.text} /></p>
        </div>
        {item.shot && <Shot id={item.shot} caption={item.caption} callout={item.callout} onState={setPic} />}
      </div>
    </li>
  )
}

export function Blocks({ blocks }) {
  return blocks.map((b, i) => {
    switch (b.t) {
      case 'p': return <p key={i}><Rich text={b.text} /></p>
      case 'h': return <h2 key={i} id={slugify(b.text)} className="hc-h2">{b.text}</h2>
      case 'steps': return <ol key={i} className="hc-steps">{b.items.map((x, j) => <li key={j}><Rich text={x} /></li>)}</ol>
      case 'list': return <ul key={i} className="hc-list">{b.items.map((x, j) => <li key={j}><Rich text={x} /></li>)}</ul>
      case 'tip': return <div key={i} className="hc-note tip"><Lightbulb size={18} aria-hidden="true" /><div><strong>Tip</strong><p><Rich text={b.text} /></p></div></div>
      case 'warn': return <div key={i} className="hc-note warn" role="note"><AlertTriangle size={18} aria-hidden="true" /><div><strong>Important</strong><p><Rich text={b.text} /></p></div></div>
      case 'vsteps': return <ol key={i} className="hc-vsteps">{b.items.map((x, j) => <VStep key={j} n={j + 1} item={x} />)}</ol>
      case 'shot': return <Shot key={i} id={b.id} caption={b.caption} wide />
      case 'illus': return <Illustration key={i} name={b.name} />
      default: return null
    }
  })
}
