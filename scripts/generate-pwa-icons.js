#!/usr/bin/env node

/**
 * Generate PWA Icons Script
 * This script creates placeholder icons for PWA in all required sizes
 * In production, replace these with actual branded icons
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes required for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple SVG icon as base
const createSvgIcon = (size) => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#0EA5E9"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}px" font-weight="bold" fill="white" text-anchor="middle" dy=".3em">MD</text>
  </svg>`;
};

// Generate icons for each size
iconSizes.forEach(size => {
  const fileName = `icon-${size}x${size}.svg`;
  const filePath = path.join(iconsDir, fileName);
  
  // Skip if already exists as PNG
  const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  if (fs.existsSync(pngPath)) {
    console.log(`✓ Icon ${size}x${size}.png already exists`);
    return;
  }
  
  // Create SVG placeholder
  const svgContent = createSvgIcon(size);
  fs.writeFileSync(filePath, svgContent);
  console.log(`✓ Created ${fileName}`);
});

// Create apple-touch-icon
const appleTouchIcon = createSvgIcon(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleTouchIcon);
console.log('✓ Created apple-touch-icon.svg');

// Create favicon.ico placeholder (as SVG)
const favicon = createSvgIcon(32);
fs.writeFileSync(path.join(__dirname, '../public/favicon.svg'), favicon);
console.log('✓ Created favicon.svg');

console.log('\n📱 PWA icons generated successfully!');
console.log('Note: These are placeholder icons. Replace with actual branded icons for production.');