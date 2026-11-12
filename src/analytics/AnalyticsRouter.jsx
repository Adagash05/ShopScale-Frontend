import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { analyticsConfigured, getConsent, onConsentChange, pageView, resetPageMemory, setConsent } from './analytics.js'

/** Reports one page_view per route change, using the router's own location (never API calls). */
export function AnalyticsRouter() {
  const { pathname } = useLocation()
  const [consent, setConsentState] = useState(getConsent())
  useEffect(() => onConsentChange((v) => { resetPageMemory(); setConsentState(v) }), [])
  useEffect(() => { pageView(pathname) }, [pathname, consent])
  return null
}

/** Asks once, before anything is loaded or sent. Not shown on public storefronts. */
export function ConsentBanner() {
  const { pathname } = useLocation()
  const [consent, setLocal] = useState(getConsent())
  useEffect(() => onConsentChange(setLocal), [])
  if (!analyticsConfigured() || consent !== null || pathname === '/s' || pathname.startsWith('/s/')) return null
  return (
    <div className="consent-banner" role="dialog" aria-label="Analytics">
      <p>Can ShopScale use Google Analytics to count visits and see which features are used? We never send your customers, sales amounts or contact details.</p>
      <div className="row">
        <button className="btn sm" onClick={() => setConsent('denied')}>No thanks</button>
        <button className="btn sm primary" onClick={() => setConsent('granted')}>Allow analytics</button>
      </div>
    </div>
  )
}

/** Lets people change their mind at any time (shown in Help). */
export function AnalyticsPreferences() {
  const [consent, setLocal] = useState(getConsent())
  useEffect(() => onConsentChange(setLocal), [])
  if (!analyticsConfigured()) return null
  return (
    <div className="stack-sm">
      <p>Usage analytics (Google Analytics): <b>{consent === 'granted' ? 'On' : 'Off'}</b></p>
      <button className="btn sm" onClick={() => setConsent(consent === 'granted' ? 'denied' : 'granted')}>{consent === 'granted' ? 'Turn analytics off' : 'Turn analytics on'}</button>
    </div>
  )
}
