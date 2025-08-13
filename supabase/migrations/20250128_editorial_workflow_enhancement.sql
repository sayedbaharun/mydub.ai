-- =====================================================
-- EDITORIAL WORKFLOW ENHANCEMENT MIGRATION
-- =====================================================
-- Adds editorial workflow capabilities to support
-- professional newsroom operations for MyDub.ai
-- 
-- This migration enhances existing tables and adds
-- new editorial workflow tables without breaking
-- existing functionality.
-- =====================================================

-- Enable helpful extensions (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SECTION 1: ENHANCE USER ROLES FOR NEWSROOM
-- =====================================================

-- Add new editorial roles to existing user_profiles table
DO $$
BEGIN
    -- Check if the role column constraint needs updating
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%user_profiles_role_check%'
        AND check_clause LIKE '%user%'
        AND check_clause NOT LIKE '%journalist%'
    ) THEN
        -- Drop the old constraint
        ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
        
        -- Add updated constraint with editorial roles
        ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check 
        CHECK (role IN ('reader', 'subscriber', 'journalist', 'editor', 'admin', 'publisher', 'curator'));
        
        RAISE NOTICE '✓ User roles updated to include editorial roles';
    END IF;
END $$;

-- Add editorial-specific profile fields
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS specialization TEXT, -- journalist specialization (politics, business, etc.)
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS editor_level TEXT CHECK (editor_level IN ('junior', 'senior', 'chief', 'managing')),
ADD COLUMN IF NOT EXISTS byline_name TEXT, -- public name for articles
ADD COLUMN IF NOT EXISTS bio_short TEXT; -- short bio for author pages

-- =====================================================
-- SECTION 2: ENHANCE NEWS ARTICLES FOR EDITORIAL WORKFLOW
-- =====================================================

-- Add editorial workflow fields to existing news_articles table
ALTER TABLE public.news_articles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' 
    CHECK (status IN ('draft', 'assigned', 'in_progress', 'submitted', 'in_review', 'approved', 'published', 'archived')),
ADD COLUMN IF NOT EXISTS assignment_id UUID, -- will reference story_assignments table
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS editor_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS publisher_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS breaking_news BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS word_count INTEGER,
ADD COLUMN IF NOT EXISTS editorial_notes TEXT,
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS social_media_text TEXT;

-- Create index for editorial workflow queries
CREATE INDEX IF NOT EXISTS idx_news_articles_status ON public.news_articles(status);
CREATE INDEX IF NOT EXISTS idx_news_articles_author ON public.news_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_editor ON public.news_articles(editor_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_scheduled ON public.news_articles(scheduled_for);

-- =====================================================
-- SECTION 3: STORY ASSIGNMENT SYSTEM
-- =====================================================

-- Priority levels enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
        CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
        RAISE NOTICE '✓ Created priority_level enum';
    END IF;
END $$;

-- Story assignments table
CREATE TABLE IF NOT EXISTS public.story_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    brief TEXT, -- editorial brief/angle for the story
    deadline TIMESTAMPTZ,
    priority priority_level DEFAULT 'medium',
    category TEXT NOT NULL,
    assigned_to UUID NOT NULL REFERENCES auth.users(id),
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    estimated_word_count INTEGER,
    source_leads TEXT[], -- initial sources/contacts
    research_notes TEXT,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Add foreign key constraint for assignment_id in news_articles
ALTER TABLE public.news_articles 
ADD CONSTRAINT fk_assignment_id 
FOREIGN KEY (assignment_id) REFERENCES public.story_assignments(id);

-- Indexes for story assignments
CREATE INDEX IF NOT EXISTS idx_story_assignments_assigned_to ON public.story_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_story_assignments_assigned_by ON public.story_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_story_assignments_deadline ON public.story_assignments(deadline);
CREATE INDEX IF NOT EXISTS idx_story_assignments_status ON public.story_assignments(status);

-- =====================================================
-- SECTION 4: EDITORIAL CALENDAR
-- =====================================================

CREATE TABLE IF NOT EXISTS public.editorial_calendar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT CHECK (event_type IN ('story_deadline', 'publication_date', 'meeting', 'event_coverage', 'embargo_lift')),
    priority priority_level DEFAULT 'medium',
    assigned_to UUID REFERENCES auth.users(id),
    related_assignment_id UUID REFERENCES public.story_assignments(id),
    related_article_id UUID REFERENCES public.news_articles(id),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT, -- daily, weekly, monthly, etc.
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for editorial calendar
CREATE INDEX IF NOT EXISTS idx_editorial_calendar_date ON public.editorial_calendar(date);
CREATE INDEX IF NOT EXISTS idx_editorial_calendar_assigned_to ON public.editorial_calendar(assigned_to);
CREATE INDEX IF NOT EXISTS idx_editorial_calendar_type ON public.editorial_calendar(event_type);

-- =====================================================
-- SECTION 5: ARTICLE VERSION HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS public.article_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    change_summary TEXT, -- summary of what changed
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, version_number)
);

