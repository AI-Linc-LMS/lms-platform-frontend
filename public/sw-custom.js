/**
 * Custom Service Worker for PWA with Environment Variable Support
 */

// Import workbox for precaching
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

const { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } =
  workbox.precaching;
const { registerRoute } = workbox.routing;
const { StaleWhileRevalidate, CacheFirst, NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;

const PRECACHE_PREFIX = "workbox-precache";

// Utility to clear runtime caches (used only when triggered manually)
async function clearRuntimeCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => !key.startsWith(PRECACHE_PREFIX))
      .map((key) => caches.delete(key))
  );
}

// Clean up outdated precaches automatically (safe)
cleanupOutdatedCaches();

// Install new SW immediately
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Precache all static assets
try {
  precacheAndRoute(self.__WB_MANIFEST || []);
} catch (e) {
  console.log("Workbox precacheAndRoute failed (likely dev):", e);
}

// Runtime config from app
let pwaConfig = {};

// Message listener for runtime updates
self.addEventListener("message", (event) => {
  console.log("Service Worker: Received message:", event.data);

  if (event.data?.type === "PWA_CONFIG") {
    pwaConfig = event.data.config || {};
    console.log("Service Worker: Updated PWA config:", pwaConfig);
  }

  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
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

// ✅ SPA fallback for offline/slow network
registerRoute(
  ({ request }) => request.mode === "navigate",
  createHandlerBoundToURL("/index.html")
);

// Google Fonts Stylesheets
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new StaleWhileRevalidate({
    cacheName: "google-fonts-stylesheets",
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 }),
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          // Bust cache daily
          return `${request.url}?ts=${Math.floor(
            Date.now() / (1000 * 60 * 60 * 24)
          )}`;
        },
      },
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

// API calls with dynamic base URL support
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
    plugins: [
      {
        requestWillFetch: async ({ request }) => {
          console.log("Service Worker: Intercepting request:", request.url);
          let clientId = pwaConfig.clientId;

          // Try to fetch clientId from main app if missing
          if (!clientId) {
            try {
              const clients = await self.clients.matchAll();
              if (clients.length > 0) {
                const response = await new Promise((resolve) => {
                  const mc = new MessageChannel();
                  mc.port1.onmessage = (event) => resolve(event.data);
                  clients[0].postMessage({ type: "GET_CLIENT_ID" }, [mc.port2]);
                });
                if (response?.clientId) {
                  clientId = response.clientId;
                  pwaConfig.clientId = clientId;
                }
              }
            } catch (err) {
              console.log("Service Worker: Could not get clientId:", err);
            }
          }

          // Rewrite request URL if needed
          if (clientId && request.url.includes("/accounts/clients/")) {
            const url = new URL(request.url);
            const parts = url.pathname.split("/");
            const idx = parts.indexOf("clients");
            if (
              idx > -1 &&
              (!parts[idx + 1] || parts[idx + 1] === "undefined")
            ) {
              parts[idx + 1] = clientId;
              url.pathname = parts.join("/");
              return new Request(url.toString(), request);
            }
          }
          return request;
        },
      },
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 }),
    ],
  })
);

/* ======================
   ACTIVATION
   ====================== */
self.addEventListener("activate", (event) => {
  console.log("Service Worker activated with config:", pwaConfig);

  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      clients.forEach((client) => {
        client.postMessage({ type: "REQUEST_PWA_CONFIG" });
      });
    })()
  );
});

console.log("✅ Custom Service Worker loaded");
