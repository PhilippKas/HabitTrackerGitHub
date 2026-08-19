// Service Worker — Habit Tracker
// Versioned cache; cleans up old caches on activate.

const CACHE_NAME = 'habits-v3';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for shell, network-first for everything else
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // App shell — cache first
  if (SHELL.some(p => url.pathname.endsWith(p.replace('./', '')))) {
    event.respondWith(
      caches.match(event.request).then(r => r || fetch(event.request))
    );
    return;
  }

  // Everything else — network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
