/**
 * Custom Service Worker for PWA with Environment Variable Support
 */

// Import workbox for precaching
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
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

// Clean up outdated precaches automatically
cleanupOutdatedCaches();

// Install new SW immediately (ask browser to skip waiting)
self.addEventListener("install", (event) => {
  console.log("🚀 Service Worker installed, skipping waiting...");
  self.skipWaiting();
});

// Activate and take control (claim). Also notify clients.
self.addEventListener("activate", (event) => {
  console.log("⚡ Activating new Service Worker...");
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      console.log(
        "✅ Service Worker activated and controlling clients immediately (if browser allows)"
      );

      // Ask clients to send runtime config back, and notify that a new SW activated.
      // Some browsers (Safari) will still require the page to reload to use the new SW,
      // so we send a message so the client can reload or show a toast.
      let clientsList;
      try {
        // includeUncontrolled may not exist on old browsers; try with options then fallback.
        clientsList = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
      } catch (e) {
        clientsList = await self.clients.matchAll({ type: "window" });
      }

      clientsList.forEach((client) => {
        try {
          client.postMessage({ type: "REQUEST_PWA_CONFIG" });
          client.postMessage({ type: "NEW_SW_ACTIVATED" });
        } catch (err) {
          // ignore per-client messaging errors
        }
      });
    })()
  );
});

// Precache static assets (workbox manifest)
try {
  precacheAndRoute(self.__WB_MANIFEST || []);
} catch (e) {
  console.log("Workbox precacheAndRoute failed (likely dev):", e);
}

// Runtime config from app
let pwaConfig = {};

// Message listener for runtime updates + control messages from client
self.addEventListener("message", (event) => {
  const data = event.data || {};
  console.log("Service Worker: Received message:", data);

  // App sends PWA_CONFIG -> store it
  if (data?.type === "PWA_CONFIG") {
    pwaConfig = data.config || {};
    console.log("Service Worker: Updated PWA config:", pwaConfig);
    return;
  }

  // Client requested the SW skip waiting (useful when registration.waiting exists)
  if (data?.type === "SKIP_WAITING") {
    console.log(
      "Service Worker: Received SKIP_WAITING from client, calling skipWaiting()"
    );
    self.skipWaiting();
    return;
  }

  // Clear runtime caches on demand
  if (data?.type === "CLEAR_CACHES") {
    event.waitUntil(
      clearRuntimeCaches().then(() => {
        console.log("Service Worker: Runtime caches cleared manually");
      })
    );
    return;
  }
});

/* ======================
   ROUTES
   ====================== */

// SPA navigations: NetworkFirst for index.html with 5-minute cache
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "html-cache",
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 5,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
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

          // Try to fetch clientId from main app if missing (message channel)
          if (!clientId) {
            try {
              const clients = await self.clients.matchAll();
              if (clients.length > 0) {
                const response = await new Promise((resolve) => {
                  const mc = new MessageChannel();
                  mc.port1.onmessage = (ev) => resolve(ev.data);
                  // send GET_CLIENT_ID and pass port2 so the client can reply on it
                  clients[0].postMessage({ type: "GET_CLIENT_ID" }, [mc.port2]);
                });
                if (response?.clientId) {
                  clientId = response.clientId;
                  pwaConfig.clientId = clientId;
                  console.log(
                    "Service Worker: got clientId via MessageChannel:",
                    clientId
                  );
                }
              }
            } catch (err) {
              console.log("Service Worker: Could not get clientId:", err);
            }
          }

          // If we have a client ID, ensure it's in the URL
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

console.log(
  "✅ Custom Service Worker loaded with enhanced cross-browser activation support"
);
