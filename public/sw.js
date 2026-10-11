// Momin Agro - Service Worker Cleanup
// Unregisters service worker and flushes old stale caches on all mobile devices

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.registration.unregister();
    })
  );
});

// Pass through all requests directly to network
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
