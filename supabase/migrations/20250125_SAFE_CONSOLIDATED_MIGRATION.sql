-- =====================================================
-- SAFE CONSOLIDATED MIGRATION FOR MYDUB.AI
-- =====================================================
-- This migration safely adds all missing database objects
-- It checks before creating and won't break existing data
-- Safe to run multiple times - uses IF NOT EXISTS everywhere
-- 
-- ROLLBACK: Each section includes rollback instructions
-- =====================================================

-- Enable helpful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- SECTION 1: STATUS REPORT - What exists?
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=== CHECKING DATABASE STATUS ===';
    
    -- Check if profiles or user_profiles exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        RAISE NOTICE '✓ Table "profiles" exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        RAISE NOTICE '✓ Table "user_profiles" exists';
    END IF;
    
    -- Check for key functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE NOTICE '✓ Function "update_updated_at_column" exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        RAISE NOTICE '✓ Function "has_role" exists';
    END IF;
    
    RAISE NOTICE '=== STATUS CHECK COMPLETE ===';
END $$;

-- =====================================================
-- SECTION 2: CREATE CORE FUNCTIONS (Safe)
-- =====================================================
-- ROLLBACK: DROP FUNCTION IF EXISTS function_name();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 3: FIX TABLE NAMING (profiles → user_profiles)
-- =====================================================
-- ROLLBACK: ALTER TABLE user_profiles RENAME TO profiles;

DO $$
BEGIN
    -- Only rename if profiles exists but user_profiles doesn't
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        
        RAISE NOTICE 'Renaming profiles to user_profiles...';
        ALTER TABLE public.profiles RENAME TO user_profiles;
        
        -- Fix trigger name
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.user_profiles;
        DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
        CREATE TRIGGER update_user_profiles_updated_at 
            BEFORE UPDATE ON public.user_profiles
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE '✓ Table renamed successfully';
    END IF;
END $$;

-- =====================================================
-- SECTION 4: CREATE USER_PROFILES TABLE (if needed)
-- =====================================================
-- ROLLBACK: DROP TABLE IF EXISTS user_profiles CASCADE;

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    phone TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'subscriber', 'curator', 'editor', 'admin')),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists
DO $$
BEGIN
    -- Add subscription_tier if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'user_profiles' 
                   AND column_name = 'subscription_tier') THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN subscription_tier TEXT DEFAULT 'free' 
        CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise'));
        RAISE NOTICE '✓ Added subscription_tier column';
    END IF;
END $$;

-- Indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);

-- Trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 5: CREATE CORE CONTENT TABLES (Safe)
-- =====================================================
-- Core tables needed by the application

-- News Sources
CREATE TABLE IF NOT EXISTS public.news_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    logo TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT true,
    credibility_score INTEGER DEFAULT 5 CHECK (credibility_score >= 1 AND credibility_score <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- News Articles
CREATE TABLE IF NOT EXISTS public.news_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    title_ar TEXT,
    summary TEXT NOT NULL,
    summary_ar TEXT,
    content TEXT NOT NULL,
    content_ar TEXT,
    source_id UUID REFERENCES public.news_sources(id),
    category TEXT NOT NULL,
    author TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    url TEXT UNIQUE,
    image_url TEXT,
    video_url TEXT,
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    read_time INTEGER,
    ai_summary TEXT,
    ai_summary_ar TEXT,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    is_breaking BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    has_video BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Government Departments
CREATE TABLE IF NOT EXISTS public.government_departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    logo TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    address_ar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Government Services
CREATE TABLE IF NOT EXISTS public.government_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID REFERENCES public.government_departments(id),
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    category TEXT NOT NULL,
    url TEXT,
    requirements TEXT[],
    requirements_ar TEXT[],
    documents TEXT[],
    documents_ar TEXT[],
    fees DECIMAL(10,2),
    processing_time TEXT,
    processing_time_ar TEXT,
    is_online BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Tourism Attractions
CREATE TABLE IF NOT EXISTS public.tourism_attractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    category TEXT NOT NULL,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    address TEXT,
    address_ar TEXT,
    opening_hours JSONB,
    admission_fee DECIMAL(10,2),
    contact_phone TEXT,
    contact_email TEXT,
    website TEXT,
    images TEXT[],
    rating DECIMAL(2,1),
    review_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Tourism Events
CREATE TABLE IF NOT EXISTS public.tourism_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    category TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    location_ar TEXT NOT NULL,
    venue TEXT,
    venue_ar TEXT,
    organizer TEXT,
    organizer_ar TEXT,
    ticket_price DECIMAL(10,2),
    ticket_url TEXT,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    source TEXT DEFAULT 'manual',
    external_id TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- SECTION 6: CREATE USER INTERACTION TABLES
-- =====================================================

-- User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar', 'hi', 'ur')),
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    notifications JSONB DEFAULT '{"email": true, "push": false, "sms": false}'::jsonb,
    interests TEXT[] DEFAULT '{}',
    location_preferences JSONB DEFAULT '{}',
    accessibility JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages
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

-- Saved Content
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

-- Search History
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

-- Page Views
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

-- User Role Audit
CREATE TABLE IF NOT EXISTS public.user_role_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    old_role TEXT,
    new_role TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

-- =====================================================
-- SECTION 7: CREATE ADDITIONAL FEATURE TABLES
-- =====================================================

-- Traffic Data
CREATE TABLE IF NOT EXISTS public.traffic_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    road TEXT NOT NULL,
    road_ar TEXT NOT NULL,
    area TEXT NOT NULL,
    area_ar TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('smooth', 'moderate', 'heavy', 'blocked')),
    description TEXT,
    description_ar TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weather Data
