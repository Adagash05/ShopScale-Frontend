import { useSyncExternalStore } from 'react'
import { KEY, THEME_COLOR, normalize, resolve } from './themeCore.js'

// Light / Dark / System. The choice is kept on this device (localStorage) and applied as <html data-theme="...">.
// index.html applies it before first paint so there is no flash of the wrong theme.
const listeners = new Set()
const mq = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null)

export function getPreference() {
  try { return normalize(localStorage.getItem(KEY)) } catch { return 'system' }
}

function paint(pref) {
  const dark = !!mq()?.matches
  const theme = resolve(pref, dark)
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.setAttribute('data-theme-pref', pref)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLOR[theme])
  return theme
}

export function setPreference(pref) {
  const p = normalize(pref)
  try { localStorage.setItem(KEY, p) } catch { /* private mode: applies for this visit only */ }
  paint(p)
  listeners.forEach((l) => l())
}

export function initTheme() {
  paint(getPreference())
  // "System" follows the device live (for example when it switches to dark at night).
  const m = mq()
  if (m && m.addEventListener) m.addEventListener('change', () => { if (getPreference() === 'system') { paint('system'); listeners.forEach((l) => l()) } })
  window.addEventListener('storage', (e) => { if (e.key === KEY) { paint(getPreference()); listeners.forEach((l) => l()) } })
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
export function useTheme() {
  const pref = useSyncExternalStore(subscribe, getPreference, () => 'system')
  return { preference: pref, set: setPreference }
}
