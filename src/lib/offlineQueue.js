// Durable on-device queue for work recorded without a connection: sales and expenses.
// A record here is ONLY a local record. It is never shown as confirmed until the server has accepted it.
// Server-side idempotency (clientRequestId on sales and expenses) makes a retry after a lost response safe, so the same
// record can be sent any number of times and exists exactly once on the server.
import { api, ApiError } from './api'

const DB_NAME = 'shopscale-offline'
const DB_VERSION = 2
const DAY = 86400000

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('This browser cannot store records offline')); return }
    const r = indexedDB.open(DB_NAME, DB_VERSION)
    r.onupgradeneeded = () => {
      const db = r.result
      if (!db.objectStoreNames.contains('sales')) db.createObjectStore('sales', { keyPath: 'clientRequestId' })
      if (!db.objectStoreNames.contains('catalog')) db.createObjectStore('catalog', { keyPath: 'key' })
      if (!db.objectStoreNames.contains('expenses')) db.createObjectStore('expenses', { keyPath: 'clientRequestId' })
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
const notify = () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('shopscale:queue')) }

// ---- on-device copies of reference data (so POS can be used with no connection) ----
const snapKey = (kind, businessId, branchId) => `${kind}:${businessId}:${branchId || 'main'}`
const putSnap = (kind, businessId, branchId, items) =>
  tx('catalog', 'readwrite', (s) => wrap(s.put({ key: snapKey(kind, businessId, branchId), items, savedAt: Date.now() }))).catch(() => {})
const getSnap = (kind, businessId, branchId) =>
  tx('catalog', 'readonly', (s) => wrap(s.get(snapKey(kind, businessId, branchId)))).catch(() => null)

export const saveCatalog = (businessId, branchId, items) => tx('catalog', 'readwrite', (s) => wrap(s.put({ key: `${businessId}:${branchId || 'main'}`, items, savedAt: Date.now() }))).catch(() => {})
export const loadCatalog = (businessId, branchId) => tx('catalog', 'readonly', (s) => wrap(s.get(`${businessId}:${branchId || 'main'}`))).catch(() => null)
export const saveCustomers = (businessId, items) => putSnap('customers', businessId, null, items)
export const loadCustomers = (businessId) => getSnap('customers', businessId, null)

// ---- last successful synchronisation (per business) ----
export const setLastSync = (businessId) => putSnap('meta', businessId, null, { at: Date.now() })
export const getLastSync = (businessId) => getSnap('meta', businessId, null).then((r) => r?.items?.at || null)

// ---- generic queue over the 'sales' and 'expenses' stores ----
/** status: PENDING (saved here) | SYNCING | FAILED (server refused; needs a person) | SYNCED (server confirmed) */
const list = (store) => (businessId) =>
  tx(store, 'readonly', (s) => wrap(s.getAll())).then((all) => (all || []).filter((r) => r.businessId === businessId).sort((a, b) => b.createdAt - a.createdAt)).catch(() => [])

async function put(store, rec) { await tx(store, 'readwrite', (s) => wrap(s.put(rec))); notify() }
async function update(store, id, patch) {
  await tx(store, 'readwrite', async (s) => {
    const cur = await wrap(s.get(id))
    if (cur) await wrap(s.put({ ...cur, ...patch }))
  })
  notify()
}
async function remove(store, id) { await tx(store, 'readwrite', (s) => wrap(s.delete(id))); notify() }

// sales
export async function enqueueSale({ businessId, userId, payload, estimatedTotal, lines, method }) {
  const rec = { clientRequestId: payload.clientRequestId, businessId, userId, createdAt: Date.now(), payload, estimatedTotal, lines, method, status: 'PENDING', attempts: 0, error: null }
  await put('sales', rec)
  return rec
}
export const listSales = list('sales')
export const discardSale = (id) => remove('sales', id)
/** Put a refused sale back to PENDING so it is tried again (for example after stock was received). */
export const retrySale = (id) => update('sales', id, { status: 'PENDING', error: null })

// expenses
export async function enqueueExpense({ businessId, userId, payload }) {
  const rec = { clientRequestId: payload.clientRequestId, businessId, userId, createdAt: Date.now(), payload, status: 'PENDING', attempts: 0, error: null }
  await put('expenses', rec)
  return rec
}
export const listExpenses = list('expenses')
export const discardExpense = (id) => remove('expenses', id)
export const retryExpense = (id) => update('expenses', id, { status: 'PENDING', error: null })

