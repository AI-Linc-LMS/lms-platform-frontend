#!/usr/bin/env node

// Generate iOS splash screens (PNG) with custom text using sharp.

import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

console.log("Generating iOS splash screens...");

const publicDir = join(process.cwd(), "public");
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

const background = "#ffffff"; // Splash background color
const splashText = "Loading..."; // <<< change this to your custom text
const fontSizeFactor = 0.1; // Relative font size to height

// Create SVG with centered text
function makeTextSVG(width, height) {
  const fontSize = Math.floor(height * fontSizeFactor);
  const svg = `
    <svg width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="${background}"/>
      <text x="50%" y="50%" font-size="24px" font-family="Arial, sans-serif"
            fill="#6084d5" text-anchor="middle" dominant-baseline="middle">
        ${splashText}
      </text>
    </svg>
  `;
  return Buffer.from(svg);
}

async function makeSplash(width, height, outPath) {
  const svg = makeTextSVG(width, height);
  await sharp(svg).png().toFile(outPath);
  console.log("✔", outPath);
}

async function run() {
  // Portrait base sizes (also produce landscape variants)
  const sizes = [
    { w: 1290, h: 2796 }, // 14 Pro/15 Plus
    { w: 1179, h: 2556 }, // 15 Pro
    { w: 1284, h: 2778 }, // 14/15 Pro Max
    { w: 1170, h: 2532 }, // 12/13/14/15
    { w: 1125, h: 2436 }, // X/XS/11 Pro
    { w: 1242, h: 2688 }, // 11 Pro Max/XS Max
    { w: 828, h: 1792 }, // 11/XR
    { w: 750, h: 1334 }, // 8/7/6s/6
    { w: 640, h: 1136 }, // SE 1st gen
  ];

  for (const { w, h } of sizes) {
    await makeSplash(w, h, join(publicDir, `splash-${w}x${h}.png`));
    await makeSplash(h, w, join(publicDir, `splash-${h}x${w}.png`));
  }

  console.log("All splash images generated with text.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
