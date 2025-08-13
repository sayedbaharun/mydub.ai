#!/bin/bash

# Deployment Verification Script for MyDub.ai

echo "🚀 MyDub.ai Deployment Verification"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if production URL is provided
PROD_URL=${1:-"https://mydub.ai"}

echo "Checking deployment at: $PROD_URL"
echo ""

# 1. Check if site is accessible
echo "1. Checking site accessibility..."
if curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" | grep -q "200"; then
    echo -e "${GREEN}✓ Site is accessible${NC}"
else
    echo -e "${RED}✗ Site is not accessible${NC}"
    exit 1
fi

# 2. Check for exposed API keys in JavaScript
echo ""
echo "2. Checking for exposed API keys..."
TEMP_FILE=$(mktemp)
curl -s "$PROD_URL" > "$TEMP_FILE"

# Check for common API key patterns
if grep -E "(sk-[a-zA-Z0-9]{48}|api[_-]?key.*[:=].*['\"][a-zA-Z0-9]{20,}|bearer.*[a-zA-Z0-9]{20,})" "$TEMP_FILE" > /dev/null; then
    echo -e "${RED}✗ WARNING: Potential API keys found in source${NC}"
else
    echo -e "${GREEN}✓ No obvious API keys in page source${NC}"
fi

# 3. Check security headers
echo ""
echo "3. Checking security headers..."
HEADERS=$(curl -s -I "$PROD_URL")

check_header() {
    if echo "$HEADERS" | grep -i "$1" > /dev/null; then
        echo -e "${GREEN}✓ $1 header present${NC}"
    else
        echo -e "${YELLOW}⚠ $1 header missing${NC}"
    fi
}

check_header "X-Content-Type-Options"
check_header "X-Frame-Options"
check_header "X-XSS-Protection"
check_header "Strict-Transport-Security"

# 4. Check API endpoints
echo ""
echo "4. Checking API proxy endpoints..."

# Test Supabase connection
if curl -s "$PROD_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API endpoints accessible${NC}"
else
    echo -e "${YELLOW}⚠ API health check not configured${NC}"
fi

# 5. Performance check
echo ""
echo "5. Quick performance check..."
TIME=$(curl -o /dev/null -s -w '%{time_total}' "$PROD_URL")
if (( $(echo "$TIME < 3" | bc -l) )); then
    echo -e "${GREEN}✓ Page loads in ${TIME}s${NC}"
else
    echo -e "${YELLOW}⚠ Page loads in ${TIME}s (consider optimization)${NC}"
fi

# Cleanup
rm -f "$TEMP_FILE"

echo ""
echo "=================================="
echo "Deployment verification complete!"
echo ""
echo "Next steps:"
echo "1. Test authentication flow manually"
echo "2. Verify AI chat functionality"
echo "3. Check Supabase data access"
echo "4. Monitor error logs in Vercel dashboard"