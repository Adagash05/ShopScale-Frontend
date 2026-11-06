import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, tokens } from '../lib/api'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

const EMPTY = { user: null, business: null, role: null, roleName: null, permissions: new Set(), loading: false }

function fromResponse(res) {
  return {
    user: res.user, business: res.business ?? null, role: res.role ?? null, roleName: res.roleName ?? null,
    permissions: new Set(res.permissions ?? []), loading: false,
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
    try { if (t?.refreshToken) await api.public.post('/auth/logout', { refreshToken: t.refreshToken }) } catch { /* sign out locally anyway */ }
    tokens.clear()
    setState({ ...EMPTY })
  }, [])

  const value = useMemo(() => {
    const can = (p) => state.permissions.has(p)
    return { ...state, login, register, acceptInvite, completeOnboarding, switchBusiness, updateBusiness, logout,
      can, canAny: (...ps) => ps.some(can) }
  }, [state, login, register, acceptInvite, completeOnboarding, switchBusiness, updateBusiness, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
