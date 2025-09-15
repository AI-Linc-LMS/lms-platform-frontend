/**
 * Custom Service Worker for PWA with Environment Variable Support
 */

// Import workbox for precaching
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } = workbox.precaching;
const { registerRoute, NavigationRoute } = workbox.routing;
const { StaleWhileRevalidate, CacheFirst, NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;

const PRECACHE_PREFIX = 'workbox-precache';

async function clearRuntimeCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => !key.startsWith(PRECACHE_PREFIX))
      .map((key) => caches.delete(key))
  );
}

// Clean up outdated precaches
cleanupOutdatedCaches();

// Always activate updated SW immediately and take control of pages
self.addEventListener('install', () => {
  // Ensure the new service worker activates immediately
  self.skipWaiting();
});


// Precache all static assets (handle dev where manifest may be undefined)
try {
  precacheAndRoute(self.__WB_MANIFEST || []);
} catch (e) {
   
  console.log('Workbox precacheAndRoute failed (likely dev):', e);
}

// Get configuration from session storage when available
let pwaConfig = {};

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Received message:', event.data);
  
  if (event.data && event.data.type === 'PWA_CONFIG') {
    pwaConfig = event.data.config;
    console.log('Service Worker: Updated PWA config:', pwaConfig);
    console.log('Service Worker: Client ID is:', pwaConfig.clientId);
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      clearRuntimeCaches().then(() => {
        console.log('Service Worker: Runtime caches cleared');
      })
    );
  }
});

// Navigation handling for SPA
// Use NetworkFirst for navigations so index.html is always fetched fresh
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'html-cache',
    networkTimeoutSeconds: 5,
  }),
);

// Google Fonts Stylesheets
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 }),
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          return `${request.url}?timestamp=${Math.floor(Date.now() / (1000 * 60 * 60 * 24))}`;
        }
      },
    ]
  })
);

// Google Fonts Files
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 24 * 60 * 60 })],
  })
);

// Images
registerRoute(
  /\.(?:png|jpg|jpeg|gif|webp|svg)$/i,
  new StaleWhileRevalidate({
    cacheName: 'image-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 })],
  })
);

// API calls with dynamic base URL support
registerRoute(
  ({ url, request }) => {
    // Check if it's an API call
    const isApiCall = url.pathname.startsWith('/api/') || 
                     url.pathname.startsWith('/accounts/') ||
                     url.hostname.includes('ailinc.com');
    
    return request.method === 'GET' && isApiCall;
  },
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [{
      requestWillFetch: async ({ request }) => {
        console.log('Service Worker: Intercepting request:', request.url);
        console.log('Service Worker: Current pwaConfig:', pwaConfig);
        
        let clientId = pwaConfig.clientId;
        console.log('Service Worker: Client ID from config:', clientId);
        
        // If no client ID in config, try to get it from session storage
        if (!clientId) {
          console.log('Service Worker: No client ID in config, trying to get from main app...');
          try {
            const clients = await self.clients.matchAll();
            console.log('Service Worker: Found clients:', clients.length);
            if (clients.length > 0) {
              // Request client ID from the main app
              const response = await new Promise((resolve) => {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                  console.log('Service Worker: Received response from main app:', event.data);
                  resolve(event.data);
                };
                clients[0].postMessage({ type: 'GET_CLIENT_ID' }, [messageChannel.port2]);
              });
              
              if (response && response.clientId) {
                clientId = response.clientId;
                pwaConfig.clientId = clientId;
                console.log('Service Worker: Got client ID from main app:', clientId);
              }
            }
          } catch (error) {
            console.log('Service Worker: Could not get client ID from main app:', error);
          }
        }
        
        // If we have a client ID, ensure it's in the URL
        if (clientId && request.url.includes('/accounts/clients/')) {
          console.log('Service Worker: Rewriting URL with client ID:', clientId);
          const url = new URL(request.url);
          const pathParts = url.pathname.split('/');
          const clientIndex = pathParts.indexOf('clients');
          
          if (clientIndex > -1 && (pathParts[clientIndex + 1] === 'undefined' || !pathParts[clientIndex + 1])) {
            pathParts[clientIndex + 1] = clientId;
            url.pathname = pathParts.join('/');
            
            console.log('Service Worker: Original URL:', request.url);
            console.log('Service Worker: Updated URL:', url.toString());
            
            return new Request(url.toString(), {
              method: request.method,
              headers: request.headers,
              body: request.body,
              mode: request.mode,
              credentials: request.credentials,
              cache: request.cache,
              redirect: request.redirect,
              referrer: request.referrer,
            });
          }
        } else {
          console.log('Service Worker: No client ID or not a client API URL');
        }
        
        return request;
      }
    }, new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 })]
  })
);

// Handle activation
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated with config:', pwaConfig);

  event.waitUntil(
    (async () => {
      // Clear all runtime caches to avoid stale data after updates
      await clearRuntimeCaches();
      await self.clients.claim();
      // Avoid forcing navigation on clients; rely on controllerchange in app to reload when desired
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach((client) => {
        client.postMessage({ type: 'REQUEST_PWA_CONFIG' });
      });
    })()
  );
});

console.log('Custom Service Worker loaded');
