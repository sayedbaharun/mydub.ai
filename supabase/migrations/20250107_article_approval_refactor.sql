-- =====================================================
-- ARTICLE APPROVAL SYSTEM REFACTOR
-- =====================================================
-- This migration fixes article approval flow issues:
-- 1. Creates missing tables (content_approvals, approval_workflows, etc.)
-- 2. Adds article_status ENUM for consistency
-- 3. Updates RLS policies for proper approval permissions
-- 4. Creates helper functions for approval workflow
-- =====================================================

-- =====================================================
-- 1. CREATE ARTICLE STATUS ENUM
-- =====================================================

-- Create article status enum for consistency across the app
DO $$ BEGIN
    CREATE TYPE article_status AS ENUM (
        'draft',
        'submitted', 
        'in_review',
        'approved',
        'published',
        'archived',
        'needs_revision',
        'rejected',
        'scheduled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. CREATE MISSING TABLES
-- =====================================================

-- Content approvals table
CREATE TABLE IF NOT EXISTS public.content_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    approval_status TEXT NOT NULL CHECK (approval_status IN ('approved', 'rejected', 'needs_revision', 'pending')),
    comments TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval workflows table  
CREATE TABLE IF NOT EXISTS public.approval_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    content_type TEXT DEFAULT 'article',
    workflow_step INTEGER DEFAULT 1,
    approver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content schedule table
CREATE TABLE IF NOT EXISTS public.content_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    title_ar TEXT,
    summary TEXT,
    summary_ar TEXT, 
    content TEXT,
    content_ar TEXT,
    content_type TEXT DEFAULT 'article',
    category TEXT DEFAULT 'news',
    tags TEXT[],
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'published', 'failed', 'cancelled')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Editorial calendar table
CREATE TABLE IF NOT EXISTS public.editorial_calendar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    event_type TEXT DEFAULT 'deadline' CHECK (event_type IN ('deadline', 'meeting', 'publication', 'review')),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    related_article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. UPDATE ARTICLES TABLE
-- =====================================================

-- First check if articles table exists, if not create it
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    title_ar TEXT,
    title_hi TEXT,
    title_ur TEXT,
    summary_ar TEXT,
    summary_hi TEXT,
    summary_ur TEXT,
    content_ar TEXT,
    content_hi TEXT,
    content_ur TEXT,
    category TEXT DEFAULT 'news',
    status TEXT DEFAULT 'draft',
    source_type TEXT DEFAULT 'manual',
    source_name TEXT,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    editor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    featured_image TEXT,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    slug TEXT UNIQUE,
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    is_breaking_news BOOLEAN DEFAULT false,
    enable_comments BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add column if it doesn't exist
DO $$
BEGIN
    -- Try to add new_status column with ENUM type
    ALTER TABLE articles ADD COLUMN new_status article_status DEFAULT 'draft';
EXCEPTION
    WHEN duplicate_column THEN 
        -- Column already exists, do nothing
        NULL;
END $$;

-- Migrate existing status values to new enum
UPDATE articles SET new_status = 
    CASE 
        WHEN status = 'draft' THEN 'draft'::article_status
        WHEN status = 'published' THEN 'published'::article_status
        WHEN status = 'pending_review' THEN 'in_review'::article_status
        WHEN status = 'submitted' THEN 'submitted'::article_status
        WHEN status = 'approved' THEN 'approved'::article_status
        WHEN status = 'archived' THEN 'archived'::article_status
        WHEN status = 'rejected' THEN 'rejected'::article_status
        WHEN status = 'needs_revision' THEN 'needs_revision'::article_status
        WHEN status = 'scheduled' THEN 'scheduled'::article_status
        ELSE 'draft'::article_status
    END
WHERE new_status IS NULL OR new_status = 'draft';

-- Drop old status column and rename new one
DO $$
BEGIN
    -- Drop old column if it exists
    ALTER TABLE articles DROP COLUMN IF EXISTS status;
    -- Rename new column
    ALTER TABLE articles RENAME COLUMN new_status TO status;
EXCEPTION
    WHEN OTHERS THEN 
        -- If error occurs, likely column doesn't exist or already renamed
        NULL;
END $$;

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================

-- Articles indexes (create if not exists)
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_is_featured ON articles(is_featured) WHERE is_featured = true;

-- Content approvals indexes
CREATE INDEX IF NOT EXISTS idx_content_approvals_article_id ON content_approvals(article_id);
CREATE INDEX IF NOT EXISTS idx_content_approvals_approver_id ON content_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_content_approvals_status ON content_approvals(approval_status);

