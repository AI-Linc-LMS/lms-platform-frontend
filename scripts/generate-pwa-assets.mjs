#!/usr/bin/env node

// Generate iOS splash screens (PNG) using sharp.
// No external tools required. Background set to match manifest background.

import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

console.log("Generating iOS splash screens...");

const publicDir = join(process.cwd(), "public");
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

const background = "var(--font-light)";
// Prefer the same icon Android uses for splash (PWA icon)
const logoCandidates = [
  "pwa-512x512.png",
  "pwa-192x192.png",
  "logo.png",
  "kumain_logo.jpg",
];
const logoPath = logoCandidates
  .map((n) => join(publicDir, n))
  .find((p) => existsSync(p));

async function makeSplash(width, height, outPath) {
  const canvas = sharp({ create: { width, height, channels: 4, background } });
  let image = canvas;
  if (logoPath) {
    const size = Math.floor(Math.min(width, height) * 0.35);
    const logo = await sharp(logoPath)
      .resize({
        width: size,
        height: size,
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();
    image = canvas.composite([{ input: logo, gravity: "center" }]);
  }
  await image.png().toFile(outPath);
  console.log("✔", outPath);
}

async function run() {
  // Portrait base sizes (we also produce landscape variants)
  const sizes = [
    { w: 1290, h: 2796 }, // 430x932@3x (14 Pro/15 Plus)
    { w: 1179, h: 2556 }, // 393x852@3x (15 Pro)
    { w: 1284, h: 2778 }, // 428x926@3x (14/15 Pro Max)
    { w: 1170, h: 2532 }, // 390x844@3x (12/13/14/15)
    { w: 1125, h: 2436 }, // 375x812@3x (X/XS/11 Pro)
    { w: 1242, h: 2688 }, // 414x896@3x (11 Pro Max/XS Max)
    { w: 828, h: 1792 }, // 414x896@2x (11/XR)
    { w: 750, h: 1334 }, // 375x667@2x (8/7/6s/6)
    { w: 640, h: 1136 }, // 320x568@2x (SE 1st gen)
  ];

  for (const { w, h } of sizes) {
    await makeSplash(w, h, join(publicDir, `splash-${w}x${h}.png`));
    await makeSplash(h, w, join(publicDir, `splash-${h}x${w}.png`));
  }

  console.log("All splash images generated.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
