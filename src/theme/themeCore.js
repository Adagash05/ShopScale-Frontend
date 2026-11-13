// Pure theme rules (no DOM), unit-tested with plain Node.
export const KEY = 'shopscale.theme'
export const THEMES = ['light', 'dark', 'system']
export const THEME_COLOR = { light: '#2563EB', dark: '#0b1220' }

export const DEFAULT = 'light'

/** A stored value becomes a valid preference; nothing stored, or anything unknown, means the light default. "system" only applies when a person picked it. */
export function normalize(value) { return THEMES.includes(value) ? value : DEFAULT }

/** The theme actually shown: 'light' or 'dark'. */
export function resolve(pref, systemPrefersDark) {
  const p = normalize(pref)
  return p === 'dark' || (p === 'system' && !!systemPrefersDark) ? 'dark' : 'light'
}
