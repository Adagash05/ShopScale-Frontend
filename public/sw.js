/* ShopScale service worker.
 * - Caches only static application files (hashed build assets, icons, the app shell).
 * - NEVER caches /api/ requests, tokens or any business data. API calls always go to the network.
 * - A new version waits until the page tells it to activate, so an update never interrupts a sale in progress.
 * Bump VERSION when this file changes. */
const VERSION = 'v2'
const STATIC = `shopscale-static-${VERSION}`
const SHELL = `shopscale-shell-${VERSION}`

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/offline.html', '/manifest.webmanifest', '/icons/icon-192.png', '/brand/logo-96.png'])))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('shopscale-') && k !== STATIC && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return          // API on another origin, Paystack, fonts: leave alone
  if (url.pathname.startsWith('/api/')) return            // never cache API traffic

  // Hashed build assets never change: cache first.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req)
        if (hit) return hit
        const res = await fetch(req)
        if (res.ok) cache.put(req, res.clone())
        return res
      }),
    )
    return
  }

  // Page loads: network first so users always get the newest app shell; fall back to the cached shell, then offline page.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(SHELL).then((c) => c.put('/index.html', copy)) }
        return res
      }).catch(async () => (await caches.match('/index.html')) || (await caches.match('/offline.html'))),
    )
  }
})
