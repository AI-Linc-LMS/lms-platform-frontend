// Generates PWA icons and an iOS splash image from a source logo
// Requires: `npm i -D sharp`

import sharp from 'sharp';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = resolve(root, 'public');

const srcLogo = resolve(publicDir, 'kumain_logo.jpg');

const themeColor = '#1A5A7A'; // matches manifest theme_color

/**
 * Create a square icon PNG of given size with the logo centered on a solid background.
 */
async function makeIcon(size, outPath) {
  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: themeColor,
    },
  });

  const logo = await sharp(srcLogo)
    .resize({
      width: Math.floor(size * 0.65),
      height: Math.floor(size * 0.65),
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer();

  await canvas
    .composite([
      { input: logo, gravity: 'center' },
    ])
    .png()
    .toFile(outPath);
}

/**
 * Create an iOS startup splash image with given pixel dimensions.
 */
async function makeSplash(width, height, outPath) {
  const canvas = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: themeColor,
    },
  });

  const logo = await sharp(srcLogo)
    .resize({
      width: Math.floor(Math.min(width, height) * 0.35),
      height: Math.floor(Math.min(width, height) * 0.35),
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer();

  await canvas
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(outPath);
}

async function run() {
  if (!existsSync(srcLogo)) {
    console.error(`Source logo not found: ${srcLogo}`);
    process.exit(1);
  }

  const outIcon192 = resolve(publicDir, 'pwa-192x192.png');
  const outIcon512 = resolve(publicDir, 'pwa-512x512.png');
  const outAppleIcon = resolve(publicDir, 'apple-touch-icon.png'); // 180x180
  // Common iPhone portrait/landscape sizes (CSS dp and pixel ratio)
  const iosSplashSpecs = [
    { dpw: 320, dph: 568, ratio: 2, name: 'iphone-se-1' },        // 640x1136
    { dpw: 375, dph: 667, ratio: 2, name: 'iphone-8' },           // 750x1334
    { dpw: 375, dph: 812, ratio: 3, name: 'iphone-x' },           // 1125x2436
    { dpw: 390, dph: 844, ratio: 3, name: 'iphone-12-14' },       // 1170x2532
    { dpw: 393, dph: 852, ratio: 3, name: 'iphone-15-pro' },      // 1179x2556
    { dpw: 414, dph: 896, ratio: 2, name: 'iphone-11' },          // 828x1792
    { dpw: 414, dph: 896, ratio: 3, name: 'iphone-11-pro-max' },  // 1242x2688
    { dpw: 428, dph: 926, ratio: 3, name: 'iphone-14-15-pro-max'} // 1284x2778
  ];

  try {
    // Ensure public dir exists (it should)
    if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

    console.log('Generating PWA icons from', srcLogo);
    await makeIcon(192, outIcon192);
    console.log('✓ Created', outIcon192);
    await makeIcon(512, outIcon512);
    console.log('✓ Created', outIcon512);
    await makeIcon(180, outAppleIcon);
    console.log('✓ Created', outAppleIcon);

    console.log('Generating iOS splash images (portrait & landscape)');
    for (const spec of iosSplashSpecs) {
      const w = spec.dpw * spec.ratio;
      const h = spec.dph * spec.ratio;
      const portrait = resolve(publicDir, `splash-${w}x${h}.png`);
      const landscape = resolve(publicDir, `splash-${h}x${w}.png`);
      await makeSplash(w, h, portrait);
      console.log('✓ Created', portrait);
      await makeSplash(h, w, landscape);
      console.log('✓ Created', landscape);
    }

    console.log('All assets generated.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
