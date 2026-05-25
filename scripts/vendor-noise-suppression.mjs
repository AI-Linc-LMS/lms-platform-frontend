// Copy RNNoise WASM + AudioWorklet processor from node_modules into /public so they're
// served as plain static assets at /noise-suppression/*. Re-runs on every `npm install`
// via the postinstall hook in package.json. Silent no-op if the package isn't installed
// (e.g. during a partial install in CI before all deps land).
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const pkgRoot = join(
  projectRoot,
  "node_modules",
  "@sapphi-red",
  "web-noise-suppressor",
  "dist",
);
const targetDir = join(projectRoot, "public", "noise-suppression");

const files = [
  ["rnnoise.wasm", "rnnoise.wasm"],
  ["rnnoise_simd.wasm", "rnnoise_simd.wasm"],
  ["rnnoise/workletProcessor.js", "rnnoise-worklet.js"],
];

if (!existsSync(pkgRoot)) {
  console.log(
    "[vendor-noise-suppression] @sapphi-red/web-noise-suppressor not installed; skipping.",
  );
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });

let copied = 0;
for (const [src, dest] of files) {
  const srcPath = join(pkgRoot, src);
  const destPath = join(targetDir, dest);
  if (!existsSync(srcPath)) {
    console.warn(
      `[vendor-noise-suppression] missing source: ${src} (package layout changed?)`,
    );
    continue;
  }
  copyFileSync(srcPath, destPath);
  copied += 1;
}

console.log(
  `[vendor-noise-suppression] copied ${copied} files to ${targetDir.replace(projectRoot, ".")}.`,
);
