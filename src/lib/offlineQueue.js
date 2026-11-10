// Durable on-device queue for sales recorded without a connection.
// A sale here is ONLY a local record. It is never shown as confirmed until the server has accepted it.
// Server-side idempotency (clientRequestId) makes a retry after a lost response safe.
import { api, ApiError } from './api'

const DB_NAME = 'shopscale-offline'
const DB_VERSION = 1
const DAY = 86400000

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('This browser cannot store sales offline')); return }
    const r = indexedDB.open(DB_NAME, DB_VERSION)
    r.onupgradeneeded = () => {
      const db = r.result
      if (!db.objectStoreNames.contains('sales')) db.createObjectStore('sales', { keyPath: 'clientRequestId' })
      if (!db.objectStoreNames.contains('catalog')) db.createObjectStore('catalog', { keyPath: 'key' })
    }
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

async function tx(store, mode, fn) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode)
    const s = t.objectStore(store)
    let out
    Promise.resolve(fn(s)).then((v) => { out = v }).catch(reject)
    t.oncomplete = () => { db.close(); resolve(out) }
    t.onerror = () => { db.close(); reject(t.error) }
    t.onabort = () => { db.close(); reject(t.error) }
  })
}
const wrap = (req) => new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error) })
const notify = () => window.dispatchEvent(new Event('shopscale:queue'))

// ---- catalogue snapshot (product names, prices and last known stock, for selling without a connection) ----
export const saveCatalog = (businessId, branchId, items) =>
  tx('catalog', 'readwrite', (s) => wrap(s.put({ key: `${businessId}:${branchId || 'main'}`, items, savedAt: Date.now() }))).catch(() => {})
export const loadCatalog = (businessId, branchId) =>
  tx('catalog', 'readonly', (s) => wrap(s.get(`${businessId}:${branchId || 'main'}`))).catch(() => null)

// ---- sales ----
/** status: PENDING (saved here) | SYNCING | FAILED (server refused; needs a person) | SYNCED (server confirmed) */
export async function enqueueSale({ businessId, userId, payload, estimatedTotal, lines, method }) {
  const rec = { clientRequestId: payload.clientRequestId, businessId, userId, createdAt: Date.now(), payload, estimatedTotal, lines, method, status: 'PENDING', attempts: 0, error: null }
  await tx('sales', 'readwrite', (s) => wrap(s.put(rec)))
  notify()
  return rec
}

export const listSales = (businessId) =>
  tx('sales', 'readonly', (s) => wrap(s.getAll())).then((all) => (all || []).filter((r) => r.businessId === businessId).sort((a, b) => b.createdAt - a.createdAt)).catch(() => [])

export async function countPending(businessId) {
  const all = await listSales(businessId)
  return { pending: all.filter((r) => r.status === 'PENDING' || r.status === 'SYNCING').length, failed: all.filter((r) => r.status === 'FAILED').length }
}

async function update(id, patch) {
  await tx('sales', 'readwrite', async (s) => {
    const cur = await wrap(s.get(id))
    if (cur) await wrap(s.put({ ...cur, ...patch }))
  })
  notify()
}

export async function discardSale(id) {
  await tx('sales', 'readwrite', (s) => wrap(s.delete(id)))
  notify()
}

/** Put a refused sale back to PENDING so it is tried again (for example after stock was received). */
export const retrySale = (id) => update(id, { status: 'PENDING', error: null })

let running = false

/**
 * Send queued sales one at a time, oldest first, for the signed-in business only.
 * Network errors and 5xx keep the sale PENDING and stop (try again later). 401 stops too: the person must sign in.
 * Any other refusal (stock, validation, subscription) marks the sale FAILED with the server's reason, and nothing is retried silently.
 * @returns {{sent:number, failed:number, stopped:string|null}}
 */
export async function syncSales(businessId) {
  if (running || !businessId) return { sent: 0, failed: 0, stopped: 'busy' }
  running = true
  let sent = 0
  let failed = 0
  let stopped = null
  try {
    const queue = (await listSales(businessId)).filter((r) => r.status === 'PENDING' || r.status === 'SYNCING').sort((a, b) => a.createdAt - b.createdAt)
    for (const rec of queue) {
      await update(rec.clientRequestId, { status: 'SYNCING', attempts: rec.attempts + 1 })
      try {
        const sale = await api.post('/sales', rec.payload)
        await update(rec.clientRequestId, { status: 'SYNCED', syncedAt: Date.now(), error: null, serverSaleNumber: sale.saleNumber, serverTotal: sale.total })
        sent += 1
      } catch (e) {
        const status = e instanceof ApiError ? e.status : 0
        if (status === 0 || status >= 500 || status === 429) { await update(rec.clientRequestId, { status: 'PENDING', error: 'Could not reach the server. Will try again.' }); stopped = 'network'; break }
        if (status === 401) { await update(rec.clientRequestId, { status: 'PENDING', error: 'Sign in again to send this sale.' }); stopped = 'auth'; break }
        await update(rec.clientRequestId, { status: 'FAILED', error: e.message || 'The server refused this sale.' })
        failed += 1
      }
    }
    // Forget old confirmations so the list does not grow forever.
    const all = await listSales(businessId)
    for (const r of all) if (r.status === 'SYNCED' && Date.now() - (r.syncedAt || 0) > 7 * DAY) await discardSale(r.clientRequestId)
  } finally { running = false }
  return { sent, failed, stopped }
}

/** On sign-out: drop the catalogue snapshot and confirmed sales. Unsent sales are kept (they are real money records) and stay tied to their business. */
export async function clearOnLogout() {
  try {
    await tx('catalog', 'readwrite', (s) => wrap(s.clear()))
    const all = await tx('sales', 'readonly', (s) => wrap(s.getAll()))
    for (const r of all || []) if (r.status === 'SYNCED') await tx('sales', 'readwrite', (s) => wrap(s.delete(r.clientRequestId)))
  } catch { /* nothing stored */ }
  notify()
}

export async function unsentCount(businessId) {
  const c = await countPending(businessId)
  return c.pending + c.failed
}
