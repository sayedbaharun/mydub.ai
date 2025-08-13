-- Create missing core tables referenced in RLS policies
-- This migration creates tables that may not exist yet but are referenced in the comprehensive RLS migration

-- 1. Chat Messages Table (for chatbot interactions)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    message TEXT NOT NULL,
    response TEXT,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    model TEXT,
    tokens_used INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- 2. Saved Content Table (for user bookmarks/favorites)
CREATE TABLE IF NOT EXISTS public.saved_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('news', 'government_service', 'tourism', 'practical_info', 'event')),
    content_id UUID NOT NULL,
    title TEXT NOT NULL,
    url TEXT,
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_content_user_id ON public.saved_content(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_content_type ON public.saved_content(content_type);
CREATE INDEX IF NOT EXISTS idx_saved_content_created_at ON public.saved_content(created_at DESC);

-- 3. Search History Table (for analytics and personalization)
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    clicked_results JSONB DEFAULT '[]',
    search_type TEXT CHECK (search_type IN ('general', 'news', 'services', 'tourism', 'all')),
    language TEXT DEFAULT 'en',
    session_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON public.search_history(query);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);

-- 4. Page Views Table (for analytics)
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id UUID,
    page_path TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    country TEXT,
    city TEXT,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    browser TEXT,
    os TEXT,
    duration_seconds INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON public.page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON public.page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views(session_id);

-- 5. User Role Audit Table (for tracking role changes)
CREATE TABLE IF NOT EXISTS public.user_role_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    old_role TEXT,
    new_role TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_role_audit_user_id ON public.user_role_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_audit_changed_at ON public.user_role_audit(changed_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_audit ENABLE ROW LEVEL SECURITY;

-- Grant basic permissions (RLS policies will be applied separately)
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.saved_content TO authenticated;
GRANT ALL ON public.search_history TO authenticated;
GRANT INSERT ON public.page_views TO authenticated;
GRANT INSERT ON public.page_views TO anon;
GRANT SELECT ON public.user_role_audit TO authenticated;

-- Add missing columns to existing tables if they don't exist
-- Add subscription_tier to user_profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'subscription_tier'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN subscription_tier TEXT DEFAULT 'free' 
        CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise'));
        
        CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier 
        ON public.user_profiles(subscription_tier);
    END IF;
END $$;

-- Add created_by and updated_by columns to content tables if they don't exist
DO $$
DECLARE
    content_table TEXT;
    content_tables TEXT[] := ARRAY[
        'news_articles', 
        'government_services', 
        'tourism_attractions', 
        'tourism_events',
        'practical_information'
    ];
BEGIN
    FOREACH content_table IN ARRAY content_tables
    LOOP
        -- Check if table exists
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = content_table
        ) THEN
            -- Add created_by if doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = content_table 
                AND column_name = 'created_by'
            ) THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN created_by UUID REFERENCES auth.users(id)', content_table);
            END IF;
            
            -- Add updated_by if doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = content_table 
                AND column_name = 'updated_by'
            ) THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN updated_by UUID REFERENCES auth.users(id)', content_table);
            END IF;
        END IF;
    END LOOP;
END $$;

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers for new tables
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON public.chat_messages;
DROP TRIGGER IF EXISTS update_saved_content_updated_at ON public.saved_content;

-- Note: These tables don't have updated_at columns by design, but we'll add the function for consistency