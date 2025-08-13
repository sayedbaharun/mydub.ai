#!/bin/bash

# Script to remove hardcoded credentials from codebase
echo "🔍 Searching for hardcoded credentials..."

# Files to check
FILES_TO_CHECK=(
  "scripts/setup-supabase-production.ts"
  "scripts/setup-supabase.sh"
  ".env"
  ".env.example"
  ".env.local"
  ".env.production"
)

# Patterns to search for
PATTERNS=(
  "MyDub@Admin2025!"
  "admin@mydub.ai"
  "ADMIN_PASSWORD"
  "ADMIN_EMAIL"
)

echo ""
echo "📋 Files containing credentials:"
echo "================================"

for file in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$file" ]; then
    for pattern in "${PATTERNS[@]}"; do
      if grep -q "$pattern" "$file" 2>/dev/null; then
        echo "⚠️  $file contains: $pattern"
        
        # Show the line
        grep -n "$pattern" "$file" | head -5
        echo ""
      fi
    done
  fi
done

echo ""
echo "🔧 Recommended Actions:"
echo "======================="
echo "1. Update scripts/setup-supabase-production.ts:"
echo "   - Remove hardcoded ADMIN_EMAIL and ADMIN_PASSWORD"
echo "   - Use environment variables instead"
echo ""
echo "2. Create .env.example without sensitive data:"
echo "   ADMIN_EMAIL=your-admin-email@example.com"
echo "   ADMIN_PASSWORD=<generate-secure-password>"
echo ""
echo "3. Add to .gitignore:"
echo "   .env"
echo "   .env.local"
echo "   .env.production"
echo ""
echo "4. Run: git rm --cached .env (if already committed)"
echo ""

# Create safe example file
cat > .env.example.safe << EOF
# ================================
# SUPABASE CONFIGURATION (Required)
# ================================
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ================================
# ADMIN SETUP (Change these!)
# ================================
# Generate secure passwords and store them safely
# NEVER commit real credentials to git
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=generate-secure-password-here

# ================================
# API KEYS
# ================================
VITE_OPENROUTER_API_KEY=your-api-key
VITE_OPENAI_API_KEY=your-api-key
VITE_NEWS_API_KEY=your-api-key
SENDGRID_API_KEY=your-api-key
EOF

echo "✅ Created .env.example.safe with template"
echo ""
echo "⚠️  IMPORTANT: After updating credentials:"
echo "   1. Change admin password in Supabase"
echo "   2. Update local .env file"
echo "   3. Never commit real credentials"
echo "   4. Use password manager for storage"