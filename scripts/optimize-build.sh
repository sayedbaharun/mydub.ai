#!/bin/bash

# Build Optimization Script for MyDub.AI
# This script runs various optimizations on the production build

set -e

echo "🚀 Starting build optimization process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running in production mode
if [ "$NODE_ENV" != "production" ]; then
    echo -e "${YELLOW}⚠️  Setting NODE_ENV to production${NC}"
    export NODE_ENV=production
fi

# Clean previous build
echo -e "${BLUE}🧹 Cleaning previous build...${NC}"
rm -rf dist
rm -rf node_modules/.vite
rm -rf .turbo

# Install dependencies with frozen lockfile
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm ci --prefer-offline --no-audit

# Run type checking
echo -e "${BLUE}📝 Running type check...${NC}"
npm run type-check || {
    echo -e "${RED}❌ Type checking failed${NC}"
    exit 1
}

# Run linting
echo -e "${BLUE}🔍 Running linter...${NC}"
npm run lint || {
    echo -e "${RED}❌ Linting failed${NC}"
    exit 1
}

# Build the application
echo -e "${BLUE}🏗️ Building application...${NC}"
npm run build

# Analyze bundle size
echo -e "${BLUE}📊 Analyzing bundle size...${NC}"
if [ -f "dist/stats.html" ]; then
    echo -e "${GREEN}✅ Bundle analysis available at dist/stats.html${NC}"
fi

# Optimize images
echo -e "${BLUE}🖼️ Optimizing images...${NC}"
if command -v imagemin &> /dev/null; then
    find dist -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | while read -r img; do
        imagemin "$img" > "$img.tmp" && mv "$img.tmp" "$img"
    done
    echo -e "${GREEN}✅ Images optimized${NC}"
else
    echo -e "${YELLOW}⚠️  imagemin not found, skipping image optimization${NC}"
fi

# Generate critical CSS (if applicable)
echo -e "${BLUE}🎨 Extracting critical CSS...${NC}"
# This would require additional tooling like critical or penthouse
# For now, we'll skip this step
echo -e "${YELLOW}⚠️  Critical CSS extraction not configured${NC}"

# Compress HTML files
echo -e "${BLUE}📄 Compressing HTML files...${NC}"
find dist -name "*.html" -exec gzip -9 -k {} \; 2>/dev/null || true
find dist -name "*.html" -exec brotli -9 -k {} \; 2>/dev/null || true

# Generate service worker precache manifest
echo -e "${BLUE}🔧 Updating service worker...${NC}"
# This is handled by vite-plugin-pwa during build

# Check build output
echo -e "${BLUE}📋 Build Summary:${NC}"
echo "========================="

# Calculate build size
TOTAL_SIZE=$(du -sh dist | cut -f1)
echo -e "Total build size: ${GREEN}${TOTAL_SIZE}${NC}"

# Count files
JS_COUNT=$(find dist -name "*.js" | wc -l)
CSS_COUNT=$(find dist -name "*.css" | wc -l)
IMG_COUNT=$(find dist -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" | wc -l)

echo -e "JavaScript files: ${GREEN}${JS_COUNT}${NC}"
echo -e "CSS files: ${GREEN}${CSS_COUNT}${NC}"
echo -e "Image files: ${GREEN}${IMG_COUNT}${NC}"

# Check for large files
echo -e "\n${BLUE}📦 Large files (>500KB):${NC}"
find dist -type f -size +500k -exec ls -lh {} \; | awk '{print $5, $9}'

# Performance checks
echo -e "\n${BLUE}🏃 Performance Checks:${NC}"

# Check if source maps are included
if find dist -name "*.map" | grep -q .; then
    echo -e "${YELLOW}⚠️  Source maps found in build${NC}"
else
    echo -e "${GREEN}✅ No source maps in production build${NC}"
fi

# Check for console.log statements
if grep -r "console.log" dist --include="*.js" 2>/dev/null | grep -q .; then
    echo -e "${YELLOW}⚠️  console.log statements found in build${NC}"
else
    echo -e "${GREEN}✅ No console.log statements in build${NC}"
fi

# Generate build report
echo -e "\n${BLUE}📊 Generating build report...${NC}"
cat > dist/build-report.json << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "totalSize": "${TOTAL_SIZE}",
  "files": {
    "javascript": ${JS_COUNT},
    "css": ${CSS_COUNT},
    "images": ${IMG_COUNT}
  },
  "environment": {
    "node": "$(node -v)",
    "npm": "$(npm -v)"
  }
}
EOF

echo -e "\n${GREEN}✅ Build optimization complete!${NC}"
echo -e "${BLUE}📁 Output directory: dist/${NC}"

# Optional: Run lighthouse CI
if [ "$RUN_LIGHTHOUSE" = "true" ]; then
    echo -e "\n${BLUE}🔦 Running Lighthouse CI...${NC}"
    npm run lighthouse || {
        echo -e "${YELLOW}⚠️  Lighthouse CI failed${NC}"
    }
fi

# Success message
echo -e "\n${GREEN}🎉 Build is ready for deployment!${NC}"

# Exit successfully
exit 0