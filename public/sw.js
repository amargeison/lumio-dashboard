/* Lumio service worker — hand-rolled (no Workbox).
 *
 * Strategy:
 *   - Static assets (/_next/static/*, /icons/*, public images): cache-first
 *   - API (/api/*): stale-while-revalidate
 *   - Same-origin HTML navigations: network-first → cache → /offline.html
 *   - Everything else: pass-through (network-only)
 *
 * Bump CACHE_VERSION on each deploy that ships SW changes so old caches are
 * pruned and clients pick up the new SW on next reload.
 */
const CACHE_VERSION = 'v2-2026-04-20-png-icons';
const STATIC_CACHE  = `lumio-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `lumio-runtime-${CACHE_VERSION}`;
const HTML_CACHE    = `lumio-html-${CACHE_VERSION}`;
const API_CACHE     = `lumio-api-${CACHE_VERSION}`;

const OFFLINE_URL = '/offline.html';

// Pre-cache: just the offline shell + the four sport landings + manifests +
// icons. Everything else is populated on first hit.
const CORE_PRECACHE = [
  OFFLINE_URL,
  '/manifest-tennis.json',
  '/manifest-golf.json',
  '/manifest-darts.json',
  '/manifest-boxing.json',
  '/tennis_logo.png',
  '/golf_logo.png',
  '/darts_logo.png',
  '/boxing_logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(CORE_PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE, HTML_CACHE, API_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Allow page to trigger immediate activation of an updated SW.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isStaticAsset(url) {
  if (url.pathname.startsWith('/_next/static/')) return true;
  if (url.pathname.startsWith('/icons/')) return true;
  if (/\.(?:js|css|woff2?|ttf|eot|png|jpe?g|svg|gif|webp|ico)$/i.test(url.pathname)) return true;
  return false;
}

function isApi(url) { return url.pathname.startsWith('/api/'); }

function isHtmlNav(request) {
  if (request.mode === 'navigate') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch (e) {
    return hit || Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const networkPromise = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);
  return hit || (await networkPromise) || Response.error();
}

async function networkFirstHtml(request) {
  const cache = await caches.open(HTML_CACHE);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch (e) {
    const hit = await cache.match(request);
    if (hit) return hit;
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET; let other methods pass straight through.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Same-origin only — never proxy external requests through the SW.
  if (url.origin !== self.location.origin) return;

  // Skip Next.js HMR / dev endpoints if any sneak in.
  if (url.pathname.startsWith('/_next/webpack-hmr') || url.pathname.startsWith('/__nextjs')) return;

  if (isApi(url))            { event.respondWith(staleWhileRevalidate(request, API_CACHE));    return; }
  if (isStaticAsset(url))    { event.respondWith(cacheFirst(request, RUNTIME_CACHE));         return; }
  if (isHtmlNav(request))    { event.respondWith(networkFirstHtml(request));                  return; }
  // Everything else: default network with cache fallback.
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});
