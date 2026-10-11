/**
 * Momin Agro — Enterprise-Grade Offline Service Worker (v6)
 * 
 * Key Pillars:
 * 1. ZERO ARTIFICIAL TIMEOUTS: Navigation uses natural browser network fetch; on failure,
 *    instant fallback to cached app shell.
 * 2. BULLETPROOF PRECACHE: Pre-caches shell with Promise.allSettled so no single asset failure
 *    can abort Service Worker installation.
 * 3. STABLE ASSET HANDLING: JS/CSS requests never return HTTP 408/503 errors when offline.
 * 4. PURGE STALE CACHES: Automatically purges v1-v5 caches upon activation.
 */

const CACHE_VERSION = 'v6';
const SHELL_CACHE = `momin-agro-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `momin-agro-assets-${CACHE_VERSION}`;

const PRECACHE_SHELL = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/logo-96.png',
  '/logo-192.png',
];

// ─── Install: Resilient Pre-caching ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      // Pre-cache core shell assets individually to ensure 100% install success
      await Promise.allSettled(
        PRECACHE_SHELL.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW v6] Precache warning for', url, err);
          })
        )
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// ─── Activate: Purge Obsolete Caches & Claim Clients Immediately ────────────
self.addEventListener('activate', (event) => {
  const activeCaches = [SHELL_CACHE, ASSET_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => !activeCaches.includes(key)).map((key) => {
          console.log('[SW v6] Purging obsolete cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// ─── Fetch: Robust Offline Routing ──────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip browser extensions & Supabase cloud API requests
  // (Cloud operations are queued locally via offlineSyncQueue when offline)
  if (url.protocol.startsWith('chrome-extension') || url.hostname.includes('supabase.co')) {
    return;
  }

  // 1. Navigation (HTML document requests): Network First -> Instant Cache Fallback
  const isNavigation = request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then((cache) => {
              cache.put('/', clone);
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(async () => {
          // OFFLINE or Network Unreachable: Serve cached app shell immediately
          const cachedShell = (await caches.match(request)) || (await caches.match('/'));
          if (cachedShell) {
            return cachedShell;
          }

          // Fallback UI if opened offline before ever caching the shell
          return new Response(
            `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>মুমিন এগ্রো — অফলাইন মোড</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 40px 20px; background: #FBF9F4; color: #16402C; }
    .card { background: #FFFFFF; border-radius: 20px; padding: 32px 24px; max-width: 420px; margin: 0 auto; box-shadow: 0 8px 30px rgba(0,0,0,0.06); border: 1px solid #EAE2D0; }
    h2 { margin: 0 0 12px; font-size: 20px; }
    p { color: #5A7A6A; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
    button { background: #16402C; color: #FFFFFF; border: none; border-radius: 12px; padding: 12px 28px; font-size: 15px; font-weight: 600; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 44px; margin-bottom: 12px;">📶</div>
    <h2>ইন্টারনেট সংযোগ নেই</h2>
    <p>মুমিন এগ্রো অফলাইনে কাজ করার জন্য প্রস্তুত। একবার ইন্টারনেট অন করে পেজটি লোড করুন, এরপর ডেটা অফ থাকলেও যেকোনো সময় স্বয়ংক্রিয়ভাবে ওপেন হবে।</p>
    <button onclick="location.reload()">পুনরায় চেষ্টা করুন</button>
  </div>
</body>
</html>`,
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          );
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
          // Serve from cache instantly
          // Background revalidation if online
          if (self.navigator && self.navigator.onLine) {
            fetch(request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(ASSET_CACHE).then((cache) => cache.put(request, networkResponse));
              }
            }).catch(() => {});
          }
          return cachedResponse;
        }

        // Asset not in cache yet: Fetch from network and store in cache
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(ASSET_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(async () => {
          // OFFLINE: Provide safe fallbacks without throwing JavaScript parse errors
          if (/\.(png|jpg|jpeg|svg|webp)$/i.test(url.pathname)) {
            const cachedLogo = await caches.match('/logo-96.png');
            if (cachedLogo) return cachedLogo;
          }

          if (url.pathname.endsWith('.js')) {
            return new Response('/* Momin Agro Offline Fallback */', {
              status: 200,
              headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
            });
          }

          if (url.pathname.endsWith('.css')) {
            return new Response('/* Momin Agro Offline Fallback */', {
              status: 200,
              headers: { 'Content-Type': 'text/css; charset=utf-8' },
            });
          }

          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // 3. Default GET requests: Network with Cache Fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ─── Message: Instant Skip Waiting ──────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
