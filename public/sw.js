// CampusMart Service Worker
// Strategy: Cache-first for static assets, network-first for API/dynamic content
const CACHE_NAME    = 'campusmart-v1';
const STATIC_ASSETS = ['/', '/offline'];

// ── Install: cache critical assets ──────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Don't fail install if offline page doesn't exist yet
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: purge old caches ───────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: stale-while-revalidate for pages, cache-first for assets ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  // Skip Supabase API calls — always network
  if (url.hostname.includes('supabase')) return;

  // Static assets (JS, CSS, images, fonts) — cache-first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached ?? new Response('', { status: 408 }));
      })
    );
    return;
  }

  // HTML pages — network-first, fall back to cache
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached => cached ?? caches.match('/'))
        )
    );
  }
});

// ── Push notifications ───────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;

  let data = { title: 'CampusMart', body: 'You have a new update', url: '/' };
  try { data = { ...data, ...event.data.json() }; } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data:  { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url ?? '/')
  );
});
