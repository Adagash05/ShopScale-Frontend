import { Link } from 'react-router-dom'

/** Shown where a plan does not include something. The server is the one that refuses; this only explains it and points at the plans. */
export default function UpgradeNote({ title, children, cta = 'See plans' }) {
  return (
    <div className="section pad stack" role="status">
      {title && <h2 style={{ margin: 0 }}>{title}</h2>}
      <p className="muted" style={{ margin: 0 }}>{children}</p>
      <div><Link className="btn primary" to="/more/plan">{cta}</Link></div>
    </div>
  )
}
