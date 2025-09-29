/**
 * Custom Service Worker with Auto-Generated Cache Version
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

// ✅ Auto-generated non-repeatable cache version
const generateCacheVersion = () => {
  const timestamp = Date.now(); // Current timestamp
  const randomSuffix = Math.floor(Math.random() * 10000); // Random 4-digit number
  const buildHash = timestamp.toString(36) + randomSuffix.toString(36); // Base36 encoding
  return `v${buildHash}`;
};

// ✅ Generate unique cache version automatically
const CACHE_VERSION = generateCacheVersion();
const CACHE_PREFIX = "ailinc-pwa";

console.log(`🔄 Generated Cache Version: ${CACHE_VERSION}`);

// ✅ Define all cache names with auto-generated version
const CACHES = {
  HTML: `${CACHE_PREFIX}-html-${CACHE_VERSION}`,
  STATIC: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  API: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
  FONTS: `${CACHE_PREFIX}-fonts-${CACHE_VERSION}`,
};

/* ===========================
   CACHE CLEANUP FUNCTIONS
   =========================== */

// ✅ Clear ALL caches (nuclear option)
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

// ✅ Clear only old version caches (selective cleanup)
const clearOldCaches = async () => {
  console.log("🧹 Clearing old version caches...");
  const cacheNames = await caches.keys();
  const currentCaches = Object.values(CACHES);

  const oldCaches = cacheNames.filter((cacheName) => {
    // Keep current version caches and workbox precache
    return (
      !currentCaches.includes(cacheName) &&
      !cacheName.startsWith("workbox-precache-")
    );
  });

  const deletePromises = oldCaches.map((cacheName) => {
    console.log("🗑️ Deleting old cache:", cacheName);
    return caches.delete(cacheName);
  });

  await Promise.all(deletePromises);
  console.log(`✅ Cleared ${oldCaches.length} old caches`);
};

/* ===========================
   SERVICE WORKER LIFECYCLE
   =========================== */

self.addEventListener("install", (event) => {
  console.log(`🚀 Service Worker installing - Version: ${CACHE_VERSION}`);

  event.waitUntil(
    (async () => {
      // ✅ Clear ALL caches on every deployment (nuclear option)
      await clearAllCaches();

      // Skip waiting to activate immediately
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  console.log(`⚡ Service Worker activated - Version: ${CACHE_VERSION}`);

  event.waitUntil(
    (async () => {
      // Clear any remaining old caches
      await clearOldCaches();

      // Take control of all clients immediately
      await self.clients.claim();

      console.log(
        `🎉 New service worker (${CACHE_VERSION}) is now controlling all pages`
      );
    })()
  );
});

/* ===========================
   PRECACHING
   =========================== */
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

/* ===========================
   RUNTIME CACHING STRATEGIES
   =========================== */

// ✅ Navigation (HTML) - Always fetch fresh, fallback to cache
const appShellHandler = new NetworkFirst({
  cacheName: CACHES.HTML,
  networkTimeoutSeconds: 3,
  plugins: [
    new ExpirationPlugin({
      maxEntries: 5,
      maxAgeSeconds: 60 * 60, // 1 hour
    }),
  ],
});

const navigationRoute = new NavigationRoute(
  async (options) => {
    try {
      return await appShellHandler.handle(options);
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

// ✅ Static Assets (JS, CSS) - Cache first, update in background
registerRoute(
  /\.(?:js|css|woff2?)$/i,
  new StaleWhileRevalidate({
    cacheName: CACHES.STATIC,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// ✅ Images - Cache first with longer expiration
registerRoute(
  /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/i,
  new CacheFirst({
    cacheName: CACHES.IMAGES,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// ✅ Google Fonts
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

// ✅ API Calls - Network first with short cache
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

/* ===========================
   MESSAGE HANDLING FOR CACHE INFO
   =========================== */

self.addEventListener("message", async (event) => {
  const { data } = event;

  switch (data.type) {
    case "GET_CACHE_VERSION":
      event.ports[0]?.postMessage({
        version: CACHE_VERSION,
        caches: Object.keys(CACHES),
        timestamp: Date.now(),
      });
      break;

    case "CLEAR_ALL_CACHES":
      console.log("📨 Received command to clear all caches");
      await clearAllCaches();
      event.ports[0]?.postMessage({ success: true, version: CACHE_VERSION });
      break;

    case "GET_CACHE_STATUS":
      const cacheNames = await caches.keys();
      event.ports[0]?.postMessage({
        cacheNames,
        currentVersion: CACHE_VERSION,
        activeCaches: Object.values(CACHES),
      });
      break;

    default:
      console.log("📨 Unknown message:", data);
  }
});

console.log(`✅ Service Worker loaded - Version: ${CACHE_VERSION}`);
