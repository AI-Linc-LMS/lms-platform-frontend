import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { hash } from "./src/utils/hash-function";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Critical: Use prompt instead of autoUpdate to avoid loops
      injectRegister: "auto",
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "public",
      filename: "sw-custom.js", // ✅ Source file name
      workbox: {
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false, // Keep disabled in dev to avoid conflicts
        type: "module", // Use module type for development
      },

      // Workbox configuration for injectManifest
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,png,svg,jpg,jpeg,gif,webp,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        swDest: "dist/sw-custom.js", // ✅ Matches the filename
        // Don't include these in precache
        globIgnores: [
          "**/node_modules/**/*",
          "**/*.map",
          "**/sw-custom.js",
          "**/workbox-*.js",
        ],
      },

      includeAssets: [
        "pwa-192x192.png",
        "pwa-512x512.png",
        "pwa-192x192.svg",
        "pwa-512x512.svg",
        "screenshot/desktop-view.png",
        "screenshot/mobile-view.png",
        "kumain_logo.jpg",
        "logo.png",
        "vittee.svg",
        "vittee_no_bg.svg",
        "splash-*.svg",
        "offline.html", // ✅ offline fallback
      ],

      manifest: false,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `[name]${hash}.js`,
        chunkFileNames: `[name]${hash}.js`,
        assetFileNames: `[name]${hash}.[ext]`,
      },
    },
    chunkSizeWarningLimit: 2000,
  },
});
