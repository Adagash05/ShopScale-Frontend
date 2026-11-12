import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { useToast } from '../components.jsx'
import { useOnline } from '../pwa/useOnline.js'
import { countPending, getLastSync, syncAll } from './offlineQueue.js'

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
    const r = await syncAll(business.id)
    if (r.sent > 0) toast(r.sent === 1 ? '1 saved record was confirmed by the server' : `${r.sent} saved records were confirmed by the server`)
    if (r.failed > 0) toast(`${r.failed} saved ${r.failed === 1 ? 'record needs' : 'records need'} your attention`, 'error')
    if (r.stopped === 'auth') toast('Sign in again to send your saved records', 'error')
  }, [business?.id, toast])

  useEffect(() => { if (online) run() }, [online, run])
  useEffect(() => {
    if (pending === 0 || !online) return undefined
    const t = setInterval(run, 60000)
    return () => clearInterval(t)
  }, [pending, online, run])
}

/** Live sync state for the status badge: { running, done, total, lastSync, run }. */
export function useSyncStatus() {
  const { business } = useAuth()
  const [p, setP] = useState({ running: false, done: 0, total: 0 })
  const [last, setLast] = useState(null)
  useEffect(() => {
    if (business?.id) getLastSync(business.id).then(setLast)
    const on = (e) => { setP(e.detail); if (!e.detail.running && business?.id) getLastSync(business.id).then(setLast) }
    window.addEventListener('shopscale:sync', on)
    return () => window.removeEventListener('shopscale:sync', on)
  }, [business?.id])
  const run = useCallback(() => (business?.id ? syncAll(business.id) : null), [business?.id])
  return { ...p, lastSync: last, run }
}
