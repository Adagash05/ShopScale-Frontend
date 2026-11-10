import { useEffect, useState } from 'react'
import { Download, Share, PlusSquare, X, RefreshCw } from 'lucide-react'
import { Modal, useToast } from '../components.jsx'
import { applyUpdate, dismissInstall, isIos, promptInstall, usePwa } from './pwa.js'

/** Step-by-step instructions for iPhone and iPad, where the browser cannot show an install prompt. */
export function IosSteps() {
  const step = { display: 'flex', gap: 12, alignItems: 'flex-start' }
  const badge = { flex: '0 0 28px', height: 28, borderRadius: 14, background: 'var(--primary, #2563EB)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }
  return (
    <ol className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      <li style={step}><span style={badge}>1</span><div>Open ShopScale in <strong>Safari</strong>. (Other browsers on iPhone cannot add apps to the home screen.)</div></li>
      <li style={step}><span style={badge}>2</span><div>Tap the <strong>Share</strong> button <Share size={16} style={{ verticalAlign: 'middle' }} aria-hidden="true" /> at the bottom of the screen.</div></li>
      <li style={step}><span style={badge}>3</span><div>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare size={16} style={{ verticalAlign: 'middle' }} aria-hidden="true" />.</div></li>
      <li style={step}><span style={badge}>4</span><div>Tap <strong>Add</strong>. ShopScale now opens from your home screen like any other app.</div></li>
    </ol>
  )
}

export function InstallHelp({ onClose }) {
  const toast = useToast()
  const pwa = usePwa()
  const ios = isIos()
  async function install() {
    const r = await promptInstall()
    if (r === 'accepted') { toast('ShopScale is installing'); onClose() }
  }
  return (
    <Modal title="Install ShopScale" onClose={onClose}>
      {pwa.installed ? <p>ShopScale is already installed on this device.</p> : ios ? <IosSteps /> : pwa.canPrompt ? (
        <>
          <p>Install ShopScale to open it from your home screen, full screen, and keep selling on a weak connection.</p>
          <button className="btn primary block" onClick={install}><Download size={18} /> Install ShopScale</button>
        </>
      ) : (
        <div className="stack-sm">
          <p>Your browser did not offer a one-tap install. You can still add ShopScale yourself:</p>
          <p><strong>Android (Chrome):</strong> tap the <strong>⋮</strong> menu, then <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
          <p><strong>Computer (Chrome or Edge):</strong> click the install icon at the right of the address bar.</p>
          <p><strong>iPhone or iPad:</strong> open this page in Safari, tap Share, then Add to Home Screen.</p>
        </div>
      )}
    </Modal>
  )
}

/** A quiet banner at the top of the app. Hidden once installed or dismissed. */
export function InstallBanner() {
  const pwa = usePwa()
  const [help, setHelp] = useState(false)
  const ios = isIos()
  const show = !pwa.installed && !pwa.dismissed && (pwa.canPrompt || ios)
  if (!show && !help) return null
  async function install() {
    if (pwa.canPrompt) await promptInstall(); else setHelp(true)
  }
  return (
    <>
      {show && (
        <div className="banner" role="region" aria-label="Install ShopScale" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 16px' }}>
          <Download size={20} aria-hidden="true" />
          <div className="grow"><strong>Install ShopScale</strong><div className="small">Open it from your home screen, like any other app.</div></div>
          <button className="btn primary sm" onClick={install}>{pwa.canPrompt ? 'Install' : 'Show me how'}</button>
          <button className="icon-btn" aria-label="Not now" onClick={dismissInstall}><X size={18} /></button>
        </div>
      )}
      {help && <InstallHelp onClose={() => setHelp(false)} />}
    </>
  )
}

/** Shown when a new version is ready. The person picks the moment, so a sale in progress is never interrupted. */
export function UpdateBanner() {
  const pwa = usePwa()
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const on = (e) => setBusy(!!e.detail)
    window.addEventListener('shopscale:busy', on)
    return () => window.removeEventListener('shopscale:busy', on)
  }, [])
  if (!pwa.updateReady) return null
  return (
    <div className="banner" role="status" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 16px' }}>
      <RefreshCw size={18} aria-hidden="true" />
      <div className="grow"><strong>A new version of ShopScale is ready</strong>{busy && <div className="small">Finish the sale you are recording first.</div>}</div>
      <button className="btn sm" disabled={busy} onClick={applyUpdate}>Update now</button>
    </div>
  )
}

/** Entry point for the Help or More page so instructions can always be found again. */
export function InstallLink() {
  const [open, setOpen] = useState(false)
  const pwa = usePwa()
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}><Download size={18} /> {pwa.installed ? 'ShopScale is installed' : 'Install ShopScale on this device'}</button>
      {open && <InstallHelp onClose={() => setOpen(false)} />}
    </>
  )
}
