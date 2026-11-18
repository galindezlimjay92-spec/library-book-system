const VERSION = 'v1';
const SHELL_CACHE = `lbs-shell-${VERSION}`;
const API_CACHE = `lbs-api-${VERSION}`;

const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isApiRequest(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.hostname.endsWith('onrender.com') ||
    url.port === '8080'
  );
}

// Network-First: network muna, at kung offline, cache
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'Offline at wala pang naka-save na data.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Cache-First: cache muna, at kung wala, network
async function cacheFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;

  // API GET requests -> Network-First
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Ibang domain (Firebase, Google, fonts) -> huwag pakialaman
  if (url.origin !== self.location.origin) return;

  // Page navigation -> network muna, fallback sa cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // App shell (JS, CSS, icons) -> Cache-First
  event.respondWith(cacheFirst(request));
});