import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { api } from '../lib/api.js'
import { adminSession } from './adminSession.js'

const Ctx = createContext(null)
export const useAdmin = () => useContext(Ctx)

/** Holds the Super Admin identity for everything under /super-admin. status: loading | out | in | error. */
export function AdminAuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', me: null, error: null })

  const load = useCallback(async () => {
    if (!adminSession.get()) { setState({ status: 'out', me: null, error: null }); return }
    try {
      const me = await api.get('/super-admin/auth/me')
      setState({ status: 'in', me, error: null })
    } catch (e) {
      if (e.status === 401 || e.status === 403) { adminSession.clear(); setState({ status: 'out', me: null, error: null }) }
      else setState({ status: 'error', me: null, error: e })
    }
  }, [])

  useEffect(() => {
    load()
    const out = () => setState({ status: 'out', me: null, error: null })
    window.addEventListener('shopscale:admin-signedout', out)
    return () => window.removeEventListener('shopscale:admin-signedout', out)
  }, [load])

  const value = useMemo(() => ({
    ...state,
    reload: load,
    async login(email, password) {
      const d = await api.post('/super-admin/auth/login', { email, password })
      adminSession.set({ token: d.token, expiresAt: d.expiresAt })
      await load()
      return d
    },
    async logout() {
      try { await api.post('/super-admin/auth/logout') } catch { /* the token is dropped here either way */ }
      adminSession.clear()
      setState({ status: 'out', me: null, error: null })
    },
  }), [state, load])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Layout route: provides the admin identity to every /super-admin page. */
export function AdminRoot() {
  return <AdminAuthProvider><Outlet /></AdminAuthProvider>
}
