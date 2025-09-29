/**
 * Custom Service Worker with Local Workbox
 */

// Import workbox modules locally instead of CDN
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
  console.log("🚀 Service Worker installed");
  // Don't skip waiting to avoid conflicts
  // self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("⚡ Service Worker activated");
  event.waitUntil(self.clients.claim());
});

/* ===========================
   NAVIGATION HANDLING (SPA)
   =========================== */
const appShellHandler = new NetworkFirst({
  cacheName: "html-cache",
  networkTimeoutSeconds: 3,
  plugins: [
    new ExpirationPlugin({
      maxEntries: 5,
      maxAgeSeconds: 60 * 60, // 1h
    }),
  ],
});

// Catch failed navigations → show offline.html
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
    // Only apply to main navigation requests, not assets
    allowlist: [/^(?!\/_)/],
  }
);

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
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
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
        maxEntries: 10,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Images
registerRoute(
  /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/i,
  new StaleWhileRevalidate({
    cacheName: "image-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

// JS / CSS chunks
registerRoute(
  /\.(?:js|css|woff2?)$/i,
  new StaleWhileRevalidate({
    cacheName: "static-resources",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 24 * 60 * 60,
      }),
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
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 5 * 60,
      }),
    ],
  })
);

console.log("✅ Custom Service Worker with local workbox loaded");
