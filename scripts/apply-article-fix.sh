#!/bin/bash

# Script to apply article submission and publishing flow fixes
# Run this to fix article creation issues

echo "======================================"
echo "Applying Article Submission Flow Fixes"
echo "======================================"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Error: .env.local file not found!"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

# Source environment variables
source .env.local

# Check required variables
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "Error: Missing required environment variables!"
    echo "Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local"
    exit 1
fi

echo "✓ Environment variables loaded"

# Create a SQL file that combines all fixes
cat > /tmp/article_fixes.sql << 'EOF'
-- =====================================================
-- FIX ARTICLE SUBMISSION AND PUBLISHING FLOW
-- =====================================================

-- Ensure articles table has all required columns
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_breaking_news BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_comments BOOLEAN DEFAULT true;

-- Update status constraint to include all valid values
ALTER TABLE articles 
DROP CONSTRAINT IF EXISTS articles_status_check;

ALTER TABLE articles 
ADD CONSTRAINT articles_status_check 
CHECK (status IN (
    'draft',
    'submitted',
    'pending_review',
    'in_review',
    'approved',
    'published',
    'archived',
    'needs_revision',
    'rejected',
    'scheduled'
));

-- Create view for backward compatibility
DROP VIEW IF EXISTS news_articles CASCADE;
CREATE VIEW news_articles AS SELECT * FROM articles;

-- Grant permissions
GRANT ALL ON news_articles TO authenticated;
GRANT SELECT ON news_articles TO anon;

-- Update any existing articles with pending_review to submitted
UPDATE articles SET status = 'submitted' WHERE status = 'pending_review';

SELECT 'Article submission flow fixes applied successfully!' as result;
EOF

echo "✓ SQL script prepared"

# Instructions for manual application
echo ""
echo "======================================"
echo "MANUAL STEPS REQUIRED:"
echo "======================================"
echo ""
echo "1. Go to Supabase Dashboard:"
echo "   $VITE_SUPABASE_URL"
echo ""
echo "2. Navigate to SQL Editor"
echo ""
echo "3. Copy and paste the following SQL:"
echo ""
echo "--- BEGIN SQL ---"
cat /tmp/article_fixes.sql
echo "--- END SQL ---"
echo ""
echo "4. Click 'Run' to apply the fixes"
echo ""
echo "======================================"
echo "Alternative: Using Supabase CLI"
echo "======================================"
echo ""
echo "If you have database password, run:"
echo "npx supabase db push --db-url 'postgresql://postgres:[YOUR_PASSWORD]@db.pltutlpmamxozailzffm.supabase.co:5432/postgres'"
echo ""
echo "Or apply the migration file directly:"
echo "psql '$VITE_SUPABASE_URL' < supabase/migrations/20250807_fix_article_submission_flow.sql"
echo ""

# Save the fixes for reference
cp /tmp/article_fixes.sql ./supabase/quick_fixes/article_submission_fix.sql 2>/dev/null || true

echo "✓ Fix script saved to: supabase/quick_fixes/article_submission_fix.sql"
echo ""
echo "After applying the fixes, test article creation:"
echo "1. Go to your app's dashboard"
echo "2. Try creating a new article"
echo "3. Submit it for review"
echo "4. Verify it saves correctly"