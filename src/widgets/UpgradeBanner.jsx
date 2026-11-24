import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

/** When the server refuses something because of the plan (a 402 with a code), say so and offer the plans, wherever it happened. */
export default function UpgradeBanner() {
  const [msg, setMsg] = useState(null)
  useEffect(() => {
    const on = (e) => setMsg(e.detail?.message || 'This is not included in your plan.')
    window.addEventListener('shopscale:upgrade', on)
    return () => window.removeEventListener('shopscale:upgrade', on)
  }, [])
  if (!msg) return null
  return (
    <div className="banner warn" role="alert" style={{ position: 'fixed', left: 12, right: 12, bottom: 76, zIndex: 60, maxWidth: 560, margin: '0 auto' }}>
      <span>{msg}</span>{' '}
      <Link to="/more/plan" onClick={() => setMsg(null)}><strong>See plans</strong></Link>{' '}
      <button className="btn sm" onClick={() => setMsg(null)} aria-label="Dismiss">Dismiss</button>
    </div>
  )
}
