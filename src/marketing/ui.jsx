import { SmartLink as Link } from '../lib/SmartLink.jsx'
import { Check } from 'lucide-react'
import './site.css'

/** Shared building blocks of the public website. Every public page is assembled from these so spacing, type and colour stay consistent. */

export function Section({ tone = '', tight = false, id, labelledBy, children }) {
  return <section id={id} aria-labelledby={labelledBy} className={`mkx-sec ${tone} ${tight ? 'tight' : ''}`}><div className="mkx-wrap">{children}</div></section>
}

export function SectionHead({ eyebrow, title, lead, center = false, id, wide = false }) {
  return (
    <div className={`mkx-head-block ${center ? 'center' : ''}`}>
      {eyebrow && <p className="mkx-eyebrow">{eyebrow}</p>}
      <h2 id={id} className={`mkx-h2 ${wide ? 'wide' : ''}`}>{title}</h2>
      {lead && <p className="mkx-lead">{lead}</p>}
    </div>
  )
}

/** The one place a visitor is sent to start. Primary action is always "Start free" and always goes to /register. */
export function StartButton({ children = 'Start free', className = '', variant = 'primary', ...rest }) {
  return <Link to="/register" className={`mkx-btn ${variant} ${className}`} {...rest}>{children}</Link>
}

export function Ticks({ items }) {
  return <ul className="mkx-ticks">{items.map((t) => <li key={t}><Check size={18} aria-hidden="true" /><span>{t}</span></li>)}</ul>
}

/** A real piece of the interface, drawn with the app's own components and styles, always labelled as sample data. */
export function Frame({ title, children, caption, sample = 'Sample data' }) {
  return (
    <figure style={{ margin: 0 }}>
      <div className="mkx-frame" role="group" aria-label={`${title} (sample data)`}>
        <div className="mkx-frame-bar"><span className="mkx-dots" aria-hidden="true"><i /><i /><i /></span><span className="mkx-frame-title">{title}</span><span className="mkx-sample">{sample}</span></div>
        <div className="mkx-frame-body">{children}</div>
      </div>
      {caption && <figcaption className="mkx-cap">{caption}</figcaption>}
    </figure>
  )
}

export function Phone({ title, children }) {
  return (
    <div className="mkx-phone" role="group" aria-label={`${title} (sample data)`}>
      <div className="mkx-frame-bar"><span className="mkx-frame-title">{title}</span><span className="mkx-sample">Sample data</span></div>
      <div className="mkx-frame-body">{children}</div>
    </div>
  )
}

/** Alternating copy + product visual. `plan` names the plans that include it, so nothing is advertised as available where it is not. */
export function Showcase({ id, flip = false, eyebrow, title, body, points, plan, cta, visual }) {
  return (
    <div className={`mkx-show ${flip ? 'flip' : ''}`} id={id}>
      <div className="mkx-show-copy">
        {plan ? <span className="mkx-pill plan">{plan}</span> : eyebrow ? <span className="mkx-pill">{eyebrow}</span> : null}
        <h3>{title}</h3>
        <p>{body}</p>
        {points && <Ticks items={points} />}
        {cta && <p style={{ marginTop: 22 }}><Link className="mkx-link" to={cta[1]}>{cta[0]} →</Link></p>}
      </div>
      <div>{visual}</div>
    </div>
  )
}

export function Faq({ items }) {
  return (
    <div className="mkx-faq">
      {items.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
    </div>
  )
}

export function CtaBand({ title = 'Your business deserves better than guesswork.', text = 'Bring your business operations together with ShopScale. Start with the basics and grow into more powerful tools as your business expands.',
  primary = 'Start free today', secondary = ['View pricing', '/pricing'], note = 'No card required. Start with the Free plan or explore the 14-day trial on paid plans.' }) {
  return (
    <section className="mkx-final" aria-label="Get started">
      <div className="mkx-wrap">
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="mkx-cta-row">
          <StartButton variant="white">{primary}</StartButton>
          {secondary && <Link to={secondary[1]} className="mkx-btn ghost-light">{secondary[0]}</Link>}
        </div>
        <p className="mkx-fine" style={{ marginTop: 18, fontSize: '.9375rem' }}>{note}</p>
      </div>
    </section>
  )
}