-- Index for version history
CREATE INDEX IF NOT EXISTS idx_article_versions_article_id ON public.article_versions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_versions_created_at ON public.article_versions(created_at DESC);

-- =====================================================
-- SECTION 6: BREAKING NEWS SYSTEM
-- =====================================================

-- Breaking news alerts table
CREATE TABLE IF NOT EXISTS public.breaking_news_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    alert_level TEXT DEFAULT 'medium' CHECK (alert_level IN ('low', 'medium', 'high', 'critical')),
    article_id UUID REFERENCES public.news_articles(id),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    recipient_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0
);

-- Index for breaking news alerts
CREATE INDEX IF NOT EXISTS idx_breaking_news_active ON public.breaking_news_alerts(is_active, sent_at DESC);

-- =====================================================
-- SECTION 7: CONTENT APPROVAL WORKFLOW
-- =====================================================

CREATE TABLE IF NOT EXISTS public.content_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES public.news_articles(id),
    reviewer_id UUID NOT NULL REFERENCES auth.users(id),
    approval_status TEXT NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    approval_level TEXT CHECK (approval_level IN ('editor', 'senior_editor', 'managing_editor', 'publisher'))
);

-- Index for content approvals
CREATE INDEX IF NOT EXISTS idx_content_approvals_article ON public.content_approvals(article_id);
CREATE INDEX IF NOT EXISTS idx_content_approvals_status ON public.content_approvals(approval_status);

-- =====================================================
-- SECTION 8: EDITORIAL METRICS & ANALYTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.editorial_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES public.news_articles(id),
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    time_on_page INTEGER DEFAULT 0, -- in seconds
    social_shares INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2),
    conversion_rate DECIMAL(5,2), -- newsletter signups, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, metric_date)
);

-- Index for editorial metrics
CREATE INDEX IF NOT EXISTS idx_editorial_metrics_date ON public.editorial_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_editorial_metrics_article ON public.editorial_metrics(article_id);

-- =====================================================
-- SECTION 9: UPDATE TRIGGERS
-- =====================================================

-- Create updated_at triggers for new tables
CREATE TRIGGER update_story_assignments_updated_at 
    BEFORE UPDATE ON public.story_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_editorial_calendar_updated_at 
    BEFORE UPDATE ON public.editorial_calendar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECTION 10: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.story_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaking_news_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_metrics ENABLE ROW LEVEL SECURITY;

-- Story assignments policies
CREATE POLICY "Journalists can view their assignments" ON public.story_assignments
    FOR SELECT TO authenticated
    USING (assigned_to = auth.uid());

CREATE POLICY "Editors can view all assignments" ON public.story_assignments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('editor', 'admin', 'publisher')
        )
    );

CREATE POLICY "Editors can create assignments" ON public.story_assignments
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('editor', 'admin', 'publisher')
        )
    );

CREATE POLICY "Editors can update assignments" ON public.story_assignments
    FOR UPDATE TO authenticated
    USING (
        assigned_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('editor', 'admin', 'publisher')
        )
    );

-- Editorial calendar policies
CREATE POLICY "Users can view relevant calendar entries" ON public.editorial_calendar
    FOR SELECT TO authenticated
    USING (
        assigned_to = auth.uid() OR
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('editor', 'admin', 'publisher')
        )
    );

-- Article versions policies (editors and above can view all versions)
CREATE POLICY "Editors can view article versions" ON public.article_versions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('journalist', 'editor', 'admin', 'publisher')
        )
    );

-- Breaking news policies (editors and above)
CREATE POLICY "Editors can manage breaking news" ON public.breaking_news_alerts
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('editor', 'admin', 'publisher')
        )
    );

-- Content approval policies
CREATE POLICY "Editors can manage approvals" ON public.content_approvals
    FOR ALL TO authenticated
    USING (
        reviewer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('editor', 'admin', 'publisher')
        )
    );

