-- =====================================================
-- FIX ARTICLE STATUS COLUMN TYPE
-- =====================================================
-- The recent migration created an ENUM but articles table uses TEXT
-- This migration converts the status column safely
-- =====================================================

-- First, ensure the ENUM exists with all needed values
DO $$ BEGIN
    -- Drop and recreate to ensure all values are present
    DROP TYPE IF EXISTS article_status CASCADE;
    CREATE TYPE article_status AS ENUM (
        'draft',
        'submitted', 
        'in_review',
        'approved',
        'published',
        'archived',
        'needs_revision',
        'rejected',
        'scheduled',
        'pending_review'  -- Add this for compatibility
    );
EXCEPTION
    WHEN duplicate_object THEN 
        -- If it exists, just add the missing value if needed
        ALTER TYPE article_status ADD VALUE IF NOT EXISTS 'pending_review';
END $$;

-- Update the articles table status column to use TEXT for now
-- (Converting to ENUM requires more complex migration)
-- Ensure all status values are valid
UPDATE articles 
SET status = 'draft' 
WHERE status IS NULL OR status = '';

-- Add constraint to ensure valid status values
ALTER TABLE articles 
DROP CONSTRAINT IF EXISTS articles_status_check;

ALTER TABLE articles 
ADD CONSTRAINT articles_status_check 
CHECK (status IN (
    'draft',
    'submitted', 
    'in_review',
    'approved',
    'published',
    'archived',
    'needs_revision',
    'rejected',
    'scheduled',
    'pending_review'
));

-- Ensure slug column exists and has proper constraints
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

-- Update any null slugs with generated values
UPDATE articles 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || SUBSTRING(id::TEXT, 1, 8)
WHERE slug IS NULL;

-- Make slug unique
ALTER TABLE articles 
DROP CONSTRAINT IF EXISTS articles_slug_unique;

ALTER TABLE articles 
ADD CONSTRAINT articles_slug_unique UNIQUE(slug);

-- Ensure all required columns have proper defaults
ALTER TABLE articles 
ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN updated_at SET DEFAULT NOW(),
ALTER COLUMN view_count SET DEFAULT 0;

-- Create or replace the trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON articles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Ensure RLS is enabled and policies exist
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view published articles" ON articles;
DROP POLICY IF EXISTS "Users can create own articles" ON articles;
DROP POLICY IF EXISTS "Users can update own draft articles" ON articles;
DROP POLICY IF EXISTS "Admins can do everything" ON articles;

-- Create comprehensive RLS policies
CREATE POLICY "Anyone can view published articles" ON articles
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authenticated users can create articles" ON articles
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own draft articles" ON articles
    FOR UPDATE USING (
        auth.uid() = author_id AND 
        status IN ('draft', 'pending_review')
    );

CREATE POLICY "Users can delete own draft articles" ON articles
    FOR DELETE USING (
        auth.uid() = author_id AND 
        status = 'draft'
    );

CREATE POLICY "Admins and editors can manage all articles" ON articles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'editor')
        )
    );

-- Grant necessary permissions
GRANT ALL ON articles TO authenticated;
GRANT SELECT ON articles TO anon;