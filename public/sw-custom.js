/**
 * Custom Service Worker for PWA with Environment Variable + Favicon/Name Support
 */

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
const { registerRoute } = workbox.routing;
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

// Clean up outdated precaches
cleanupOutdatedCaches();

// Install event
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Precache assets
try {
  precacheAndRoute(self.__WB_MANIFEST || []);
} catch (e) {
  console.log("Workbox precacheAndRoute failed (likely dev):", e);
}

// Config object
let pwaConfig = {};

// Listen for messages
self.addEventListener("message", (event) => {
  console.log("SW: Received message:", event.data);

  if (event.data?.type === "PWA_CONFIG") {
    pwaConfig = event.data.config;
    console.log("SW: Updated PWA config:", pwaConfig);

    // Send message back to clients to update favicon + title
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "UPDATE_APP_UI",
            favicon: pwaConfig.favicon,
            name: pwaConfig.name,
          });
        });
      });
  }

  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data?.type === "CLEAR_CACHES") {
    event.waitUntil(
      clearRuntimeCaches().then(() => {
        console.log("SW: Runtime caches cleared");
      })
    );
  }
});

// SPA navigation
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "html-cache",
    networkTimeoutSeconds: 5,
  })
);

// Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new StaleWhileRevalidate({
    cacheName: "google-fonts-stylesheets",
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 }),
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          return `${request.url}?timestamp=${Math.floor(
            Date.now() / (1000 * 60 * 60 * 24)
          )}`;
        },
      },
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
    plugins: [
      {
        requestWillFetch: async ({ request }) => {
          console.log("SW: Intercepting request:", request.url);
          console.log("SW: Current pwaConfig:", pwaConfig);

          let clientId = pwaConfig.clientId;

          if (!clientId) {
            try {
              const clients = await self.clients.matchAll();
              if (clients.length > 0) {
                const response = await new Promise((resolve) => {
                  const channel = new MessageChannel();
                  channel.port1.onmessage = (event) => resolve(event.data);
                  clients[0].postMessage({ type: "GET_CLIENT_ID" }, [
                    channel.port2,
                  ]);
                });

                if (response?.clientId) {
                  clientId = response.clientId;
                  pwaConfig.clientId = clientId;
                }
              }
            } catch (error) {
              console.log("SW: Could not get client ID:", error);
            }
          }

          if (clientId && request.url.includes("/accounts/clients/")) {
            const url = new URL(request.url);
            const pathParts = url.pathname.split("/");
            const clientIndex = pathParts.indexOf("clients");

            if (
              clientIndex > -1 &&
              (!pathParts[clientIndex + 1] ||
                pathParts[clientIndex + 1] === "undefined")
            ) {
              pathParts[clientIndex + 1] = clientId;
              url.pathname = pathParts.join("/");

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
          }

          return request;
        },
      },
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 }),
    ],
  })
);

// Activation
self.addEventListener("activate", (event) => {
  console.log("SW activated with config:", pwaConfig);

  event.waitUntil(
    (async () => {
      await clearRuntimeCaches();
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

console.log("Custom Service Worker loaded");
