/**
 * Custom Service Worker for PWA with Environment Variable Support
 */

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
const { registerRoute } = workbox.routing;
const { StaleWhileRevalidate, CacheFirst, NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;

const PRECACHE_PREFIX = "workbox-precache";

// Utility to clear runtime caches
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

// 🚀 Install new SW immediately
self.addEventListener("install", (event) => {
  console.log("🚀 Service Worker installed, skipping waiting...");
  self.skipWaiting();
});

// ⚡ Activate and take control immediately
self.addEventListener("activate", (event) => {
  console.log("⚡ Activating new Service Worker...");
  event.waitUntil(
    (async () => {
      await self.clients.claim();

      // 🧹 Clear old HTML caches to prevent stale index.html
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.includes("html-cache"))
          .map((k) => caches.delete(k))
      );

      console.log("✅ Service Worker now controlling all clients");
    })()
  );
});

// ✅ Precache static assets (but exclude index.html!)
try {
  precacheAndRoute(
    (self.__WB_MANIFEST || []).filter(
      (entry) => entry.url !== "index.html" && entry.url !== "/"
    )
  );
} catch (e) {
  console.log("Workbox precache failed (likely dev):", e);
}

// Runtime config from app
let pwaConfig = {};

// 🔄 Message listener
self.addEventListener("message", (event) => {
  if (event.data?.type === "PWA_CONFIG") {
    pwaConfig = event.data.config || {};
    console.log("Service Worker: Updated PWA config:", pwaConfig);
  }

  if (event.data?.type === "CLEAR_CACHES") {
    event.waitUntil(
      clearRuntimeCaches().then(() => {
        console.log("Service Worker: Runtime caches cleared manually");
      })
    );
  }
});

/* ======================
   ROUTES
   ====================== */

// 🏠 SPA navigations → NetworkFirst + cache bust
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "html-cache",
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 1,
        maxAgeSeconds: 60, // 1 minute only
      }),
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          // Force cache-busting per deployment
          return `${request.url}?v=${self.registration.scope}`;
        },
      },
    ],
  })
);

// Google Fonts Stylesheets
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new StaleWhileRevalidate({
    cacheName: "google-fonts-stylesheets",
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);

// Google Fonts Files
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: "google-fonts-webfonts",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 24 * 60 * 60, // ~2 months
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

console.log("✅ Custom SW loaded with Safari-safe instant activation");