export async function countPending(businessId) {
  const all = [...(await listSales(businessId)), ...(await listExpenses(businessId))]
  return { pending: all.filter((r) => r.status === 'PENDING' || r.status === 'SYNCING').length, failed: all.filter((r) => r.status === 'FAILED').length }
}

/** How a failed send is handled. 'retry' = keep it and try later; 'auth' = person must sign in; 'refused' = the server said no (needs a person). */
export function classifyFailure(status) {
  if (status === 0 || status >= 500 || status === 429) return 'retry'
  if (status === 401) return 'auth'
  return 'refused'
}

let running = false

async function syncStore(store, businessId, send, onStep) {
  let sent = 0
  let failed = 0
  let stopped = null
  const queue = (await list(store)(businessId)).filter((r) => r.status === 'PENDING' || r.status === 'SYNCING').sort((a, b) => a.createdAt - b.createdAt)
  for (const rec of queue) {
    await update(store, rec.clientRequestId, { status: 'SYNCING', attempts: rec.attempts + 1 })
    try {
      const res = await send(rec)
      await update(store, rec.clientRequestId, { status: 'SYNCED', syncedAt: Date.now(), error: null, ...res })
      sent += 1
    } catch (e) {
      const kind = classifyFailure(e instanceof ApiError ? e.status : 0)
      if (kind === 'retry') { await update(store, rec.clientRequestId, { status: 'PENDING', error: 'Could not reach the server. Will try again.' }); stopped = 'network'; break }
      if (kind === 'auth') { await update(store, rec.clientRequestId, { status: 'PENDING', error: 'Sign in again to send this record.' }); stopped = 'auth'; break }
      await update(store, rec.clientRequestId, { status: 'FAILED', error: e.message || 'The server refused this record.' })
      failed += 1
    }
    onStep?.()
  }
  // Forget old confirmations so the list does not grow forever.
  for (const r of await list(store)(businessId)) if (r.status === 'SYNCED' && Date.now() - (r.syncedAt || 0) > 7 * DAY) await remove(store, r.clientRequestId)
  return { sent, failed, stopped }
}

const sendSale = async (rec) => { const s = await api.post('/sales', rec.payload); return { serverSaleNumber: s.saleNumber, serverTotal: s.total } }
const sendExpense = async (rec) => { const e = await api.post('/expenses', rec.payload); return { serverStatus: e.status } }

/**
 * Send everything saved on this device, one record at a time, oldest first (sales, then expenses), for the signed-in business only.
 * Network errors and 5xx keep the record PENDING and stop (try again later). 401 stops too: the person must sign in.
 * Any other refusal (stock, price changed, validation, subscription) marks the record FAILED with the server's reason; nothing is retried silently.
 * Progress is broadcast as 'shopscale:sync' events { running, done, total }.
 * @returns {{sent:number, failed:number, stopped:string|null}}
 */
export async function syncAll(businessId) {
  if (running || !businessId) return { sent: 0, failed: 0, stopped: 'busy' }
  running = true
  const total = (await countPending(businessId)).pending
  let done = 0
  const emit = (r) => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shopscale:sync', { detail: { running: r, done, total } })) }
  emit(true)
  const out = { sent: 0, failed: 0, stopped: null }
  try {
    for (const [store, send] of [['sales', sendSale], ['expenses', sendExpense]]) {
      const r = await syncStore(store, businessId, send, () => { done += 1; emit(true) })
      out.sent += r.sent; out.failed += r.failed
      if (r.stopped) { out.stopped = r.stopped; break }
    }
    if (!out.stopped) await setLastSync(businessId)
  } finally { running = false; emit(false); notify() }
  return out
}
export const syncSales = syncAll   // older name

/** On sign-out: drop reference copies and confirmed records. Unsent records are kept (they are real money records) and stay tied to their business. */
export async function clearOnLogout() {
  try {
    await tx('catalog', 'readwrite', (s) => wrap(s.clear()))
    for (const store of ['sales', 'expenses']) {
      const all = await tx(store, 'readonly', (s) => wrap(s.getAll()))
      for (const r of all || []) if (r.status === 'SYNCED') await tx(store, 'readwrite', (s) => wrap(s.delete(r.clientRequestId)))
    }
  } catch { /* nothing stored */ }
  notify()
}

export async function unsentCount(businessId) {
  const c = await countPending(businessId)
  return c.pending + c.failed
}
