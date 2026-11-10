// Install and update state for the PWA. One small store shared by the install banner, the update banner and the Help page.
import { useSyncExternalStore } from 'react'

const DISMISS_KEY = 'shopscale.install.dismissedAt'
const DISMISS_DAYS = 14

let deferred = null            // the browser's install prompt (Android / desktop Chromium)
let waiting = null             // a service worker that is installed and waiting to take over
let state = { canPrompt: false, installed: isStandalone(), updateReady: false, dismissed: wasDismissed() }
const listeners = new Set()

function set(patch) { state = { ...state, ...patch }; listeners.forEach((l) => l()) }
function subscribe(l) { listeners.add(l); return () => listeners.delete(l) }
function snapshot() { return state }

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true
}

export function isIos() {
  const ua = window.navigator.userAgent || ''
  // iPadOS reports itself as a Mac with touch support.
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
}

function wasDismissed() {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) || 0)
    return t > 0 && Date.now() - t < DISMISS_DAYS * 86400000
  } catch { return false }
}

export function dismissInstall() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* private mode: just hide for this visit */ }
  set({ dismissed: true })
}

export async function promptInstall() {
  if (!deferred) return 'unavailable'
  deferred.prompt()
  const choice = await deferred.userChoice
  deferred = null
  set({ canPrompt: false })
  if (choice.outcome === 'accepted') return 'accepted'
  dismissInstall()
  return 'dismissed'
}

/** Ask the waiting worker to take over, then reload. Called only when the person chooses to update. */
export function applyUpdate() {
  if (!waiting) return
  waiting.postMessage('SKIP_WAITING')
}

export function initPwa() {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; set({ canPrompt: true }) })
  window.addEventListener('appinstalled', () => { deferred = null; set({ installed: true, canPrompt: false }) })
  const mq = window.matchMedia && window.matchMedia('(display-mode: standalone)')
  if (mq && mq.addEventListener) mq.addEventListener('change', () => set({ installed: isStandalone() }))

  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      const track = (sw) => sw && sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) { waiting = sw; set({ updateReady: true }) }
      })
      if (reg.waiting && navigator.serviceWorker.controller) { waiting = reg.waiting; set({ updateReady: true }) }
      reg.addEventListener('updatefound', () => track(reg.installing))
      // Look for a new version when the app is reopened, not in the middle of work.
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}) })
    }).catch(() => { /* the app works without a service worker */ })
    // Reload only when an existing worker was replaced (an update the person accepted), not on the very first install.
    const hadController = !!navigator.serviceWorker.controller
    let reloaded = false
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!hadController || reloaded) return; reloaded = true; window.location.reload() })
  })
}

export function usePwa() { return useSyncExternalStore(subscribe, snapshot, snapshot) }
