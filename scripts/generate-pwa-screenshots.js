#!/usr/bin/env node

/**
 * Generate PWA Screenshot Placeholders
 * Creates placeholder screenshots for PWA manifest
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.join(__dirname, '../public/screenshots');

// Create SVG placeholders for screenshots
const createScreenshotSvg = (width, height, label) => {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#f0f9ff"/>
    <rect width="${width}" height="60" fill="#0EA5E9"/>
    <text x="20" y="40" font-family="Arial, sans-serif" font-size="24px" font-weight="bold" fill="white">MyDub.AI</text>
    <text x="${width/2}" y="${height/2}" font-family="Arial, sans-serif" font-size="18px" fill="#64748b" text-anchor="middle">${label}</text>
    <rect x="20" y="80" width="${width-40}" height="200" fill="#e0f2fe" rx="8"/>
    <rect x="20" y="300" width="${(width-60)/2}" height="150" fill="#e0f2fe" rx="8"/>
    <rect x="${width/2+10}" y="300" width="${(width-60)/2}" height="150" fill="#e0f2fe" rx="8"/>
  </svg>`;
};

// Generate desktop screenshot
const desktopSvg = createScreenshotSvg(1920, 1080, 'Desktop Screenshot - 1920x1080');
fs.writeFileSync(path.join(screenshotsDir, 'homepage-desktop.svg'), desktopSvg);
console.log('✓ Created homepage-desktop.svg');

// Generate mobile screenshot
const mobileSvg = createScreenshotSvg(390, 844, 'Mobile Screenshot - 390x844');
fs.writeFileSync(path.join(screenshotsDir, 'homepage-mobile.svg'), mobileSvg);
console.log('✓ Created homepage-mobile.svg');

console.log('\n📸 PWA screenshots generated successfully!');
console.log('Note: These are placeholder screenshots. Replace with actual screenshots for production.');