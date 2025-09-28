/**
 * Custom Service Worker with Offline Fallback
 */

// Import workbox
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

const { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } =
  workbox.precaching;
const { registerRoute, NavigationRoute } = workbox.routing;
const { StaleWhileRevalidate, CacheFirst, NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;

/* ===========================
   PRECACHE
   =========================== */
// Precache everything in __WB_MANIFEST + offline.html
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

/* ===========================
   INSTALL / ACTIVATE
   =========================== */
self.addEventListener("install", (event) => {
  console.log("🚀 Service Worker installed, skipping waiting...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("⚡ Activating new Service Worker...");
  event.waitUntil(self.clients.claim());
});

/* ===========================
   NAVIGATION HANDLING (SPA)
   =========================== */
const appShellHandler = new NetworkFirst({
  cacheName: "html-cache",
  networkTimeoutSeconds: 5,
  plugins: [
    new ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 60 * 60, // 1h
    }),
  ],
});

// Catch failed navigations → show offline.html
const navigationRoute = new NavigationRoute(async (options) => {
  try {
    return await appShellHandler.handle(options);
  } catch (err) {
    console.warn("⚠️ Navigation failed, serving offline.html");
    return matchPrecache("/offline.html");
  }
});

registerRoute(navigationRoute);

/* ===========================
   STATIC ASSETS
   =========================== */

// Google Fonts stylesheets
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new StaleWhileRevalidate({
    cacheName: "google-fonts-stylesheets",
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);

// Google Fonts webfonts
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

// JS / CSS chunks
registerRoute(
  /\.(?:js|css)$/i,
  new StaleWhileRevalidate({
    cacheName: "static-resources",
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  })
);

/* ===========================
   API CALLS
   =========================== */
registerRoute(
  ({ url, request }) =>
    request.method === "GET" && url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 10,
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 })],
  })
);

console.log("✅ Custom Service Worker with offline.html loaded");
