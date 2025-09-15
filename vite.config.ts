import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "public",
      filename: "sw-custom.js",
      devOptions: {
        // Disable SW in dev to avoid HMR conflicts/reloads
        enabled: false,
        type: "classic",
      },
      // includeAssets: static files in /public copied as-is to the build output
      // and available to the service worker. Useful for favicons, mask icons, etc.
      includeAssets: [
        "pwa-192x192.png",
        "pwa-152x152.png",
        // "pwa-512x512.png",
        "pwa-192x192.svg",
        // "pwa-512x512.svg",
        "screenshot/desktop-view.png",
        "screenshot/mobile-view.png",
        "kumain_logo.jpg",
        "logo.png",
        "vittee.svg",
        "vittee_no_bg.svg",
        // Client-provided icons used for Android splash (from manifest)
        "CareerBridge Solutions ( 192 x 192 px. ).png",
        "CareerBridge Solutions ( 152 x 152 px . ).png",
        // iOS splash screen images
        "splash-1290x2796.svg",
        "splash-1179x2556.svg",
        "splash-1284x2778.svg",
        "splash-1170x2532.svg",
        "splash-1125x2436.svg",
        "splash-1242x2688.svg",
        "splash-828x1792.svg",
        "splash-750x1334.svg",
        "splash-640x1136.svg",
      ],
      manifest: {
        name: "Careerbridge Soulutions -Connecting talent with opportunities",
        short_name: "Careerbridge Solutions",
        description: "AI-powered learning and assessment platform",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        id: "/",
        // icons: Android uses these to create the OS splash image
        // Use client-provided PNGs so splash shows the desired artwork
        icons: [
          {
            src: "CareerBridge Solutions ( 192 x 192 px. ).png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "CareerBridge Solutions ( 152 x 152 px . ).png",
            sizes: "152x152",
            type: "image/png",
          },
          // Maskable variants to improve Android splash/icon rendering
          {
            src: "CareerBridge Solutions ( 192 x 192 px. ).png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "CareerBridge Solutions ( 152 x 152 px . ).png",
            sizes: "152x152",
            type: "image/png",
            purpose: "maskable",
          },
          // Keep scalable/vector fallbacks
          { src: "pwa-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "pwa-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
        ],
        // screenshots: displayed in installation prompts (Chrome) and store listings
        // to showcase app UI in different form factors.
        screenshots: [
          {
            src: "screenshot/desktop-view.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "screenshot/mobile-view.png",
            sizes: "390x844",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
      },
      injectManifest: {
        // Precache static assets; exclude HTML to avoid stale index.html
        globPatterns: ["**/*.{js,css,ico,svg,png}"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          redux: ["redux", "react-redux", "@reduxjs/toolkit"],
          query: ["@tanstack/react-query"],
          chart: ["chart.js", "react-chartjs-2", "recharts"],
          icons: ["lucide-react", "react-icons"],
          editor: [
            "@monaco-editor/react",
            "@uiw/react-codemirror",
            "codemirror",
          ],
          utils: [
            "date-fns",
            "uuid",
            "sanitize-html",
            "prismjs",
            "html-react-parser",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 2000,
  },
});
