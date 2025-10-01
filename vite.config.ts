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
      injectRegister: "auto",
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "public",
      filename: "sw-custom.js",

      // ✅ DISABLE manifest generation - we'll create it dynamically
      manifest: false,

      // ✅ Don't inject manifest link - we'll do it dynamically
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,png,svg,jpg,jpeg,gif,webp,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        swDest: "dist/sw-custom.js",
        globIgnores: [
          "**/node_modules/**/*",
          "**/*.map",
          "**/sw-custom.js",
          "**/workbox-*.js",
          "**/manifest.webmanifest", // ✅ Don't cache manifest
          "**/manifest.json", // ✅ Don't cache manifest
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
        // ✅ Don't cache manifest files
        navigateFallbackDenylist: [/^\/manifest/],
      },

      devOptions: {
        enabled: false,
        type: "module",
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
        "offline.html",
      ],
    }),

    // ✅ Plugin to remove manifest link from HTML
    {
      name: "remove-manifest-link",
      transformIndexHtml(html) {
        return html.replace(
          /<link\s+rel="manifest"\s+href="[^"]*"\s*\/?>/gi,
          ""
        );
      },
      enforce: "post",
    },
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
