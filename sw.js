// Service Worker — Habit Tracker
// Versioned cache; cleans up old caches on activate.
// Note: this only manages Cache Storage (the app files). Habit data lives in
// localStorage, which the service worker never touches.

const CACHE_NAME = 'habits-v8';
// Every file listed here must exist, or the install fails.
const SHELL = [
  './',
  './index.html',
  './game.js',
  './avatar.js',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

// Bypass the HTTP cache so a re-cache really fetches fresh files.
const shellRequests = () => SHELL.map(p => new Request(p, { cache: 'reload' }));

// Install: cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(shellRequests()))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// The page asks for a refresh on every launch. addAll is all-or-nothing,
// so being offline leaves the existing cache intact.
self.addEventListener('message', event => {
  if (event.data !== 'recache') return;
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(shellRequests()))
      .catch(() => {})
  );
});

// Fetch: stale-while-revalidate for same-origin GETs — answer from the cache
// instantly (works offline), refresh the cached copy in the background.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Page loads are stored without their query string, so `./?source=…`
  // still opens offline.
  const isNav = req.mode === 'navigate';
  const key = isNav ? url.origin + url.pathname : req;

  event.respondWith(caches.open(CACHE_NAME).then(async cache => {
    const cached = (await cache.match(key, { ignoreSearch: isNav })) ||
                   (isNav ? await cache.match('./index.html') : undefined);

    const network = fetch(req).then(res => {
      // Only keep real successes — never a 404 or a redirect.
      if (res.ok && !res.redirected) cache.put(key, res.clone());
      return res;
    });

    if (cached) {
      event.waitUntil(network.catch(() => {}));
      return cached;
    }
    return network;
  }));
});
