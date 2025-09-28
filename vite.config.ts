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
      registerType: "autoUpdate", // safer than autoUpdate
      strategies: "injectManifest",
      srcDir: "public",
      filename: "sw-custom.js",

      devOptions: {
        enabled: false,
        type: "classic",
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
        "splash-1290x2796.svg",
        "splash-1179x2556.svg",
        "splash-1284x2778.svg",
        "splash-1170x2532.svg",
        "splash-1125x2436.svg",
        "splash-1242x2688.svg",
        "splash-828x1792.svg",
        "splash-750x1334.svg",
        "splash-640x1136.svg",
        "offline.html", // ✅ offline fallback
      ],

      manifest: {
        name: "AiLinc - AI Learning Platform",
        short_name: "AiLinc",
        description: "AI-powered learning and assessment platform",
        start_url: "/login",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        lang: "en",
        scope: "/",
        orientation: "portrait",
        id: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          { src: "pwa-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "pwa-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
        ],
      },

      injectManifest: {
        globPatterns: ["**/*.{js,css,html,png,svg,jpg,woff2}"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
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
