/**
 * Momin Agro — Service Worker
 * 
 * Strategy: Cache-first for assets, Network-first for API calls
 * This makes the app load INSTANTLY on repeat visits (even offline)
 */

const CACHE_VERSION = 'v3';
const STATIC_CACHE = `momin-agro-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `momin-agro-dynamic-${CACHE_VERSION}`;
const FONT_CACHE = `momin-agro-fonts-${CACHE_VERSION}`;

// Assets to cache immediately on install (app shell)
const APP_SHELL = [
  '/',
  '/manifest.json',
];

// ─── Install: Pre-cache app shell ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL);
    }).then(() => {
      // Activate immediately, don't wait for old SW to die
      return self.skipWaiting();
    })
  );
});

// ─── Activate: Clean old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, FONT_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !validCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// ─── Fetch: Smart caching strategies ────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip: Non-GET requests (POST, PUT, DELETE → always go to network)
  if (request.method !== 'GET') return;

  // Skip: Supabase API calls (always fresh from network)
  if (url.hostname.includes('supabase.co')) return;

  // Skip: Chrome extension URLs
  if (url.protocol === 'chrome-extension:') return;

  // Strategy 1: CACHE FIRST for static assets (JS, CSS, images, fonts)
  // These have content-hash in filename so it's always safe to cache them permanently
  if (
    url.pathname.startsWith('/assets/') ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Strategy 2: STALE-WHILE-REVALIDATE for Google Fonts CSS
  // Instant load from cache, update in background
  if (url.hostname === 'fonts.googleapis.com') {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  // Strategy 3: NETWORK FIRST for HTML pages (always fresh app shell)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Strategy 4: CACHE FIRST for everything else (logo, icons, manifest)
  event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
});

// ─── Caching strategy implementations ───────────────────────────────────────

/** Cache first: serve from cache, fall back to network, then cache the response */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

/** Network first: try network, fall back to cache */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match('/');
  }
}

/** Stale-while-revalidate: serve cache immediately, update in background */
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);

  return cached || networkPromise;
}
