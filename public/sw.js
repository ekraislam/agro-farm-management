/**
 * Momin Agro — Enterprise-Grade Offline Service Worker
 * 
 * Strategy:
 * 1. Navigation requests (HTML / page loads): Network-first with instant Cache fallback.
 *    -> Result: Fresh version when online; 100% offline instant loading when data is off!
 * 2. Static assets (JS, CSS, fonts, logos): Cache-first with background network caching.
 *    -> Result: Instant sub-second loads and full offline capability.
 * 3. Supabase / Cloud APIs: Direct network (queued via offlineSyncQueue when offline).
 */

const CACHE_VERSION = 'v5';
const SHELL_CACHE = `momin-agro-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `momin-agro-assets-${CACHE_VERSION}`;

const PRECACHE_SHELL = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/logo-192.png',
  '/logo-96.png',
  '/logo-512.png',
];

// ─── Install: Pre-cache core shell ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_SHELL);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// ─── Activate: Purge obsolete version caches ────────────────────────────────
self.addEventListener('activate', (event) => {
  const currentCaches = [SHELL_CACHE, ASSET_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => !currentCaches.includes(key)).map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// ─── Fetch: Smart offline routing ───────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip browser extensions & cloud DB requests (Supabase handled by app queue)
  if (url.protocol.startsWith('chrome-extension') || url.hostname.includes('supabase.co')) {
    return;
  }

  // 1. Navigation (HTML document requests): Network First -> Fallback to Cache
  const isNavigation = request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
  if (isNavigation) {
    event.respondWith(
      fetchWithTimeout(request, 2500)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then((cache) => {
              cache.put('/', clone);
            });
          }
          return response;
        })
        .catch(async () => {
          // OFFLINE: Serve cached app shell immediately
          const cachedShell = await caches.match(request);
          if (cachedShell) return cachedShell;
          const rootFallback = await caches.match('/');
          if (rootFallback) return rootFallback;
          return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  // 2. Static Assets (JS chunks, CSS, images, Google Fonts): Cache First -> Network
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    /\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/i.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return from cache immediately; fetch in background to refresh
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        // Not yet in cache -> fetch from network and store for next offline visit
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(ASSET_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(async () => {
          // If offline and requesting an image, try matching logo
          if (/\.(png|jpg|jpeg|svg|webp)$/i.test(url.pathname)) {
            return (await caches.match('/favicon.svg')) || new Response('', { status: 404 });
          }
          return new Response('', { status: 408 });
        });
      })
    );
    return;
  }

  // Default: Network with Cache Fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

/** Helper to timeout network fetch on slow/stalled mobile connections */
function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Network timeout'));
    }, ms);

    fetch(request)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