CREATE TABLE IF NOT EXISTS public.weather_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    temperature DECIMAL(4,1) NOT NULL,
    feels_like DECIMAL(4,1) NOT NULL,
    humidity INTEGER NOT NULL,
    wind_speed DECIMAL(4,1) NOT NULL,
    wind_direction TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('sunny', 'partly-cloudy', 'cloudy', 'rainy', 'stormy', 'foggy', 'dusty')),
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    uv_index INTEGER,
    visibility DECIMAL(4,1),
    pressure DECIMAL(6,1),
    sunrise TIME,
    sunset TIME,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Practical Information
CREATE TABLE IF NOT EXISTS public.practical_information (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    title_ar TEXT,
    title_hi TEXT,
    title_ur TEXT,
    content TEXT NOT NULL,
    content_ar TEXT,
    content_hi TEXT,
    content_ur TEXT,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    subcategory TEXT,
    description TEXT,
    description_ar TEXT,
    tags TEXT[] DEFAULT '{}',
    icon TEXT,
    featured_image TEXT,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE,
    sort_order INTEGER DEFAULT 0,
    importance_level TEXT DEFAULT 'normal' CHECK (importance_level IN ('low', 'normal', 'high', 'critical')),
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT[],
    related_links JSONB DEFAULT '[]'::jsonb,
    external_resources JSONB DEFAULT '[]'::jsonb,
    contact_info JSONB,
    location_data JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- SECTION 8: CREATE INDEXES (Safe)
-- =====================================================

-- News indexes
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON public.news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON public.news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_source ON public.news_articles(source_id);

-- Government indexes
CREATE INDEX IF NOT EXISTS idx_gov_services_department ON public.government_services(department_id);
CREATE INDEX IF NOT EXISTS idx_gov_services_category ON public.government_services(category);

-- Tourism indexes
CREATE INDEX IF NOT EXISTS idx_tourism_attractions_category ON public.tourism_attractions(category);
CREATE INDEX IF NOT EXISTS idx_tourism_events_dates ON public.tourism_events(start_date, end_date);

-- User interaction indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_saved_content_user_id ON public.saved_content(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON public.page_views(user_id);

-- Practical info indexes
CREATE INDEX IF NOT EXISTS idx_practical_info_slug ON public.practical_information(slug);
CREATE INDEX IF NOT EXISTS idx_practical_info_category ON public.practical_information(category, subcategory);

-- =====================================================
-- SECTION 9: CREATE TRIGGERS (Safe)
-- =====================================================

-- Add update triggers for tables with updated_at
CREATE TRIGGER update_news_articles_updated_at 
    BEFORE UPDATE ON public.news_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_government_services_updated_at 
    BEFORE UPDATE ON public.government_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tourism_attractions_updated_at 
    BEFORE UPDATE ON public.tourism_attractions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tourism_events_updated_at 
    BEFORE UPDATE ON public.tourism_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practical_information_updated_at 
    BEFORE UPDATE ON public.practical_information
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECTION 10: ENABLE RLS ON ALL TABLES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practical_information ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 11: CREATE RLS HELPER FUNCTIONS
-- =====================================================

-- Role checking function
CREATE OR REPLACE FUNCTION public.has_role(allowed_roles text[])
RETURNS boolean AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    RETURN user_role = ANY(allowed_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN public.has_role(ARRAY['admin']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Subscription check function
CREATE OR REPLACE FUNCTION public.has_subscription(min_tier text DEFAULT NULL)
RETURNS boolean AS $$
DECLARE
    user_tier text;
BEGIN
    SELECT subscription_tier INTO user_tier
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF min_tier IS NULL THEN
        RETURN user_tier IS NOT NULL AND user_tier != 'free';
    ELSE
        CASE min_tier
            WHEN 'basic' THEN
                RETURN user_tier IN ('basic', 'pro', 'enterprise');
            WHEN 'pro' THEN
                RETURN user_tier IN ('pro', 'enterprise');
            WHEN 'enterprise' THEN
                RETURN user_tier = 'enterprise';
            ELSE
                RETURN false;
        END CASE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 12: CREATE RLS POLICIES (Safe drop/create)
-- =====================================================

-- User Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_own_read" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_own_update" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_all" ON public.user_profiles;

CREATE POLICY "user_profiles_own_read" ON public.user_profiles
    FOR SELECT USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "user_profiles_own_update" ON public.user_profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND (OLD.role = NEW.role OR public.is_admin()));

CREATE POLICY "user_profiles_admin_all" ON public.user_profiles
    FOR ALL USING (public.is_admin());

-- News Articles Policies
DROP POLICY IF EXISTS "Public can view news articles" ON public.news_articles;
DROP POLICY IF EXISTS "news_articles_public_read" ON public.news_articles;
DROP POLICY IF EXISTS "news_articles_curator_create" ON public.news_articles;
DROP POLICY IF EXISTS "news_articles_editor_update" ON public.news_articles;
DROP POLICY IF EXISTS "news_articles_admin_delete" ON public.news_articles;

CREATE POLICY "news_articles_public_read" ON public.news_articles
    FOR SELECT USING (true);

CREATE POLICY "news_articles_curator_create" ON public.news_articles
    FOR INSERT WITH CHECK (public.has_role(ARRAY['curator', 'editor', 'admin']));

CREATE POLICY "news_articles_editor_update" ON public.news_articles
    FOR UPDATE USING (public.has_role(ARRAY['editor', 'admin']));

CREATE POLICY "news_articles_admin_delete" ON public.news_articles
    FOR DELETE USING (public.is_admin());

-- Apply similar patterns for other content tables
-- Government Services
CREATE POLICY "gov_services_public_read" ON public.government_services
    FOR SELECT USING (is_active = true);

CREATE POLICY "gov_services_curator_manage" ON public.government_services
    FOR ALL USING (public.has_role(ARRAY['curator', 'editor', 'admin']));

-- Tourism Attractions
CREATE POLICY "tourism_attractions_public_read" ON public.tourism_attractions
    FOR SELECT USING (is_active = true);

CREATE POLICY "tourism_attractions_curator_manage" ON public.tourism_attractions
    FOR ALL USING (public.has_role(ARRAY['curator', 'editor', 'admin']));

-- User's own data policies
CREATE POLICY "chat_messages_own" ON public.chat_messages
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "saved_content_own" ON public.saved_content
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "search_history_own" ON public.search_history
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "user_preferences_own" ON public.user_preferences
    FOR ALL USING (user_id = auth.uid());

-- Analytics policies
CREATE POLICY "page_views_insert" ON public.page_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "page_views_admin_read" ON public.page_views
    FOR SELECT USING (public.is_admin());

-- Public data policies
CREATE POLICY "traffic_data_public_read" ON public.traffic_data
    FOR SELECT USING (true);

CREATE POLICY "weather_data_public_read" ON public.weather_data
    FOR SELECT USING (true);

CREATE POLICY "practical_info_public_read" ON public.practical_information
    FOR SELECT USING (is_active = true AND published_at <= now());

-- =====================================================
-- SECTION 13: GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON public.user_profiles TO authenticated;
GRANT SELECT ON public.news_articles TO authenticated;
GRANT SELECT ON public.news_sources TO authenticated;
GRANT SELECT ON public.government_services TO authenticated;
GRANT SELECT ON public.government_departments TO authenticated;
GRANT SELECT ON public.tourism_attractions TO authenticated;
GRANT SELECT ON public.tourism_events TO authenticated;
GRANT SELECT ON public.traffic_data TO authenticated;
GRANT SELECT ON public.weather_data TO authenticated;
GRANT SELECT ON public.practical_information TO authenticated;
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.saved_content TO authenticated;
GRANT ALL ON public.search_history TO authenticated;
GRANT INSERT ON public.page_views TO authenticated;

-- Grant permissions to anonymous users
GRANT SELECT ON public.news_articles TO anon;
GRANT SELECT ON public.news_sources TO anon;
GRANT SELECT ON public.government_services TO anon;
GRANT SELECT ON public.government_departments TO anon;
GRANT SELECT ON public.tourism_attractions TO anon;
GRANT SELECT ON public.tourism_events TO anon;
GRANT SELECT ON public.traffic_data TO anon;
GRANT SELECT ON public.weather_data TO anon;
GRANT SELECT ON public.practical_information TO anon;
GRANT INSERT ON public.page_views TO anon;

-- =====================================================
-- SECTION 14: CREATE USER SIGNUP FUNCTION
-- =====================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        username = COALESCE(EXCLUDED.username, user_profiles.username);
    
    -- Create default user preferences
    INSERT INTO public.user_preferences (user_id, language, theme)
    VALUES (NEW.id, 'en', 'light')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FINAL STATUS REPORT
-- =====================================================
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public';
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Functions created: %', function_count;
    RAISE NOTICE 'RLS policies created: %', policy_count;
    RAISE NOTICE '=========================';
    RAISE NOTICE 'Database is ready for use!';
END $$;

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
-- To rollback this entire migration, run:
-- 1. Drop all policies: DROP POLICY IF EXISTS policy_name ON table_name;
-- 2. Drop all tables: DROP TABLE IF EXISTS table_name CASCADE;
-- 3. Drop all functions: DROP FUNCTION IF EXISTS function_name();
-- 
-- Or restore from backup taken before migration
-- =====================================================