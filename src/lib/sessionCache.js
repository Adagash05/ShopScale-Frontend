// Last known session, kept so a signed-in person can reopen the app with no connection.
// It holds NO credentials (no tokens): only who they are and what they may do, so the screens can render.
// The server still decides everything: offline work is only a queue that is checked again when it is sent.
const KEY = 'shopscale.snapshot'
export const SNAPSHOT_MAX_AGE_MS = 30 * 24 * 3600 * 1000   // same as the refresh-session lifetime

export function saveSnapshot(res) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      savedAt: Date.now(),
      user: res.user, business: res.business ?? null, role: res.role ?? null, roleName: res.roleName ?? null,
      permissions: res.permissions ?? [], features: res.features ?? [], workflows: res.workflows ?? [],
      planCode: res.planCode ?? null, subscriptionStatus: res.subscriptionStatus ?? null,
    }))
  } catch { /* private mode: the app still works online */ }
}

export function loadSnapshot(now = Date.now()) {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (!s || !s.user || now - s.savedAt > SNAPSHOT_MAX_AGE_MS) return null
    return s
  } catch { return null }
}

export function clearSnapshot() { try { localStorage.removeItem(KEY) } catch { /* nothing */ } }
