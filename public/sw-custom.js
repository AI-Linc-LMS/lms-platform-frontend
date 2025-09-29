/**
 * Fixed Service Worker with Proper Workbox Integration
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
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000);
  const buildHash = timestamp.toString(36) + randomSuffix.toString(36);
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
   IMPROVED CACHE CLEANUP FUNCTIONS
   =========================== */

// ✅ Selective cache clearing - only removes old custom caches
const clearOldCaches = async () => {
  console.log("🧹 Clearing old version caches...");
  const cacheNames = await caches.keys();
  const currentCaches = Object.values(CACHES);

  const oldCaches = cacheNames.filter((cacheName) => {
    // ✅ Keep Workbox precache and current version caches
    const isWorkboxCache =
      cacheName.startsWith("workbox-precache-") ||
      cacheName.startsWith("workbox-runtime-") ||
      cacheName.startsWith("workbox-");
    const isCurrentCache = currentCaches.includes(cacheName);
    const isOldVersionCache =
      cacheName.includes(CACHE_PREFIX) && !isCurrentCache;

    return !isWorkboxCache && isOldVersionCache;
  });

  if (oldCaches.length === 0) {
    console.log("✅ No old caches to clear");
    return;
  }

  const deletePromises = oldCaches.map(async (cacheName) => {
    console.log("🗑️ Deleting old cache:", cacheName);
    return caches.delete(cacheName);
  });

  await Promise.all(deletePromises);
  console.log(`✅ Cleared ${oldCaches.length} old caches`);
};

// ✅ Emergency cache clear (only for debugging)
const clearAllCustomCaches = async () => {
  console.log("🧹 Emergency: Clearing ALL custom caches...");
  const cacheNames = await caches.keys();

  const customCaches = cacheNames.filter((cacheName) => {
    // Only clear our custom caches, never touch Workbox system caches
    return cacheName.includes(CACHE_PREFIX);
  });

  const deletePromises = customCaches.map((cacheName) => {
    console.log("🗑️ Deleting custom cache:", cacheName);
    return caches.delete(cacheName);
  });

  await Promise.all(deletePromises);
  console.log(`✅ Emergency cleared ${customCaches.length} custom caches`);
};

/* ===========================
   FIXED SERVICE WORKER LIFECYCLE
   =========================== */

