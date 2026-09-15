/**
 * AYK Solar Project Management — Service Worker
 *
 * Strategy summary:
 *  - App shell (HTML, JS, CSS bundles): stale-while-revalidate
 *  - Static assets (images, fonts, icons): cache-first with network fallback
 *  - API requests (/api/*): network-first, fall back to cache when offline
 *  - Navigation requests: network-first, fall back to cached app shell
 *  - Background sync queue for POST/PUT/DELETE when offline
 *  - Auto-update via skipWaiting + clients.claim on new SW activation
 *
 * Cache versioning: bump CACHE_VERSION to invalidate old caches on deploy.
 */

const CACHE_VERSION = 'v1.0.0'
const STATIC_CACHE = `ayk-static-${CACHE_VERSION}`
const RUNTIME_CACHE = `ayk-runtime-${CACHE_VERSION}`
const IMAGE_CACHE = `ayk-images-${CACHE_VERSION}`

// App-shell URLs to pre-cache on install. Keep this list short — the rest
// will be cached on first visit via the runtime caches.
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/logo.svg',
  '/icons/icon.svg',
  '/offline.html',
]

// Maximum number of entries to keep in the image cache.
const IMAGE_CACHE_MAX = 60

// ---------------------------------------------------------------------------
// Install — pre-cache the app shell, then skipWaiting so the new SW
// activates immediately on the next navigation.
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      // Use addAll but tolerate individual failures (e.g. offline.html missing).
      await Promise.all(
        APP_SHELL.map(async (url) => {
          try {
            await cache.add(url)
          } catch (err) {
            // Non-fatal: skip files that 404 in dev.
            console.warn('[SW] Skipping precache for', url, err?.message || err)
          }
        })
      )
      await self.skipWaiting()
    })()
  )
})

// ---------------------------------------------------------------------------
// Activate — clean up old caches and claim all open clients so the new
// SW takes effect immediately.
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE, IMAGE_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

// ---------------------------------------------------------------------------
// Background sync — queue failed mutations and replay when connectivity
// returns. We use a simple in-IDB-free in-memory queue + IndexedDB is overkill
// for a demo; replay happens on the 'sync' event.
// ---------------------------------------------------------------------------
const MUTATION_QUEUE = []
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

self.addEventListener('sync', (event) => {
  if (event.tag === 'ayk-replay-queue') {
    event.waitUntil(replayQueue())
  }
})

async function replayQueue() {
  while (MUTATION_QUEUE.length > 0) {
    const req = MUTATION_QUEUE.shift()
    try {
      await fetch(req)
    } catch (err) {
      // Put it back and stop — network still down.
      MUTATION_QUEUE.unshift(req)
      throw err
    }
  }
  // Notify clients that pending mutations were flushed.
  const clients = await self.clients.matchAll({ includeUncontrolled: true })
  clients.forEach((c) => c.postMessage({ type: 'AYK_QUEUE_FLUSHED' }))
}

// ---------------------------------------------------------------------------
// Helper: is this an API mutation request that should be queued on failure?
// ---------------------------------------------------------------------------
function isApiMutation(url, method) {
  return url.pathname.startsWith('/api/') && MUTATION_METHODS.has(method.toUpperCase())
}

// ---------------------------------------------------------------------------
// Helper: LRU trim for the image cache.
// ---------------------------------------------------------------------------
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > maxItems) {
    // Delete oldest entries (first in, first out).
    await Promise.all(keys.slice(0, keys.length - maxItems).map((k) => cache.delete(k)))
  }
}

// ---------------------------------------------------------------------------
// Fetch — main routing logic.
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only handle GET requests via caches; mutations go to the network.
  // For non-GET requests that fail, we queue them for background sync.
  if (request.method !== 'GET') {
    if (isApiMutation(new URL(request.url), request.method)) {
      event.respondWith(
        (async () => {
          try {
            return await fetch(request)
          } catch (err) {
            // Queue and return a synthetic 202 so the UI doesn't crash.
            MUTATION_QUEUE.push(request.clone())
            // Try to register a background sync (Chrome/Edge only).
            if (self.registration && 'sync' in self.registration) {
              try {
                await self.registration.sync.register('ayk-replay-queue')
              } catch {
                /* ignore */
              }
            }
            return new Response(
              JSON.stringify({ queued: true, message: 'Offline — your change will be synced when you reconnect.' }),
              { status: 202, headers: { 'Content-Type': 'application/json' } }
            )
          }
        })()
      )
    }
    return
  }

  const url = new URL(request.url)

  // Skip cross-origin requests entirely (let the browser handle them).
  if (url.origin !== self.location.origin) return

  // Skip Next.js dev HMR & internal chunks in dev — they change too fast.
  if (url.pathname.startsWith('/_next/webpack-hmr')) return

  // 1) Navigation requests (HTML pages): network-first, fall back to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          const cache = await caches.open(RUNTIME_CACHE)
          cache.put(request, fresh.clone())
          return fresh
        } catch (err) {
          const cached = await caches.match(request)
          if (cached) return cached
          const shell = await caches.match('/')
          if (shell) return shell
          return new Response('You are offline and no cached page is available.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          })
        }
      })()
    )
    return
  }

  // 2) API GET requests: network-first, fall back to cache.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          const cache = await caches.open(RUNTIME_CACHE)
          cache.put(request, fresh.clone())
          return fresh
        } catch (err) {
          const cached = await caches.match(request)
          if (cached) return cached
          return new Response(JSON.stringify({ error: 'offline', message: 'You are offline.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      })()
    )
    return
  }

  // 3) Static assets (images, fonts, icons, svg, manifest): cache-first.
  const isImage = /\.(?:png|jpe?g|gif|webp|svg|ico|avif)$/i.test(url.pathname) || request.destination === 'image'
  if (isImage) {
    event.respondWith(
      (async () => {
        const imgCache = await caches.open(IMAGE_CACHE)
        const cached = await imgCache.match(request)
        if (cached) {
          // Revalidate in the background.
          fetch(request).then((fresh) => {
            if (fresh && fresh.ok) imgCache.put(request, fresh.clone())
          }).catch(() => {})
          return cached
        }
        try {
          const fresh = await fetch(request)
          if (fresh && fresh.ok) {
            imgCache.put(request, fresh.clone())
            await trimCache(IMAGE_CACHE, IMAGE_CACHE_MAX)
          }
          return fresh
        } catch (err) {
          return new Response('', { status: 504, statusText: 'Gateway Timeout' })
        }
      })()
    )
    return
  }

  // 4) Everything else (JS, CSS, fonts): stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME_CACHE)
      const cached = await cache.match(request)
      const fetchPromise = fetch(request)
        .then((fresh) => {
          if (fresh && fresh.ok) cache.put(request, fresh.clone())
          return fresh
        })
        .catch(() => cached)
      return cached || fetchPromise
    })()
  )
})

// ---------------------------------------------------------------------------
// Message handler — allows the page to trigger an immediate update.
// ---------------------------------------------------------------------------
self.addEventListener('message', (event) => {
  if (event.data === 'AYK_SKIP_WAITING') {
    self.skipWaiting()
  }
})
