#!/usr/bin/env node

import fs from "fs";
import path from "path";

// Function to create a simple splash screen SVG
function createSplashScreenSVG(width, height, filename) {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:var(--primary-700);stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2E7D8F;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  
  <!-- Logo container -->
  <g transform="translate(${width / 2 - 120}, ${height / 2 - 60})">
    <text x="120" y="50" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">AiLinc</text>
    <text x="120" y="90" font-family="Arial, sans-serif" font-size="30" fill="white" text-anchor="middle">AI Learning</text>
  </g>
</svg>`;

  const publicDir = path.join(process.cwd(), "public");
  const outputPath = path.join(publicDir, filename.replace(".png", ".svg"));

  fs.writeFileSync(outputPath, svgContent);
  console.log(`✓ Generated splash screen: ${outputPath}`);
}

// Main execution
console.log("🚀 Generating PWA splash screen assets...\n");

// Generate iOS splash screen images
console.log("📱 Generating iOS splash screen images...");

const splashSizes = [
  { width: 1290, height: 2796, filename: "splash-1290x2796.svg" },
  { width: 1179, height: 2556, filename: "splash-1179x2556.svg" },
  { width: 1284, height: 2778, filename: "splash-1284x2778.svg" },
  { width: 1170, height: 2532, filename: "splash-1170x2532.svg" },
  { width: 1125, height: 2436, filename: "splash-1125x2436.svg" },
  { width: 1242, height: 2688, filename: "splash-1242x2688.svg" },
  { width: 828, height: 1792, filename: "splash-828x1792.svg" },
  { width: 750, height: 1334, filename: "splash-750x1334.svg" },
  { width: 640, height: 1136, filename: "splash-640x1136.svg" },
];

splashSizes.forEach(({ width, height, filename }) => {
  createSplashScreenSVG(width, height, filename);
});

console.log("\n✅ PWA splash screen assets generation complete!");
console.log("\n📋 Note: These are SVG files. For PNG conversion, you can:");
console.log("1. Use online SVG to PNG converters");
console.log("2. Use browser dev tools to save as PNG");
console.log("3. Use design tools like Figma or Sketch");
console.log("4. Install ImageMagick and run the original script");
