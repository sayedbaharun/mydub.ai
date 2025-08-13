-- =====================================================
-- FIX PROFILES TABLE COLUMNS AND DASHBOARD QUERIES
-- =====================================================
-- Add missing columns that the app is trying to query
-- =====================================================

-- Add last_login column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add any other missing columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update the dashboard_content view to handle status queries properly
DROP VIEW IF EXISTS dashboard_content CASCADE;

CREATE VIEW dashboard_content AS
SELECT 
    a.id,
    'article' as type,
    a.title,
    a.title_ar,
    a.summary as excerpt,
    a.summary_ar as excerpt_ar,
    a.status,
    NULL as author_name,
    a.author_id,
    a.editor_id,
    a.view_count as views,
    0 as likes,
    0 as shares,
    jsonb_build_object(
        'category', a.category,
        'tags', a.tags,
        'source_type', a.source_type,
        'source_name', a.source_name,
        'is_featured', a.is_featured,
        'is_breaking', a.is_breaking_news,
        'featured_image', a.featured_image
    ) as metadata,
    a.created_at,
    a.updated_at,
    a.published_at,
    CASE 
        WHEN p.id IS NOT NULL THEN
            jsonb_build_object(
                'id', a.author_id,
                'email', p.email,
                'fullName', p.full_name,
                'avatar', p.avatar_url
            )
        ELSE NULL
    END as author,
    CASE 
        WHEN e.id IS NOT NULL THEN
            jsonb_build_object(
                'id', a.editor_id,
                'email', e.email,
                'fullName', e.full_name,
                'avatar', e.avatar_url
            )
        ELSE NULL
    END as editor
FROM articles a
LEFT JOIN profiles p ON a.author_id = p.id
LEFT JOIN profiles e ON a.editor_id = e.id;

-- Grant permissions
GRANT SELECT ON dashboard_content TO authenticated;
GRANT SELECT ON dashboard_content TO anon;