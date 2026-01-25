import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Webpack config (Iconify-safe)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    return config;
  },

  // Turbopack (leave empty unless customizing)
  turbopack: {},

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
};

export default nextConfig;