self.addEventListener("install", (event) => {
  console.log(`🚀 Service Worker installing - Version: ${CACHE_VERSION}`);

  event.waitUntil(
    (async () => {
      try {
        // ✅ Only clear old custom caches, let Workbox handle its own
        await clearOldCaches();

        console.log("🔄 Old caches cleared, proceeding with installation");

        // ✅ Don't skip waiting immediately - let proper lifecycle work
        // Only skip waiting if explicitly requested
      } catch (error) {
        console.error("❌ Error during install:", error);
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  console.log(`⚡ Service Worker activated - Version: ${CACHE_VERSION}`);

  event.waitUntil(
    (async () => {
      try {
        // ✅ Final cleanup of any remaining old caches
        await clearOldCaches();

        // ✅ Take control of all clients
        await self.clients.claim();

        console.log(
          `🎉 Service Worker (${CACHE_VERSION}) is now controlling all pages`
        );

        // ✅ Notify clients about successful activation
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({
            type: "SW_ACTIVATED",
            version: CACHE_VERSION,
            timestamp: Date.now(),
          });
        });
      } catch (error) {
        console.error("❌ Error during activation:", error);
      }
    })()
  );
});

/* ===========================
   WORKBOX PRECACHING
   =========================== */

// ✅ Let Workbox handle precaching with proper manifest
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

/* ===========================
   IMPROVED RUNTIME CACHING STRATEGIES
   =========================== */

// ✅ Navigation (HTML) - Network first with proper fallback
const appShellHandler = new NetworkFirst({
  cacheName: CACHES.HTML,
  networkTimeoutSeconds: 3,
  plugins: [
    new ExpirationPlugin({
      maxEntries: 5,
      maxAgeSeconds: 60 * 60, // 1 hour
    }),
    {
      // ✅ Add request/response logging
      requestWillFetch: async ({ request }) => {
        console.log(`📡 Fetching navigation: ${request.url}`);
        return request;
      },
      fetchDidFail: async ({ originalRequest }) => {
        console.warn(`⚠️ Navigation fetch failed: ${originalRequest.url}`);
      },
    },
  ],
});

const navigationRoute = new NavigationRoute(
  async (options) => {
    try {
      const response = await appShellHandler.handle(options);
      console.log(`✅ Navigation served: ${options.request.url}`);
      return response;
    } catch (err) {
      console.warn("⚠️ Navigation failed, serving offline fallback");
      try {
        return await matchPrecache("/offline.html");
      } catch (fallbackErr) {
        console.error("❌ Offline fallback also failed:", fallbackErr);
        return new Response("Offline", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }
    }
  },
  {
    allowlist: [
      /^(?!\/_)/,
      /^(?!.*\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)$)/,
    ],
    denylist: [/\/api\//, /\/admin\//, /\/__/],
  }
);

registerRoute(navigationRoute);

// ✅ Static Assets (JS, CSS) - Stale while revalidate with better matching
registerRoute(
  ({ request, url }) => {
    return (
      request.destination === "script" ||
      request.destination === "style" ||
      /\.(?:js|css|mjs)$/i.test(url.pathname)
    );
  },
  new StaleWhileRevalidate({
    cacheName: CACHES.STATIC,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// ✅ Font files - Cache first with longer expiration
registerRoute(
  ({ request, url }) => {
    return (
      request.destination === "font" ||
      /\.(?:woff|woff2|ttf|otf|eot)$/i.test(url.pathname)
    );
  },
  new CacheFirst({
    cacheName: CACHES.FONTS,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// ✅ Images - Cache first with proper image handling
registerRoute(
  ({ request, url }) => {
    return (
      request.destination === "image" ||
      /\.(?:png|jpg|jpeg|gif|webp|svg|ico|avif)$/i.test(url.pathname)
    );
  },
  new CacheFirst({
    cacheName: CACHES.IMAGES,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// ✅ Google Fonts - Separate strategies for CSS and font files
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new StaleWhileRevalidate({
    cacheName: `${CACHES.FONTS}-stylesheets`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
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
        maxEntries: 20,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// ✅ API Calls - Network first with better error handling
registerRoute(
  ({ url, request }) =>
    request.method === "GET" &&
    url.pathname.startsWith("/api/") &&
    !url.pathname.includes("/api/admin") && // Don't cache admin APIs
    url.origin === location.origin, // Only same-origin APIs
  new NetworkFirst({
    cacheName: CACHES.API,
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 10 * 60, // 10 minutes
      }),
      {
        fetchDidFail: async ({ originalRequest, error }) => {
          console.warn(`⚠️ API fetch failed: ${originalRequest.url}`, error);
        },
      },
    ],
  })
);

/* ===========================
   ENHANCED MESSAGE HANDLING
   =========================== */

self.addEventListener("message", async (event) => {
  const { data } = event;
  const clientId = event.source?.id;

  try {
    switch (data.type) {
      case "GET_CACHE_VERSION":
        event.ports[0]?.postMessage({
          version: CACHE_VERSION,
          caches: Object.keys(CACHES),
          timestamp: Date.now(),
          clientId,
        });
        break;

      case "GET_CACHE_STATUS":
        const cacheNames = await caches.keys();
        const workboxCaches = cacheNames.filter((name) =>
          name.startsWith("workbox-")
        );
        const customCaches = cacheNames.filter((name) =>
          name.includes(CACHE_PREFIX)
        );

        event.ports[0]?.postMessage({
          totalCaches: cacheNames.length,
          workboxCaches: workboxCaches.length,
          customCaches: customCaches.length,
          cacheList: cacheNames,
          currentVersion: CACHE_VERSION,
          activeCaches: Object.values(CACHES),
          timestamp: Date.now(),
        });
        break;

      case "CLEAR_OLD_CACHES":
        console.log("📨 Received command to clear old caches");
        await clearOldCaches();
        event.ports[0]?.postMessage({
          success: true,
          version: CACHE_VERSION,
          action: "old_caches_cleared",
        });
        break;

      case "EMERGENCY_CLEAR_CACHES":
        console.log("📨 Received EMERGENCY cache clear command");
        await clearAllCustomCaches();
        event.ports[0]?.postMessage({
          success: true,
          version: CACHE_VERSION,
          action: "emergency_clear_completed",
        });
        break;

      case "SKIP_WAITING":
        console.log("📨 Received skip waiting command");
        self.skipWaiting();
        event.ports[0]?.postMessage({
          success: true,
          version: CACHE_VERSION,
          action: "skip_waiting_executed",
        });
        break;

      case "FORCE_UPDATE":
        console.log("📨 Force update requested");
        await clearOldCaches();
        self.skipWaiting();
        event.ports[0]?.postMessage({
          success: true,
          version: CACHE_VERSION,
          action: "force_update_executed",
        });
        break;

      default:
        console.log("📨 Unknown message:", data);
        event.ports[0]?.postMessage({
          error: "Unknown message type",
          receivedType: data.type,
        });
    }
  } catch (error) {
    console.error("❌ Error handling message:", error);
    event.ports[0]?.postMessage({
      error: error.message,
      type: data.type,
    });
  }
});

console.log(`✅ Service Worker loaded - Version: ${CACHE_VERSION}`);
