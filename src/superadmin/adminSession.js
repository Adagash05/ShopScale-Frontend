/*
 * Super Admin session (see docs/SUPER_ADMIN_SECURITY.md).
 * Completely separate from the merchant session: its own storage key, no refresh cookie, a short-lived token (30 minutes by default).
 * The token is kept in sessionStorage, which belongs to this tab and is cleared when the tab closes; nothing is written to localStorage.
 * The server re-checks the session on every request, so a copied or stale token stops working as soon as the admin signs out or changes the password.
 */
const KEY = 'shopscale.superadmin.session'
let mem = null

const ss = {
  get: () => { try { return sessionStorage.getItem(KEY) } catch { return null } },
  set: (v) => { try { sessionStorage.setItem(KEY, v) } catch { /* private mode: the session lives in memory only */ } },
  del: () => { try { sessionStorage.removeItem(KEY) } catch { /* nothing to remove */ } },
}

export const adminSession = {
  /** { token, expiresAt } or null. An expired token is treated as signed out. */
  get() {
    const ok = (v) => v && typeof v.token === 'string' && v.token && new Date(v.expiresAt).getTime() > Date.now()
    if (ok(mem)) return mem
    try { const v = JSON.parse(ss.get()); if (ok(v)) { mem = v; return v } } catch { /* corrupt value */ }
    mem = null
    return null
  },
  set(s) { mem = { token: s.token, expiresAt: s.expiresAt }; ss.set(JSON.stringify(mem)) },
  clear() { mem = null; ss.del() },
}

/** The console lives under /super-admin. Requests made from there use the Super Admin token and never touch the merchant session. */
export function isSuperAdminPath(pathname) {
  const p = String(pathname || '')
  return p === '/super-admin' || p.startsWith('/super-admin/')
}
