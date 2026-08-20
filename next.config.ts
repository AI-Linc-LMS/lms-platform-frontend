import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

/**
 * Build-time gate: the proctored device check must be able to load its face model.
 *
 * WHY THIS LIVES HERE, of all places. The failure it guards against cost ~38% of every support
 * ticket this platform has ever received: the device check told students "No face detected" while
 * their cameras worked, because the model weights were fetched from a third-party CDN at exam time
 * and, later, because they were served from a path the auth proxy 307s to /login (tfjs then fails
 * on a JSON parse and silently falls back to that same CDN). Both failures were invisible in
 * production. The only detector was students filing tickets, 91% of which went unread for an
 * average of 105 days.
 *
 * So this has to BLOCK A DEPLOY, and module scope in next.config.ts is the only place in this repo
 * that can. netlify.toml runs `yarn next build`, which bypasses the `build` script in package.json
 * entirely, so a prebuild hook there protects nothing. The unit suite cannot do it either: both
 * .github/workflows/test.yml and vitest.config.mts state, deliberately, that they must never block
 * a merge or a deploy.
 *
 * Text-based rather than importing the modules it checks: next.config.ts is evaluated before
 * webpack, so the "@/" alias does not resolve here. Every extraction below throws when its pattern
 * stops matching, so a refactor that outruns this gate fails the build rather than silently
 * disabling it.
 */
function assertProctoringModelShippable(): void {
  const root = process.cwd();
  const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");
  const die = (msg: string): never => {
    throw new Error(`[proctoring-asset-gate] ${msg}`);
  };

  const prefixes = [
    ...read("lib/public-asset-prefixes.ts").matchAll(/"(\/[^"]+\/)"/g),
  ].map((m) => m[1]);
  if (prefixes.length === 0) die("could not read PUBLIC_ASSET_PREFIXES");

  const loaderSrc = read("lib/services/face-model-loader.ts");

  // The weights must come from us, not from tfhub.dev.
  if (!/blazeface\.load\(\s*\{\s*modelUrl/.test(loaderSrc)) {
    die(
      "blazeface.load() is not being passed a modelUrl, so the weights would be fetched from " +
        "tfhub.dev at exam time (a 3-hop redirect through hosts we do not control).",
    );
  }

  const urlMatch = loaderSrc.match(/LOCAL_MODEL_URL\s*=\s*"([^"]+)"/);
  if (!urlMatch) die("could not find LOCAL_MODEL_URL in lib/services/face-model-loader.ts");
  const localUrl = urlMatch![1];

  // ...and from a path the auth proxy actually lets through.
  if (!prefixes.some((p) => localUrl.startsWith(p))) {
    die(
      `LOCAL_MODEL_URL "${localUrl}" is not under an auth-bypass prefix ` +
        `(${prefixes.join(", ")}). It would 307 to /login, tfjs would fail on a JSON parse, and ` +
        "the device check would silently fall back to the CDN. See proxy.ts.",
    );
  }

  // ...and the bytes have to actually be here, and be whole.
  const modelRel = path.join("public", localUrl.replace(/^\//, ""));
  if (!fs.existsSync(path.join(root, modelRel))) die(`${modelRel} is missing`);
  const manifest = JSON.parse(read(modelRel));

  // Derived, not hand-pinned. A SHA-256 table would fail on a LEGITIMATE model bump, and the
  // cheapest way out of that failure is to regenerate the constant — which turns the guard into a
  // tautology that always passes. This invariant survives a legitimate bump and only breaks when
  // the weights are genuinely truncated or mismatched.
  const DTYPE_BYTES: Record<string, number> = {
    float32: 4, int32: 4, bool: 1, uint8: 1, float16: 2, complex64: 8,
  };
  let declared = 0;
  const shards = new Set<string>();
  for (const group of manifest.weightsManifest ?? []) {
    for (const p of group.paths ?? []) shards.add(p);
    for (const w of group.weights ?? []) {
      const elements = (w.shape ?? []).reduce((a: number, b: number) => a * b, 1);
      declared += elements * (DTYPE_BYTES[w.dtype] ?? 4);
    }
  }
  if (shards.size === 0) die("model.json declares no weight shards");

  let onDisk = 0;
  for (const shard of shards) {
    const shardPath = path.join(root, path.dirname(modelRel), shard);
    if (!fs.existsSync(shardPath)) die(`weight shard "${shard}" is declared but missing`);
    onDisk += fs.statSync(shardPath).size;
  }
  if (declared !== onDisk) {
    die(`weights are truncated: manifest declares ${declared} bytes, shards total ${onDisk}`);
  }
}

assertProctoringModelShippable();

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
    // Reuse the client Router Cache for visited routes so back/again navigation
    // is instant instead of refetching the route on every visit.
    //
    // These can be LONG because 140/142 pages are "use client" shells: the RSC
    // payload a navigation fetches contains no user data — freshness comes from
    // the pages' own client-side API calls. At 30s every prefetch expired
    // before it was used and every post-idle click re-paid a full RSC round
    // trip (the single biggest "every click feels slow" mechanism).
    staleTimes: {
      dynamic: 300,
      static: 1800,
    },
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
  
  reactStrictMode: true,
};

export default nextConfig;
