import type { NextConfig } from "next";
import path from "node:path";

/**
 * Force browser build: package "node" export pulls jspdf.node.min.js → fflate Worker
 * which Turbopack cannot bundle ("Can't resolve <dynamic>").
 * Use a posix-relative path for turbopack (absolute Windows paths are rejected).
 */
const jspdfEsRelative = "./node_modules/jspdf/dist/jspdf.es.min.js";
const jspdfEsAbsolute = path.join(
  process.cwd(),
  "node_modules/jspdf/dist/jspdf.es.min.js"
);

const nextConfig: NextConfig = {
  /**
   * Static external job JSON (`public/jobs/external-jobs-feed*.json`).
   * When `.enriched.json` is missing, rewrite that URL to the base feed so fetches do not 404.
   * Legacy `/jobs/april11add*.json` URLs rewrite to the new filenames for old bookmarks and CDNs.
   */
  async rewrites() {
    return {
      afterFiles: [
        {
          source: "/jobs/external-jobs-feed.enriched.json",
          destination: "/jobs/external-jobs-feed.json",
        },
        {
          source: "/jobs/april11add.enriched.json",
          destination: "/jobs/external-jobs-feed.enriched.json",
        },
        {
          source: "/jobs/april11add.json",
          destination: "/jobs/external-jobs-feed.json",
        },
      ],
    };
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      jspdf: jspdfEsAbsolute,
    };
    return config;
  },

  turbopack: {
    resolveAlias: {
      jspdf: jspdfEsRelative,
    },
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  output: "standalone",
  
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
  
  reactStrictMode: true,
};

export default nextConfig;