-- Approval workflows indexes
CREATE INDEX IF NOT EXISTS idx_approval_workflows_content_id ON approval_workflows(content_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_approver_id ON approval_workflows(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_status ON approval_workflows(status);

-- Content schedule indexes
CREATE INDEX IF NOT EXISTS idx_content_schedule_scheduled_at ON content_schedule(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_schedule_status ON content_schedule(status);
CREATE INDEX IF NOT EXISTS idx_content_schedule_author_id ON content_schedule(author_id);

-- Editorial calendar indexes
CREATE INDEX IF NOT EXISTS idx_editorial_calendar_date ON editorial_calendar(date);
CREATE INDEX IF NOT EXISTS idx_editorial_calendar_assigned_to ON editorial_calendar(assigned_to);
CREATE INDEX IF NOT EXISTS idx_editorial_calendar_article_id ON editorial_calendar(related_article_id);

-- =====================================================
-- 5. CREATE HELPER FUNCTIONS
-- =====================================================

-- Slug generation function
CREATE OR REPLACE FUNCTION generate_article_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
        NEW.slug := NEW.slug || '-' || extract(epoch from now())::integer;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Article approval function
CREATE OR REPLACE FUNCTION approve_article(
    _article_id UUID,
    _approver_id UUID,
    _publish_immediately BOOLEAN DEFAULT false,
    _comments TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    _article_exists BOOLEAN;
    _approver_role TEXT;
BEGIN
    -- Check if article exists
    SELECT EXISTS(SELECT 1 FROM articles WHERE id = _article_id) INTO _article_exists;
    IF NOT _article_exists THEN
        RAISE EXCEPTION 'Article not found';
    END IF;

    -- Check approver role
    SELECT role INTO _approver_role FROM profiles WHERE id = _approver_id;
    IF _approver_role NOT IN ('admin', 'editor', 'curator') THEN
        RAISE EXCEPTION 'Insufficient permissions to approve articles';
    END IF;

    -- Update article status
    UPDATE articles 
    SET 
        status = CASE 
            WHEN _publish_immediately THEN 'published'::article_status
            ELSE 'approved'::article_status
        END,
        published_at = CASE 
            WHEN _publish_immediately THEN NOW()
            ELSE published_at
        END,
        updated_at = NOW()
    WHERE id = _article_id;

    -- Insert approval record
    INSERT INTO content_approvals (
        article_id,
        approver_id,
        approval_status,
        comments
    ) VALUES (
        _article_id,
        _approver_id,
        'approved',
        _comments
    );

    -- Update any existing approval workflows
    UPDATE approval_workflows
    SET 
        status = 'approved',
        approved_at = NOW(),
        updated_at = NOW()
    WHERE content_id = _article_id AND status = 'pending';

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Article rejection function
CREATE OR REPLACE FUNCTION reject_article(
    _article_id UUID,
    _approver_id UUID,
    _reason TEXT,
    _comments TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    _article_exists BOOLEAN;
    _approver_role TEXT;
BEGIN
    -- Check if article exists
    SELECT EXISTS(SELECT 1 FROM articles WHERE id = _article_id) INTO _article_exists;
    IF NOT _article_exists THEN
        RAISE EXCEPTION 'Article not found';
    END IF;

    -- Check approver role
    SELECT role INTO _approver_role FROM profiles WHERE id = _approver_id;
    IF _approver_role NOT IN ('admin', 'editor', 'curator') THEN
        RAISE EXCEPTION 'Insufficient permissions to reject articles';
    END IF;

    -- Update article status
    UPDATE articles 
    SET 
        status = 'rejected'::article_status,
        updated_at = NOW()
    WHERE id = _article_id;

    -- Insert approval record
    INSERT INTO content_approvals (
        article_id,
        approver_id,
        approval_status,
        comments
    ) VALUES (
        _article_id,
        _approver_id,
        'rejected',
        COALESCE(_comments, _reason)
    );

    -- Update any existing approval workflows
    UPDATE approval_workflows
    SET 
        status = 'rejected',
        comments = _reason,
        updated_at = NOW()
    WHERE content_id = _article_id AND status = 'pending';

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE TRIGGERS
-- =====================================================

-- Slug generation trigger
DROP TRIGGER IF EXISTS generate_article_slug_trigger ON articles;
CREATE TRIGGER generate_article_slug_trigger
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW
    WHEN (NEW.slug IS NULL OR NEW.slug = '')
    EXECUTE FUNCTION generate_article_slug();

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_approvals_updated_at ON content_approvals;
CREATE TRIGGER update_content_approvals_updated_at
    BEFORE UPDATE ON content_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_approval_workflows_updated_at ON approval_workflows;
CREATE TRIGGER update_approval_workflows_updated_at
    BEFORE UPDATE ON approval_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_schedule_updated_at ON content_schedule;
CREATE TRIGGER update_content_schedule_updated_at
    BEFORE UPDATE ON content_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_editorial_calendar_updated_at ON editorial_calendar;
CREATE TRIGGER update_editorial_calendar_updated_at
    BEFORE UPDATE ON editorial_calendar
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_calendar ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CREATE RLS POLICIES
-- =====================================================

-- Articles policies (drop existing first)
DROP POLICY IF EXISTS "Public can view published articles" ON articles;
DROP POLICY IF EXISTS "Authors can view own articles" ON articles;
DROP POLICY IF EXISTS "Admins can view all articles" ON articles;
DROP POLICY IF EXISTS "Authenticated users can create articles" ON articles;
DROP POLICY IF EXISTS "Authors can update own drafts" ON articles;
DROP POLICY IF EXISTS "Admins can update any article" ON articles;
DROP POLICY IF EXISTS "Editors can approve articles" ON articles;
DROP POLICY IF EXISTS "Authors can delete own drafts" ON articles;
DROP POLICY IF EXISTS "Admins can delete any article" ON articles;

-- Public can view published articles
CREATE POLICY "Public can view published articles" ON articles
    FOR SELECT USING (status = 'published');

-- Authors can view their own articles
CREATE POLICY "Authors can view own articles" ON articles
    FOR SELECT USING (auth.uid() = author_id);

-- Staff can view all articles
CREATE POLICY "Staff can view all articles" ON articles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role IN ('admin', 'editor', 'curator')
        )
    );

-- Authenticated users can create articles
CREATE POLICY "Authenticated users can create articles" ON articles
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Authors can update their own draft/submitted articles
CREATE POLICY "Authors can update own articles" ON articles
    FOR UPDATE USING (
        auth.uid() = author_id 
        AND status IN ('draft', 'submitted', 'needs_revision')
    )
    WITH CHECK (auth.uid() = author_id);

-- Staff can update any article
CREATE POLICY "Staff can update any article" ON articles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role IN ('admin', 'editor', 'curator')
        )
    );

-- Authors can delete their own draft articles
CREATE POLICY "Authors can delete own drafts" ON articles
    FOR DELETE USING (
        auth.uid() = author_id 
        AND status = 'draft'
    );

-- Admins can delete any article
CREATE POLICY "Admins can delete any article" ON articles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Content approvals policies
CREATE POLICY "Users can view approvals for their articles" ON content_approvals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM articles 
            WHERE id = content_approvals.article_id 
            AND author_id = auth.uid()
        )
    );

