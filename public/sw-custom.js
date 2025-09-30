/**
 * Service Worker with Immediate Activation - No Waiting State
 */

// Import workbox modules locally
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  matchPrecache,
} from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import {
  StaleWhileRevalidate,
  CacheFirst,
  NetworkFirst,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// ✅ Auto-generated cache version
const generateCacheVersion = () => {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000);
  const buildHash = timestamp.toString(36) + randomSuffix.toString(36);
  return `v${buildHash}`;
};

const CACHE_VERSION = generateCacheVersion();
const CACHE_PREFIX = "ailinc-pwa";

console.log(
  `🚀 Service Worker Version: ${CACHE_VERSION} - Immediate Activation Mode`
);

// Clear all caches function
const clearAllCaches = async () => {
  console.log("🧹 Clearing ALL existing caches...");
  const cacheNames = await caches.keys();
  const deletePromises = cacheNames.map((cacheName) => {
    console.log("🗑️ Deleting cache:", cacheName);
    return caches.delete(cacheName);
  });
  await Promise.all(deletePromises);
  console.log("✅ All caches cleared successfully");
};

/* ===========================
   IMMEDIATE ACTIVATION LIFECYCLE
   =========================== */

self.addEventListener("install", (event) => {
  console.log(`🚀 Installing Service Worker ${CACHE_VERSION} - IMMEDIATE MODE`);

  // ✅ IMMEDIATE ACTIVATION: Skip waiting phase entirely
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      try {
        // Clear all existing caches immediately
        await clearAllCaches();
        console.log(
          `✅ Service Worker ${CACHE_VERSION} installed and skipped waiting`
        );
      } catch (error) {
        console.error("❌ Installation failed:", error);
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  console.log(
    `⚡ Activating Service Worker ${CACHE_VERSION} - TAKING IMMEDIATE CONTROL`
  );

  event.waitUntil(
    (async () => {
      try {
        // Final cleanup
        await clearAllCaches();

        // ✅ IMMEDIATE CONTROL: Claim all clients right away
        await self.clients.claim();

        console.log(
          `🎉 Service Worker ${CACHE_VERSION} activated and claimed ALL clients immediately`
        );

        // ✅ Notify all clients about immediate takeover
        const allClients = await self.clients.matchAll({
          includeUncontrolled: true,
          type: "window",
        });

        console.log(
          `📢 Notifying ${allClients.length} clients of immediate activation`
        );

        allClients.forEach((client) => {
          client.postMessage({
            type: "SW_IMMEDIATE_ACTIVATION",
            version: CACHE_VERSION,
            timestamp: Date.now(),
            message: "Service worker activated immediately - no waiting!",
          });
        });
      } catch (error) {
        console.error("❌ Activation failed:", error);
      }
    })()
  );
});

/* ===========================
   MESSAGE HANDLING
   =========================== */

self.addEventListener("message", async (event) => {
  console.log("📨 Service Worker received message:", event.data);

  const { data } = event;

  switch (data.type) {
    case "GET_VERSION":
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          type: "VERSION_INFO",
          version: CACHE_VERSION,
          state: "immediate-activation-mode",
          activated: true,
        });
      }
      break;

    case "CLEAR_CACHES":
      try {
        await clearAllCaches();
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ type: "CACHES_CLEARED" });
        }
      } catch (error) {
        console.error("❌ Cache clearing failed:", error);
      }
      break;

    case "PWA_CONFIG":
      console.log("📨 Received PWA config:", data.config);
      break;

    case "FORCE_ACTIVATION":
      // Already in immediate mode, but acknowledge
      console.log("📨 Force activation requested - already in immediate mode");
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          type: "ALREADY_IMMEDIATE",
          version: CACHE_VERSION,
        });
      }
      break;

    default:
      console.log("📨 Unknown message type:", data.type);
  }
});

/* ===========================
   PRECACHING & ROUTING
   =========================== */

// Precache assets with immediate availability
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// ✅ Define cache names with version
const CACHES = {
  HTML: `${CACHE_PREFIX}-html-${CACHE_VERSION}`,
  STATIC: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  API: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
  FONTS: `${CACHE_PREFIX}-fonts-${CACHE_VERSION}`,
};

// Enhanced navigation handling
const navigationRoute = new NavigationRoute(
  async (options) => {
    try {
      const response = await new NetworkFirst({
        cacheName: CACHES.HTML,
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 5,
            maxAgeSeconds: 60 * 60, // 1 hour
          }),
        ],
      }).handle(options);

      return response;
    } catch (err) {
      console.warn("⚠️ Navigation failed, serving offline.html");
      return matchPrecache("/offline.html");
    }
  },
  {
    allowlist: [/^(?!\/_)/],
  }
);

registerRoute(navigationRoute);

// Static assets with immediate caching
registerRoute(
  /\.(?:js|css|woff2?)$/i,
  new StaleWhileRevalidate({
    cacheName: CACHES.STATIC,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

// Images with immediate caching
registerRoute(
  /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/i,
  new CacheFirst({
    cacheName: CACHES.IMAGES,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new StaleWhileRevalidate({
    cacheName: `${CACHES.FONTS}-stylesheets`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: `${CACHES.FONTS}-webfonts`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// API calls with immediate caching
registerRoute(
  ({ url, request }) =>
    request.method === "GET" && url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: CACHES.API,
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

console.log(
  `✅ Service Worker ${CACHE_VERSION} loaded - IMMEDIATE ACTIVATION MODE`
);
