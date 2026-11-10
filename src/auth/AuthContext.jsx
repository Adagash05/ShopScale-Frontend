import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { clearOnLogout, unsentCount } from '../lib/offlineQueue.js'
import { api, tokens } from '../lib/api'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

const EMPTY = { user: null, business: null, role: null, roleName: null, permissions: new Set(), features: new Set(), workflows: new Set(), planCode: null, subscriptionStatus: null, loading: false }

function fromResponse(res) {
  return {
    user: res.user, business: res.business ?? null, role: res.role ?? null, roleName: res.roleName ?? null,
    permissions: new Set(res.permissions ?? []), features: new Set(res.features ?? []), workflows: new Set(res.workflows ?? []),
    planCode: res.planCode ?? null, subscriptionStatus: res.subscriptionStatus ?? null, loading: false,
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ ...EMPTY, loading: !!tokens.get() })

  const apply = useCallback((res) => {
    if (res.accessToken) tokens.set(res)
    setState(fromResponse(res))
  }, [])

  useEffect(() => {
    if (!tokens.get()) return
    let live = true
    api.get('/auth/me').then(
      (res) => { if (live) setState(fromResponse(res)) },
      () => { if (live) { tokens.clear(); setState({ ...EMPTY }) } },
    )
    return () => { live = false }
  }, [])

  useEffect(() => {
    const out = () => setState({ ...EMPTY })
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
    const t = tokens.get()
    const bid = state.business?.id
    if (bid && (await unsentCount(bid)) > 0 && !window.confirm('Some sales are saved on this device and have not been sent yet. If you sign out they stay here until you sign in again and connect. Sign out anyway?')) return
    try { if (t?.refreshToken) await api.public.post('/auth/logout', { refreshToken: t.refreshToken }) } catch { /* sign out locally anyway */ }
    tokens.clear()
    await clearOnLogout()
    setState({ ...EMPTY })
  }, [state.business?.id])

  const value = useMemo(() => {
    const can = (p) => state.permissions.has(p)
    return { ...state, login, register, acceptInvite, completeOnboarding, switchBusiness, updateBusiness, logout,
      can, canAny: (...ps) => ps.some(can),
      hasFeature: (f) => state.features.has(f), hasWorkflow: (w) => state.workflows.has(w) }
  }, [state, login, register, acceptInvite, completeOnboarding, switchBusiness, updateBusiness, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
