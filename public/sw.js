/* Lumio service worker — hand-rolled (no Workbox).
 *
 * Strategy:
 *   - The app's own build files (/_next/static/*): cache-first. Their names
 *     carry a fingerprint of their contents, so a stored copy is never stale.
 *   - Other public files (/icons/*, logos, images): stored copy first, and
 *     refreshed in the background so a replaced image still arrives.
 *   - API (/api/*): never touched — straight to the network, never stored
 *   - Same-origin HTML navigations: network only → /offline.html when offline
 *   - Everything else (page data, manifests, JSON): never touched either
 *
 * WHY nothing but static files is cached: a phone is shared. Anything that
 * depends on who is signed in (every /api answer, every page and its data)
 * was once stored here by address alone and handed to the next person to sign
 * in on the same device — a parent was shown another family's child. The
 * cache has no idea who is signed in, so it must only ever hold files that
 * are the same for everybody.
 *
 * HOW A NEW RELEASE REACHES A PHONE. Pages are never stored, so every load
 * asks the server for the page, and the page names the new build files; the
 * old ones are simply never asked for again. Nothing here can hold a phone on
 * an old release.
 *
 * WHY the server must mark files as storable: only responses the server does
 * NOT mark private/no-store are kept (isShareable). next.config.ts used to
 * send no-store on everything, build files included, so this worker kept
 * nothing but the offline page — and with no signal, opening any module not
 * already loaded replaced the whole app with "This page couldn't load".
 * next.config.ts now marks /_next/static as immutable in a production build.
 *
 * Bump CACHE_VERSION on each deploy that ships SW changes so old caches are
 * pruned and clients pick up the new SW on next reload.
 */
const CACHE_VERSION = 'v6-2026-10-04-app-files';
const STATIC_CACHE  = `lumio-static-${CACHE_VERSION}`;
// Public files only. Named "assets" rather than the "runtime" older workers
// used: theirs also held page data and manifests, and pages empty every cache
// that is not known to be public (clearPrivateCaches in PwaInstaller.tsx).
const ASSET_CACHE   = `lumio-assets-${CACHE_VERSION}`;

const OFFLINE_URL = '/offline.html';

// Pre-cache: just the offline page. Everything else is stored on first use.
// (This list used to include the four sport logos — about 830 KB each, 3.3 MB
// downloaded in the background by every phone that opened any portal, whether
// or not it ever showed one of them. They are still stored the first time a
// page actually asks for one.)
const CORE_PRECACHE = [
  OFFLINE_URL,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(CORE_PRECACHE).catch(() => {}))
      // A new version normally WAITS until the person taps Reload on the
      // "Update available" card (or closes the app), so the app is never
      // swapped underneath them mid-task. The one exception: if the worker
      // being replaced is one of the old ones that stored private API answers
      // (it leaves a "lumio-api-…" or "lumio-html-…" cache behind), take over
      // at once — every minute it stays in charge it can show one person's
      // data to the next. Activation below then deletes those caches.
      .then(() => caches.keys())
      .then((keys) => {
        if (keys.some((k) => k.startsWith('lumio-api-') || k.startsWith('lumio-html-'))) return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, ASSET_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Allow page to trigger immediate activation of an updated SW.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Only files that are the same for every visitor may be stored. A response the
// server marked private or no-store is somebody's own, whatever its file name.
function isShareable(res) {
  if (!res || !res.ok || res.type !== 'basic') return false;
  return !/private|no-store/i.test(res.headers.get('cache-control') || '');
}

function isStaticAsset(url) {
  if (url.pathname.startsWith('/_next/static/')) return true;
  if (url.pathname.startsWith('/icons/')) return true;
  if (/\.(?:js|css|woff2?|ttf|eot|png|jpe?g|svg|gif|webp|ico)$/i.test(url.pathname)) return true;
  return false;
}

function isBuildFile(url) { return url.pathname.startsWith('/_next/static/'); }

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
    if (isShareable(res)) cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch (e) {
    return hit || Response.error();
  }
}

// For public files whose name does NOT change when their contents do (a logo,
// an icon): answer from the stored copy at once, and fetch a fresh one behind
// it for next time. Cache-first alone kept a replaced logo for ever.
async function storedThenRefresh(event, cacheName) {
  const { request } = event;
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const fresh = fetch(request)
    .then((res) => {
      if (isShareable(res)) cache.put(request, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);
  // Keep the worker alive until the refresh has landed.
  event.waitUntil(fresh);
  return hit || (await fresh) || Response.error();
}

// HTML navigations are ALWAYS served fresh from the network. We deliberately do
// NOT cache or replay the app's HTML shell: a cached shell references hashed
// /_next/static chunk URLs that stop existing after the next deploy, so replaying
// a stale shell boots the app against dead chunks → "This page couldn't load".
// When genuinely offline we fall back to the static, self-contained offline.html.
async function networkFirstHtml(request) {
  try {
    return await fetch(request);
  } catch (e) {
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

  // API answers belong to whoever is signed in. Not answering here leaves the
  // request to the browser exactly as if there were no service worker: no
  // cache read, no cache write. Checked first so a path like /api/x/logo.png
  // can never fall into the static-file rule below.
  if (isApi(url)) return;
  if (isBuildFile(url))      { event.respondWith(cacheFirst(request, ASSET_CACHE));           return; }
  if (isStaticAsset(url))    { event.respondWith(storedThenRefresh(event, ASSET_CACHE));       return; }
  if (isHtmlNav(request))    { event.respondWith(networkFirstHtml(request));                  return; }
  // Everything else — the data Next.js fetches for a page (?_rsc=…), manifests
  // (which can carry an install token), JSON — is left to the network too. It
  // used to be stored by address and replayed first, which has the same
  // wrong-person problem as the API cache.
});
