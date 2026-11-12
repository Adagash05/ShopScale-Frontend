import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { clearOnLogout, unsentCount } from '../lib/offlineQueue.js'
import { api, tokens, refreshSession } from '../lib/api'
import { clearSnapshot, loadSnapshot, saveSnapshot } from '../lib/sessionCache.js'
import { MODE } from '../config/env.js'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

const EMPTY = { user: null, business: null, role: null, roleName: null, permissions: new Set(), features: new Set(), workflows: new Set(), planCode: null, subscriptionStatus: null, loading: false }

function fromResponse(res) {
  return {
    offlineSession: false,
    user: res.user, business: res.business ?? null, role: res.role ?? null, roleName: res.roleName ?? null,
    permissions: new Set(res.permissions ?? []), features: new Set(res.features ?? []), workflows: new Set(res.workflows ?? []),
    planCode: res.planCode ?? null, subscriptionStatus: res.subscriptionStatus ?? null, loading: false,
  }
}

/** A session rebuilt from the on-device snapshot because the server could not be reached. */
function fromSnapshot(s) { return { ...fromResponse(s), offlineSession: true } }

export function AuthProvider({ children }) {
  // The public marketing site never holds a session; everywhere else a returning browser renews quietly at start-up.
  const enabled = MODE !== 'public'
  const [state, setState] = useState({ ...EMPTY, offlineSession: false, loading: enabled && tokens.hinted() })

  const offlineRef = useRef(false)
  useEffect(() => { offlineRef.current = state.offlineSession }, [state.offlineSession])

  const apply = useCallback((res) => {
    if (res.accessToken) tokens.set(res)
    saveSnapshot(res)
    setState(fromResponse(res))
  }, [])

  /** Renew from the cookie. Only an answer from the server that the session ended signs the person out. */
  const restore = useCallback(async () => {
    try {
      const res = await refreshSession()
      saveSnapshot(res)
      setState(fromResponse(res))
    } catch (e) {
      if (e.status === 401 || e.status === 403) { clearSnapshot(); setState({ ...EMPTY, offlineSession: false }); return }
      const snap = loadSnapshot()
      setState(snap ? fromSnapshot(snap) : { ...EMPTY, offlineSession: false })
    }
  }, [])

  useEffect(() => {
    if (!enabled || !tokens.hinted()) return
    restore()
  }, [enabled, restore])

  // Back online while working from the snapshot: confirm the session with the server (it may have been revoked).
  useEffect(() => {
    if (!enabled) return
    const on = () => { if (offlineRef.current && tokens.hinted()) restore() }
    window.addEventListener('online', on)
    return () => window.removeEventListener('online', on)
  }, [enabled, restore])

  useEffect(() => {
    const out = () => setState({ ...EMPTY, offlineSession: false })
    window.addEventListener('shopscale:signedout', out)
    return () => window.removeEventListener('shopscale:signedout', out)
  }, [])

  const login = useCallback(async (email, password) => apply(await api.public.post('/auth/login', { email, password })), [apply])
  const register = useCallback(async (body) => apply(await api.public.post('/auth/register', body)), [apply])
  const acceptInvite = useCallback(async (body) => apply(await api.public.post('/team/invitations/accept', body)), [apply])
  const completeOnboarding = useCallback(async (body) => apply(await api.post('/businesses', body)), [apply])
  const switchBusiness = useCallback(async (businessId) => apply(await api.post('/auth/switch', { businessId })), [apply])
  const updateBusiness = useCallback((business) => setState((s) => ({ ...s, business })), [])
  const logout = useCallback(async () => {
    const bid = state.business?.id
    if (bid && (await unsentCount(bid)) > 0 && !window.confirm('Some sales are saved on this device and have not been sent yet. If you sign out they stay here until you sign in again and connect. Sign out anyway?')) return
    try { await api.public.post('/auth/logout', {}) } catch { /* the cookie is cleared by the server when it is reachable; sign out locally anyway */ }
    tokens.clear()
    clearSnapshot()
    await clearOnLogout()
    setState({ ...EMPTY, offlineSession: false })
  }, [state.business?.id])

  const value = useMemo(() => {
    const can = (p) => state.permissions.has(p)
    return { ...state, login, register, acceptInvite, completeOnboarding, switchBusiness, updateBusiness, logout,
      can, canAny: (...ps) => ps.some(can),
      hasFeature: (f) => state.features.has(f), hasWorkflow: (w) => state.workflows.has(w) }
  }, [state, login, register, acceptInvite, completeOnboarding, switchBusiness, updateBusiness, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
