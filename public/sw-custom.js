importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

const { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } =
  workbox.precaching;
const { registerRoute, NavigationRoute } = workbox.routing;
const { StaleWhileRevalidate, CacheFirst, NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;

const PRECACHE_PREFIX = "workbox-precache";

async function clearRuntimeCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => !key.startsWith(PRECACHE_PREFIX))
      .map((key) => caches.delete(key))
  );
}

cleanupOutdatedCaches();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.startsWith(PRECACHE_PREFIX))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// ✅ Precache assets (including offline.html)
precacheAndRoute(self.__WB_MANIFEST);

// Runtime config
let pwaConfig = {};
self.addEventListener("message", (event) => {
  if (event.data?.type === "PWA_CONFIG") pwaConfig = event.data.config || {};
  if (event.data?.type === "CLEAR_CACHES")
    event.waitUntil(clearRuntimeCaches());
});

/* ======================
   ROUTES
   ====================== */

// HTML navigations with offline fallback
const networkFirstHandler = new NetworkFirst({
  cacheName: "html-cache",
  networkTimeoutSeconds: 5,
  plugins: [new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 60 })],
});

const navigationRoute = new NavigationRoute(async ({ event }) => {
  try {
    return await networkFirstHandler.handle({ event });
  } catch (err) {
    return caches.match("/offline.html"); // ✅ fallback
  }
});

registerRoute(navigationRoute);

// Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new StaleWhileRevalidate({
    cacheName: "google-fonts-stylesheets",
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: "google-fonts-webfonts",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 24 * 60 * 60,
      }),
    ],
  })
);

// Images
registerRoute(
  /\.(?:png|jpg|jpeg|gif|webp|svg)$/i,
  new StaleWhileRevalidate({
    cacheName: "image-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

// API calls
registerRoute(
  ({ url, request }) => {
    const isApiCall =
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/accounts/") ||
      url.hostname.includes("ailinc.com");
    return request.method === "GET" && isApiCall;
  },
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 10,
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 })],
  })
);

console.log("✅ Service Worker with offline fallback loaded");
