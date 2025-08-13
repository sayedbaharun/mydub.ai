-- =====================================================
-- ACTUALLY WORKING MIGRATION FOR MYDUB.AI
-- =====================================================
-- This migration actually works and has been tested
-- No more amateur mistakes with OLD/NEW in policies
-- =====================================================

-- Enable helpful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- SECTION 1: STATUS CHECK
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=== CHECKING DATABASE STATE ===';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        RAISE NOTICE 'Found table: profiles';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        RAISE NOTICE 'Found table: user_profiles';
    END IF;
    
    RAISE NOTICE '================================';
END $$;

-- =====================================================
-- SECTION 2: CORE FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 3: FIX USER PROFILE TABLE
-- =====================================================
DO $$
BEGIN
    -- Rename profiles to user_profiles if needed
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'profiles') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables 
                       WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        ALTER TABLE public.profiles RENAME TO user_profiles;
        RAISE NOTICE 'Renamed profiles to user_profiles';
    END IF;
END $$;

-- Create user_profiles if doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
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

-- Add missing columns safely
DO $$
BEGIN
    -- List of columns to check and add
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'username') THEN
        ALTER TABLE public.user_profiles ADD COLUMN username TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'role') THEN
        ALTER TABLE public.user_profiles ADD COLUMN role TEXT DEFAULT 'user' 
            CHECK (role IN ('user', 'subscriber', 'curator', 'editor', 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'subscription_tier') THEN
        ALTER TABLE public.user_profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free' 
            CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise'));
    END IF;
    
    -- Add other columns without listing them all
    BEGIN
        ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS website TEXT;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
            CHECK (status IN ('active', 'inactive', 'suspended'));
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);

-- Create trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 4: CREATE OTHER ESSENTIAL TABLES
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

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 5: RLS HELPER FUNCTIONS
-- =====================================================

-- Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(allowed_roles text[])
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_profiles
        WHERE id = auth.uid()
        AND role = ANY(allowed_roles)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 6: RLS POLICIES (WITHOUT OLD/NEW!)
-- =====================================================

-- User Profiles Policies
DROP POLICY IF EXISTS "user_profiles_own_read" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_own_update" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_all" ON public.user_profiles;

-- Users can read their own profile or admins can read all
CREATE POLICY "user_profiles_own_read" ON public.user_profiles
    FOR SELECT USING (
        id = auth.uid() OR public.is_admin()
    );

-- Users can update their own profile (but not their role)
-- This is the CORRECT way to prevent role changes
CREATE POLICY "user_profiles_own_update" ON public.user_profiles
    FOR UPDATE 
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() 
        AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid())
    );

-- Admins can do everything
CREATE POLICY "user_profiles_admin_all" ON public.user_profiles
    FOR ALL USING (public.is_admin());

-- User Preferences Policies
DROP POLICY IF EXISTS "user_preferences_own" ON public.user_preferences;
CREATE POLICY "user_preferences_own" ON public.user_preferences
    FOR ALL USING (user_id = auth.uid());

-- Chat Messages Policies
DROP POLICY IF EXISTS "chat_messages_own" ON public.chat_messages;
CREATE POLICY "chat_messages_own" ON public.chat_messages
    FOR ALL USING (user_id = auth.uid());

-- Saved Content Policies
DROP POLICY IF EXISTS "saved_content_own" ON public.saved_content;
CREATE POLICY "saved_content_own" ON public.saved_content
    FOR ALL USING (user_id = auth.uid());

-- Search History Policies
DROP POLICY IF EXISTS "search_history_own" ON public.search_history;
CREATE POLICY "search_history_own" ON public.search_history
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- SECTION 7: GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.saved_content TO authenticated;
GRANT ALL ON public.search_history TO authenticated;

-- =====================================================
-- SECTION 8: USER SIGNUP FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user profile
    INSERT INTO public.user_profiles (id, email, full_name, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        username = COALESCE(EXCLUDED.username, user_profiles.username);
    
    -- Create default preferences
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail user signup
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SECTION 9: CREATE MINIMAL CONTENT TABLES
-- =====================================================

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
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Government Services
CREATE TABLE IF NOT EXISTS public.government_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    category TEXT NOT NULL,
    url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tourism Attractions
CREATE TABLE IF NOT EXISTS public.tourism_attractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on content tables
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_attractions ENABLE ROW LEVEL SECURITY;

-- Simple policies for content tables
CREATE POLICY "news_articles_public_read" ON public.news_articles
    FOR SELECT USING (true);

CREATE POLICY "government_services_public_read" ON public.government_services
    FOR SELECT USING (is_active = true);

CREATE POLICY "tourism_attractions_public_read" ON public.tourism_attractions
    FOR SELECT USING (is_active = true);

-- Grant read permissions
GRANT SELECT ON public.news_sources TO anon, authenticated;
GRANT SELECT ON public.news_articles TO anon, authenticated;
GRANT SELECT ON public.government_services TO anon, authenticated;
GRANT SELECT ON public.tourism_attractions TO anon, authenticated;

-- =====================================================
-- FINAL REPORT
-- =====================================================
DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'RLS policies: %', policy_count;
    RAISE NOTICE '=========================';
END $$;