-- Editorial metrics policies (read-only for most, full access for editors)
CREATE POLICY "Users can view article metrics" ON public.editorial_metrics
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('journalist', 'editor', 'admin', 'publisher')
        )
    );

-- =====================================================
-- SECTION 11: HELPFUL VIEWS
-- =====================================================

-- View for editorial dashboard
CREATE OR REPLACE VIEW public.editorial_dashboard_view AS
SELECT 
    a.id,
    a.title,
    a.status,
    a.author_id,
    author.full_name as author_name,
    a.editor_id,
    editor.full_name as editor_name,
    a.created_at,
    a.updated_at,
    a.scheduled_for,
    a.breaking_news,
    a.featured,
    a.word_count,
    sa.title as assignment_title,
    sa.deadline as assignment_deadline,
    sa.priority as assignment_priority
FROM public.news_articles a
LEFT JOIN public.user_profiles author ON a.author_id = author.id
LEFT JOIN public.user_profiles editor ON a.editor_id = editor.id
LEFT JOIN public.story_assignments sa ON a.assignment_id = sa.id
ORDER BY a.updated_at DESC;

-- View for journalist workload
CREATE OR REPLACE VIEW public.journalist_workload_view AS
SELECT 
    up.id as journalist_id,
    up.full_name as journalist_name,
    COUNT(sa.id) as active_assignments,
    COUNT(a.id) as articles_in_progress,
    AVG(EXTRACT(EPOCH FROM (sa.deadline - NOW()))/86400) as avg_days_to_deadline
FROM public.user_profiles up
LEFT JOIN public.story_assignments sa ON up.id = sa.assigned_to AND sa.status IN ('assigned', 'in_progress')
LEFT JOIN public.news_articles a ON up.id = a.author_id AND a.status IN ('draft', 'in_progress', 'submitted')
WHERE up.role = 'journalist'
GROUP BY up.id, up.full_name;

-- =====================================================
-- SECTION 12: HELPFUL FUNCTIONS
-- =====================================================

-- Function to create article version when content changes
CREATE OR REPLACE FUNCTION create_article_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create version if content actually changed
    IF OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title THEN
        INSERT INTO public.article_versions (
            article_id, 
            version_number, 
            title, 
            content, 
            summary,
            change_summary,
            changed_by
        )
        SELECT 
            NEW.id,
            COALESCE(MAX(version_number), 0) + 1,
            OLD.title,
            OLD.content,
            OLD.summary,
            'Content updated',
            NEW.updated_by
        FROM public.article_versions 
        WHERE article_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for article versioning
DROP TRIGGER IF EXISTS create_article_version_trigger ON public.news_articles;
CREATE TRIGGER create_article_version_trigger
    BEFORE UPDATE ON public.news_articles
    FOR EACH ROW
    EXECUTE FUNCTION create_article_version();

-- Function to auto-assign editor based on category
CREATE OR REPLACE FUNCTION auto_assign_editor()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-assign editor if not already assigned and status is submitted
    IF NEW.status = 'submitted' AND NEW.editor_id IS NULL THEN
        SELECT id INTO NEW.editor_id
        FROM public.user_profiles
        WHERE role IN ('editor', 'admin')
        AND (specialization = NEW.category OR specialization IS NULL)
        ORDER BY RANDOM()
        LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto editor assignment
DROP TRIGGER IF EXISTS auto_assign_editor_trigger ON public.news_articles;
CREATE TRIGGER auto_assign_editor_trigger
    BEFORE UPDATE ON public.news_articles
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_editor();

-- =====================================================
-- COMPLETION NOTICE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ EDITORIAL WORKFLOW ENHANCEMENT COMPLETE';
    RAISE NOTICE '📝 Added editorial roles: journalist, editor, publisher';
    RAISE NOTICE '📋 Created story assignment system';
    RAISE NOTICE '📅 Added editorial calendar';
    RAISE NOTICE '📰 Enhanced article workflow with status tracking';
    RAISE NOTICE '🚨 Added breaking news alert system';
    RAISE NOTICE '✅ Created approval workflow';
    RAISE NOTICE '📊 Added editorial metrics tracking';
    RAISE NOTICE '🔒 Configured appropriate RLS policies';
    RAISE NOTICE '👀 Created helpful views for editorial dashboard';
    RAISE NOTICE '⚡ Added automatic versioning and editor assignment';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update frontend components to use new schema';
    RAISE NOTICE '2. Create editorial dashboard UI';
    RAISE NOTICE '3. Implement real-time notifications';
    RAISE NOTICE '4. Add user role management interface';
END $$;