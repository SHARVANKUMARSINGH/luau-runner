// Luau Runner Service Worker - Optimized for PWA & Android TWA / APK devices
const CACHE_VERSION = 'v2-apk-20261013';
const CACHE_NAME = `luau-runner-${CACHE_VERSION}`;

// Essential app shell assets to precache for instant startup and offline capability
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons.svg',
  '/app-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/.well-known/assetlinks.json'
];

// Install: precache shell assets and force immediate activation without waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial warning:', err);
      });
    })
  );
});

// Activate: purge ALL old caches from previous installs/versions and claim active clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Notify all open PWA/APK windows that new version is active
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
        });
      });
    })
  );
});

// Listen for messages (e.g., skipWaiting or clearCache requests)
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data === 'skipWaiting')) {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});

// Fetch event handler:
// 1. Navigation requests (HTML): Network-first with cache fallback, ensuring latest JS bundle is loaded
// 2. Static assets (JS, CSS, images, WASM): Cache-first with network revalidation and dynamic caching
// 3. External API requests: Passed directly to network (never cached)
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Bypass non-same-origin requests (e.g. OpenRouter API, GitHub API, external endpoints)
  if (url.origin !== self.location.origin) return;

  // Bypass non-http protocols
  if (!url.protocol.startsWith('http')) return;

  // 1. Navigation requests (HTML documents):
  // Always attempt network first so PWA APK gets fresh index.html pointing to latest JS chunks
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback: serve cached index.html
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return caches.match('/');
        })
    );
    return;
  }

  // 2. Static assets (JS bundles, CSS, wasm, images):
  // Check cache first; if absent, fetch from network and dynamically store in cache
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(req)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, copy);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn('[SW] Offline fetch fallback failed for:', req.url, err);
          return cachedResponse;
        });
    })
  );
});
