#!/usr/bin/env node

// Create a 512x512 app icon from the current 192x192 icon using sharp.
// This keeps the logo consistent across Android/iOS and improves splash quality.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const publicDir = process.cwd() + '/public';
const src = join(publicDir, 'pwa-192x192.png');
const dest = join(publicDir, 'pwa-512x512.png');

async function run() {
  if (!existsSync(src)) {
    console.error('Source icon not found:', src);
    process.exit(1);
  }
  await sharp(src)
    .resize(512, 512, { fit: 'contain', background: '#ffffff' })
    .png()
    .toFile(dest);
  console.log('✔ Generated', dest);
}

run().catch((e) => { console.error(e); process.exit(1); });

