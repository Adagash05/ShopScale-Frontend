import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { useToast } from '../components.jsx'
import { useOnline } from '../pwa/useOnline.js'
import { countPending, syncSales } from './offlineQueue.js'

/** Counts of sales waiting on this device, refreshed whenever the queue changes. */
export function usePendingCount() {
  const { business } = useAuth()
  const [c, setC] = useState({ pending: 0, failed: 0 })
  const refresh = useCallback(() => { if (business?.id) countPending(business.id).then(setC) }, [business?.id])
  useEffect(() => {
    refresh()
    window.addEventListener('shopscale:queue', refresh)
    return () => window.removeEventListener('shopscale:queue', refresh)
  }, [refresh])
  return c
}

/**
 * Sends saved sales when the app opens, when the connection returns, and every minute while any are waiting.
 * Background sync is not relied on (iOS does not offer it): this runs while ShopScale is open.
 */
export function useOfflineSync() {
  const { business } = useAuth()
  const toast = useToast()
  const online = useOnline()
  const { pending } = usePendingCount()

  const run = useCallback(async () => {
    if (!business?.id || !navigator.onLine) return
    const r = await syncSales(business.id)
    if (r.sent > 0) toast(r.sent === 1 ? '1 saved sale was confirmed by the server' : `${r.sent} saved sales were confirmed by the server`)
    if (r.failed > 0) toast(`${r.failed} saved ${r.failed === 1 ? 'sale needs' : 'sales need'} your attention`, 'error')
    if (r.stopped === 'auth') toast('Sign in again to send your saved sales', 'error')
  }, [business?.id, toast])

  useEffect(() => { if (online) run() }, [online, run])
  useEffect(() => {
    if (pending === 0 || !online) return undefined
    const t = setInterval(run, 60000)
    return () => clearInterval(t)
  }, [pending, online, run])
}
