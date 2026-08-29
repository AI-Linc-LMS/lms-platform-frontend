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
 * Build-time gate: page rendering must stay static.
 *
 * One `await headers()` in the root layout once marked every route in the app
 * dynamically-rendered. That single line made every document AND every RSC
 * navigation response `private,no-cache,no-store`, which bypassed Netlify's
 * edge/durable caches and sent every click on every tenant through a
 * cold-prone us-east Lambda: 1.2s warm, 9-11s cold TTFB from India. It went
 * unnoticed for months because nothing failed — the site was just slow.
 *
 * So, like the proctoring gate above, this BLOCKS THE BUILD: `next/headers`
 * (headers/cookies/draftMode) must not be imported anywhere page rendering can
 * reach. Route handlers under app/api/ run per-request anyway and are exempt.
 * If a future feature genuinely needs request data at render time, add the
 * file to the allowlist below in the same PR that explains why the route can
 * no longer be served from the CDN.
 */
function assertNoRequestTimeRenderingCreep(): void {
  const root = process.cwd();
  const allowlist = new Set<string>([]); // repo-relative paths, forward slashes
  const offenders: string[] = [];
  const scanDirs = ["app", "components", "lib", "hooks"];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).split(path.sep).join("/");
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || rel.startsWith("app/api/")) continue;
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry.name) || /\.(test|spec)\.tsx?$/.test(entry.name)) continue;
      if (allowlist.has(rel)) continue;
      const src = fs.readFileSync(full, "utf8");
      if (/from\s+["']next\/headers["']/.test(src)) offenders.push(rel);
    }
  };
  for (const d of scanDirs) {
    if (fs.existsSync(path.join(root, d))) walk(path.join(root, d));
  }
  if (offenders.length > 0) {
    throw new Error(
      `[static-rendering-gate] next/headers imported outside app/api/: ${offenders.join(", ")}. ` +
        "This forces every route dynamic and puts a us-east Lambda round trip back on every click " +
        "fleet-wide. Move the logic to the client, the proxy (edge), or an app/api route — or " +
        "allowlist the file here with a justification.",
    );
  }
}

assertNoRequestTimeRenderingCreep();

/**
 * Fail a production build immediately when the per-site tenant env is missing.
 *
 * Four tenant sites (careerbridge-solutions, edxcell, garage-university, osmania-university) had
 * no NEXT_PUBLIC_CLIENT_ID or NEXT_PUBLIC_API_BASE_URL set in Netlify. Their bundles kept a
 * runtime `process.env` lookup where every other site inlines a literal, so `config.clientId`
 * threw on render. While the root layout awaited headers() nothing was prerendered, so the throw
 * only happened at request time and the sites simply served 500s for a month with green builds.
 * Once the static-shells work made 91/91 pages prerender, the same throw moved into `next build`
 * and the deploys started failing -- correctly, but from deep inside a page render, where the
 * message is easy to read as a rendering bug rather than a missing environment variable.
 *
 * This says it on the first line instead. It cannot run in CI (the test workflow never builds)
 * and it does not fire in dev, so the only builds it can stop are ones that would have shipped a
 * broken bundle anyway.
 */
function assertTenantEnvPresent(): void {
  if (process.env.NODE_ENV !== "production") return;
  const missing = ["NEXT_PUBLIC_CLIENT_ID", "NEXT_PUBLIC_API_BASE_URL"].filter(
    (k) => !process.env[k],
  );
  if (missing.length > 0) {
    throw new Error(
      `[tenant-env-gate] missing ${missing.join(", ")}. This is per-SITE configuration, not a ` +
        "repo change: set it in Netlify under Site settings -> Environment variables, scoped to " +
        "all deploy contexts, then redeploy. Copy the full set from a working site rather than " +
        "typing it. Without these the bundle keeps a runtime process.env lookup, config.clientId " +
        "throws, and every page of the site returns 500.",
    );
  }
}

assertTenantEnvPresent();

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
  
  // Documents are per-tenant-constant shells (ISR, revalidate 120s). The
  // Netlify Durable Cache honors this header (precedence over Cache-Control):
  // `durable` shares entries across edge nodes and — critically — serves the
  // STALE copy instantly while revalidating in the background for up to a
  // week. Without it, a low-traffic tenant whose cache entry expired handed
  // its first visitor a ~10s cold-function render; with it, that visitor gets
  // the stale shell in ~0.3s and the refresh happens off their critical path.
  // Assets and API routes are excluded (assets are already immutable).
  async headers() {
    return [
      {
        source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Netlify-CDN-Cache-Control",
            value:
              "public, durable, s-maxage=300, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
  
  reactStrictMode: true,
};

export default nextConfig;
