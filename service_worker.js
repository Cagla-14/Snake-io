/* sw.js */
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `snake-cache-${CACHE_VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

// Install: pre-cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) && caches.delete(k)));
    await self.clients.claim();
  })());
});

// Fetch: network-first for HTML navigations, cache-first for assets
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Navigations (address bar, link tıklamaları)
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        return fresh;
      } catch (e) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Diğer istekler (ikonlar, manifest…): cache-first
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    const fresh = await fetch(req);
    // isteğe bağlı: dinamik cache
    cache.put(req, fresh.clone());
    return fresh;
  })());
});
