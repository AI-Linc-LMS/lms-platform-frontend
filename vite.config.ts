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
        "Garage University Coloured Logo.png",
        "Garage University SVG.svg",
        "GarageUniversity White Logo.png",
        "Pure Coloured Icon PNG.png",
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
        // iOS splash screen images
        "splash-1290x2796.png",
        "splash-2796x1290.png",
        "splash-1179x2556.png",
        "splash-2556x1179.png",
        "splash-1284x2778.png",
        "splash-2778x1284.png",
        "splash-1170x2532.png",
        "splash-2532x1170.png",
        "splash-1125x2436.png",
        "splash-2436x1125.png",
        "splash-1242x2688.png",
        "splash-2688x1242.png",
        "splash-828x1792.png",
        "splash-1792x828.png",
        "splash-750x1334.png",
        "splash-1334x750.png",
        "splash-640x1136.png",
        "splash-1136x640.png",
      ],
      manifest: {
        name: "Garage University",
        short_name: "Garage University",
        description: "AI-powered learning and assessment platform",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        id: "/",
        // icons: used by Android/Chrome and other browsers for the installed app icon
        // and to generate the splash screen (with theme/background colors).
        // Place brand-forward assets first, then keep legacy PWA sizes for compatibility.
        icons: [
          { src: "Pure Coloured Icon PNG.png", sizes: "1485x1485", type: "image/png" },
          { src: "Pure Coloured Icon PNG.png", sizes: "1485x1485", type: "image/png", purpose: "any maskable" },
          { src: "Garage University SVG.svg", sizes: "512x512", type: "image/svg+xml" },
          { src: "Garage University Coloured Logo.png", sizes: "2774x1006", type: "image/png" },
          { src: "GarageUniversity White Logo.png", sizes: "2774x1006", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "152x152", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "180x180", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "167x167", type: "image/png" },
          { src: "pwa-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "pwa-512x512.svg", sizes: "512x512", type: "image/svg+xml" }
        ],
        // screenshots: displayed in installation prompts (Chrome) and store listings
        // to showcase app UI in different form factors.
        screenshots: [
          {
            src: "screenshot/desktop-view.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide"
          },
          {
            src: "screenshot/mobile-view.png",
            sizes: "390x844",
            type: "image/png",
            form_factor: "narrow"
          }
        ]
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
