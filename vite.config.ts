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
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "AiLinc - AI Learning Platform",
        short_name: "AiLinc",
        description: "AI-powered learning and assessment platform",
        theme_color: "#1A5A7A",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        id: "/",
        icons: [
          {
            src: "pwa-192x192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "pwa-512x512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "pwa-192x192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "maskable"
          },
          {
            src: "pwa-512x512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable"
          }
        ],
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
        globPatterns: ["**/*.{js,css,html,ico,svg}"],
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
