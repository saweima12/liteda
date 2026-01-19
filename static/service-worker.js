// Liteda Service Worker
// Version: 1.0.0

const CACHE_VERSION = 'liteda-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// Cache strategies
const CACHE_STRATEGIES = {
  APP_SHELL: 'app-shell-v1',
  STATIC: 'static-v1',
  API: 'api-v1',
  IMAGES: 'images-v1',
};

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_STRATEGIES.APP_SHELL);
      await cache.addAll(PRECACHE_ASSETS);
      console.log('[SW] Precached assets');
      // Activate immediately
      await self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => !Object.values(CACHE_STRATEGIES).includes(name))
          .map(name => caches.delete(name))
      );

      console.log('[SW] Old caches cleaned up');

      // Take control of all pages immediately
      await self.clients.claim();
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, CACHE_STRATEGIES.API));
    return;
  }

  // Images - Cache first, fallback to network
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, CACHE_STRATEGIES.IMAGES));
    return;
  }

  // Static assets (JS, CSS, fonts) - Cache first
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request, CACHE_STRATEGIES.STATIC));
    return;
  }

  // HTML pages - Network first, fallback to cache, then offline page
  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const response = await fetch(request);

          // Cache successful responses
          if (response.ok) {
            const cache = await caches.open(CACHE_STRATEGIES.APP_SHELL);
            cache.put(request, response.clone());
          }

          return response;
        } catch (error) {
          // Try cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Fallback to offline page
          const offlineResponse = await caches.match(OFFLINE_URL);
          if (offlineResponse) {
            return offlineResponse;
          }

          // Last resort: generic offline response
          return new Response('Offline - Unable to load page', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      })()
    );
    return;
  }

  // Default: network first
  event.respondWith(networkFirst(request, CACHE_STRATEGIES.STATIC));
});

// Cache Strategies

/**
 * Network first, fallback to cache
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

/**
 * Cache first, fallback to network
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    throw error;
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      (async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('[SW] All caches cleared');
      })()
    );
  }
});

// Listen for updates
self.addEventListener('message', (event) => {
  if (event.data === 'CHECK_UPDATE') {
    event.waitUntil(self.registration.update());
  }
});

console.log('[SW] Service worker loaded');
