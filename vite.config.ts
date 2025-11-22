import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import { hash } from "./src/utils/hash-function";

// Plugin to inject environment variables and client data into HTML
function injectEnvPlugin() {
  return {
    name: "inject-env",
    async transformIndexHtml(html: string) {
      const clientId = process.env.VITE_CLIENT_ID || "";
      const apiUrl = (
        process.env.VITE_API_URL || "https://be-app.ailinc.com"
      ).replace(/\/$/, "");

      let clientName = "";
      let clientIcon = "/pwa-512x512.png";

      // Fetch client data at build time if clientId is available
      if (clientId) {
        try {
          const response = await fetch(
            `${apiUrl}/api/clients/${clientId}/client-info/`
          );
          if (response.ok) {
            const clientData = (await response.json()) as {
              is_active?: boolean;
              name?: string;
              app_icon_url?: string;
            };
            if (clientData.is_active && clientData.name) {
              clientName = clientData.name;
              if (clientData.app_icon_url) {
                clientIcon = clientData.app_icon_url;
              }
            }
          }
        } catch (error) {
          // If fetch fails, clientName remains empty - will be populated at runtime
        }
      }

      // Inject client ID and API URL into script tag
      html = html.replace(
        /<script id="app-config" data-client-id="" data-api-url="[^"]*"><\/script>/,
        `<script id="app-config" data-client-id="${clientId}" data-api-url="${apiUrl}"></script>`
      );

      // Only update HTML if we have a client name, otherwise leave empty for runtime population
      if (!clientName) {
        return html;
      }

      // Escape HTML special characters
      const escapeHtml = (str: string) => {
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      };

      const safeClientName = escapeHtml(clientName);
      const safeClientIcon = escapeHtml(clientIcon);

      // Replace default title (handle various whitespace)
      html = html.replace(
        /<title\s+data-branding="title">[^<]*<\/title>/,
        `<title data-branding="title">${safeClientName}</title>`
      );

      // Replace Open Graph title (handle self-closing with or without space)
      html = html.replace(
        /<meta\s+property="og:title"\s+id="og-title"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:title" id="og-title" content="${safeClientName}" />`
      );

      // Replace Open Graph image
      html = html.replace(
        /<meta\s+property="og:image"\s+id="og-image"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:image" id="og-image" content="${safeClientIcon}" />`
      );

      // Replace Twitter title
      html = html.replace(
        /<meta\s+name="twitter:title"\s+id="twitter-title"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:title" id="twitter-title" content="${safeClientName}" />`
      );

      // Replace Twitter image
      html = html.replace(
        /<meta\s+name="twitter:image"\s+id="twitter-image"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:image" id="twitter-image" content="${safeClientIcon}" />`
      );

      // Replace apple-mobile-web-app-title
      html = html.replace(
        /<meta\s+name="apple-mobile-web-app-title"\s+content="[^"]*"\s*\/?>/,
        `<meta name="apple-mobile-web-app-title" content="${safeClientName}" />`
      );

      // Replace favicon
      html = html.replace(
        /<link\s+rel="icon"\s+data-branding="favicon"\s+href="[^"]*"\s*\/?>/,
        `<link rel="icon" data-branding="favicon" href="${safeClientIcon}" />`
      );

      return html;
    },
  };
}

const enablePWA = process.env.VITE_ENABLE_PWA === "true";
const enableBundleAnalyzer = process.env.ANALYZE === "true";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    injectEnvPlugin(),
    ...(enablePWA
      ? [
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
              globPatterns: [
                "**/*.{js,css,html,png,svg,jpg,jpeg,gif,webp,woff2}",
              ],
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
        ]
      : []),
    ...(enableBundleAnalyzer
      ? [
          visualizer({
            filename: "dist/bundle-analysis.html",
            template: "treemap",
            gzipSize: true,
            brotliSize: true,
            open: false,
          }),
        ]
      : []),
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