CREATE POLICY "Staff can view all approvals" ON content_approvals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role IN ('admin', 'editor', 'curator')
        )
    );

CREATE POLICY "Staff can create approvals" ON content_approvals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role IN ('admin', 'editor', 'curator')
        )
    );

-- Approval workflows policies
CREATE POLICY "Staff can manage workflows" ON approval_workflows
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role IN ('admin', 'editor', 'curator')
        )
    );

-- Content schedule policies  
CREATE POLICY "Staff can manage content schedule" ON content_schedule
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role IN ('admin', 'editor', 'curator')
        )
    );

-- Editorial calendar policies
CREATE POLICY "Staff can view editorial calendar" ON editorial_calendar
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role IN ('admin', 'editor', 'curator')
        )
    );

CREATE POLICY "Staff can manage editorial calendar" ON editorial_calendar
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role IN ('admin', 'editor', 'curator')
        )
    );

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on all tables
GRANT ALL ON articles TO authenticated;
GRANT SELECT ON articles TO anon;

GRANT ALL ON content_approvals TO authenticated;
GRANT ALL ON approval_workflows TO authenticated;
GRANT ALL ON content_schedule TO authenticated;
GRANT ALL ON editorial_calendar TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION approve_article(UUID, UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_article(UUID, UUID, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 10. CREATE DASHBOARD VIEW
-- =====================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS dashboard_content;

-- Create dashboard view
CREATE VIEW dashboard_content AS
SELECT 
    id,
    title,
    summary,
    content,
    category,
    status::text as status,
    author_id,
    published_at,
    created_at,
    updated_at,
    view_count as views,
    is_featured as featured,
    featured_image as image_url,
    CASE 
        WHEN status = 'published' THEN 'published'
        WHEN status = 'in_review' THEN 'pending'
        ELSE status::text
    END as display_status
FROM articles;

-- Grant permissions on view
GRANT SELECT ON dashboard_content TO authenticated;
GRANT SELECT ON dashboard_content TO anon;

-- =====================================================
-- 11. UPDATE PROFILES ROLE CHECK
-- =====================================================

-- Update profiles table to support new roles
DO $$
BEGIN
    -- Try to update the role constraint
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('user', 'admin', 'editor', 'curator'));
EXCEPTION
    WHEN OTHERS THEN 
        -- If error occurs, constraint might already exist or table doesn't exist
        NULL;
END $$;

-- =====================================================
-- 12. INSERT SAMPLE DATA (if needed)
-- =====================================================

-- Insert sample article only if no articles exist
INSERT INTO articles (
    title,
    summary,
    content,
    category,
    status,
    source_type,
    published_at,
    is_featured
) 
SELECT
    'Welcome to MyDub.AI',
    'Your comprehensive guide to Dubai, powered by artificial intelligence.',
    '<p>Welcome to MyDub.AI, the ultimate platform for discovering everything Dubai has to offer. From the latest news and events to dining recommendations and government services, we have got you covered.</p><p>Our AI-powered platform brings you curated content from across the web, ensuring you never miss out on what is happening in this vibrant city.</p>',
    'news',
    'published'::article_status,
    'manual',
    NOW(),
    true
WHERE NOT EXISTS (SELECT 1 FROM articles LIMIT 1);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================