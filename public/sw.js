const CACHE_VERSION = 'cuidde-pwa-v5'
const APP_SHELL_CACHE = `${CACHE_VERSION}-app-shell`

const APP_SHELL_ASSETS = [
  '/',
  '/para-cuidadores',
  '/blog',
  '/offline.html',
  '/manifest.webmanifest',
  '/logo.png',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/pwa-maskable-512.png',
]

const BLOCKED_HOSTS = [
  'supabase.co',
  'api.stripe.com',
  'js.stripe.com',
  'hooks.stripe.com',
  'accounts.google.com',
  'maps.googleapis.com',
  'viacep.com.br',
  'nominatim.openstreetmap.org',
]

const BLOCKED_PATH_PARTS = [
  '/auth',
  '/rest/v1',
  '/storage/v1',
  '/functions/v1',
  '/realtime',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_ASSETS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== APP_SHELL_CACHE).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

function isBlockedRuntimeRequest(request) {
  if (request.method !== 'GET') return true
  if (request.headers.has('Authorization')) return true

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return true
  if (BLOCKED_HOSTS.some((host) => url.hostname.includes(host))) return true
  if (BLOCKED_PATH_PARTS.some((part) => url.pathname.includes(part))) return true

  return false
}

function isCacheableStaticAsset(request) {
  const url = new URL(request.url)
  return APP_SHELL_ASSETS.includes(url.pathname) || url.pathname.startsWith('/assets/')
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (isBlockedRuntimeRequest(request)) return

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(async () => {
          return (await caches.match('/offline.html')) || caches.match('/index.html')
        }),
    )
    return
  }

  if (!isCacheableStaticAsset(request)) return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response
        const copy = response.clone()
        caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, copy))
        return response
      })
    }),
  )
})
