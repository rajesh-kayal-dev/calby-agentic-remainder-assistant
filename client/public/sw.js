// Calby Production Service Worker for PWA
const CACHE_NAME = 'calby-pwa-v1';

const STATIC_PRECACHE = [
  '/offline.html',
  '/manifest.json',
  '/logo.png',
  '/Calby.png',
  '/Calby_text.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/favicon.ico',
];

// Install Event: Pre-cache static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_PRECACHE);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SW] Pre-cache warning:', err);
      })
  );
});

// Activate Event: Clean up outdated caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event: Safe network-first with offline fallback for navigation, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-HTTP/HTTPS schemes (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 2. Completely bypass Service Worker in local development / localhost to avoid Turbopack HMR chunk collisions
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  // 3. DO NOT cache non-GET requests (mutations, posts, updates)
  if (request.method !== 'GET') {
    return;
  }

  // 4. DO NOT cache API calls, Descope auth, or dynamic backend routes
  if (
    url.pathname.startsWith('/api') ||
    url.port === '5000' ||
    url.hostname.includes('descope.com') ||
    url.pathname.includes('/auth') ||
    url.pathname.includes('/extension-auth')
  ) {
    return;
  }

  // 5. HTML Navigation Requests: Network First -> Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        const offlineFallback = await cache.match('/offline.html');
        return offlineFallback || Response.error();
      })
    );
    return;
  }

  // 6. Static Assets (/_next/static/, images, fonts, icons): Cache-first with network fallback
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    STATIC_PRECACHE.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          return networkResponse;
        });
      })
    );
  }
});
