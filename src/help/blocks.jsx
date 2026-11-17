import { useState } from 'react'
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
      out.push(/^https?:/.test(href) ? <a key={i++} href={href} rel="noopener noreferrer">{label}</a> : <Link key={i++} to={href}>{label}</Link>)
    }
    last = m.index + t.length
  }
  if (last < s.length) out.push(s.slice(last))
  return <>{out}</>
}

/** A real screenshot. It renders only when the image file exists, so there are never broken-image boxes. */
function Shot({ id, caption }) {
  const [ok, setOk] = useState(false)
  return (
    <figure className="hc-shot" hidden={!ok}>
      <img src={`/help/shots/${id}.png`} alt={caption} loading="lazy" onLoad={() => setOk(true)} onError={() => setOk(false)} />
      <figcaption>{caption}</figcaption>
    </figure>
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
      case 'shot': return <Shot key={i} id={b.id} caption={b.caption} />
      case 'illus': return <Illustration key={i} name={b.name} />
      default: return null
    }
  })
}
