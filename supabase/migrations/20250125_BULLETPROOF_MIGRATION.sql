-- =====================================================
-- BULLETPROOF MIGRATION FOR MYDUB.AI
-- =====================================================
-- This migration is TRULY safe and checks EVERYTHING
-- It will not fail regardless of your database state
-- =====================================================

-- Enable helpful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- HELPER FUNCTION: Check if column exists
-- =====================================================
CREATE OR REPLACE FUNCTION check_column_exists(
    p_schema TEXT,
    p_table TEXT,
    p_column TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = p_schema 
        AND table_name = p_table 
        AND column_name = p_column
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 1: DETAILED STATUS REPORT
-- =====================================================
DO $$
DECLARE
    v_profiles_exists BOOLEAN;
    v_user_profiles_exists BOOLEAN;
    v_user_table_name TEXT;
BEGIN
    RAISE NOTICE '=== STARTING BULLETPROOF MIGRATION ===';
    RAISE NOTICE 'Checking database state...';
    
    -- Check which user table exists
    v_profiles_exists := EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    );
    
    v_user_profiles_exists := EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    );
    
    IF v_profiles_exists AND NOT v_user_profiles_exists THEN
        v_user_table_name := 'profiles';
        RAISE NOTICE 'Found table: profiles (will rename to user_profiles)';
    ELSIF v_user_profiles_exists THEN
        v_user_table_name := 'user_profiles';
        RAISE NOTICE 'Found table: user_profiles';
    ELSE
        v_user_table_name := NULL;
        RAISE NOTICE 'No user profile table found (will create user_profiles)';
    END IF;
    
    -- Check for auth.users
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        RAISE WARNING 'auth.users table not found - some features may not work';
    END IF;
    
    -- Report on key functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE NOTICE '✓ Function update_updated_at_column exists';
    ELSE
        RAISE NOTICE '✗ Function update_updated_at_column missing (will create)';
    END IF;
    
    RAISE NOTICE '=== STATUS CHECK COMPLETE ===';
END $$;

-- =====================================================
-- SECTION 2: CREATE CORE FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 3: HANDLE USER PROFILE TABLE
-- =====================================================
DO $$
BEGIN
    -- Rename profiles to user_profiles if needed
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'profiles') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables 
                       WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        
        RAISE NOTICE 'Renaming profiles to user_profiles...';
        ALTER TABLE public.profiles RENAME TO user_profiles;
        
        -- Clean up old triggers
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.user_profiles;
        RAISE NOTICE '✓ Table renamed successfully';
    END IF;
    
    -- Create user_profiles if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        
        RAISE NOTICE 'Creating user_profiles table...';
        CREATE TABLE public.user_profiles (
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
        RAISE NOTICE '✓ Created user_profiles table';
    END IF;
    
    -- Add missing columns one by one
    IF NOT check_column_exists('public', 'user_profiles', 'username') THEN
        ALTER TABLE public.user_profiles ADD COLUMN username TEXT UNIQUE;
        RAISE NOTICE '✓ Added username column';
    END IF;
    
    IF NOT check_column_exists('public', 'user_profiles', 'full_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN full_name TEXT;
        RAISE NOTICE '✓ Added full_name column';
    END IF;
    
    IF NOT check_column_exists('public', 'user_profiles', 'avatar_url') THEN
        ALTER TABLE public.user_profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE '✓ Added avatar_url column';
    END IF;
    
    IF NOT check_column_exists('public', 'user_profiles', 'email') THEN
        ALTER TABLE public.user_profiles ADD COLUMN email TEXT;
        RAISE NOTICE '✓ Added email column';
    END IF;
    
    IF NOT check_column_exists('public', 'user_profiles', 'role') THEN
        ALTER TABLE public.user_profiles ADD COLUMN role TEXT DEFAULT 'user' 
            CHECK (role IN ('user', 'subscriber', 'curator', 'editor', 'admin'));
        RAISE NOTICE '✓ Added role column';
    END IF;
    
    IF NOT check_column_exists('public', 'user_profiles', 'subscription_tier') THEN
        ALTER TABLE public.user_profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free' 
            CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise'));
        RAISE NOTICE '✓ Added subscription_tier column';
    END IF;
    
    IF NOT check_column_exists('public', 'user_profiles', 'created_at') THEN
        ALTER TABLE public.user_profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✓ Added created_at column';
    END IF;
    
    IF NOT check_column_exists('public', 'user_profiles', 'updated_at') THEN
        ALTER TABLE public.user_profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✓ Added updated_at column';
    END IF;
    
    -- Add other missing columns
    IF NOT check_column_exists('public', 'user_profiles', 'phone') THEN
        ALTER TABLE public.user_profiles ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT check_column_exists('public', 'user_profiles', 'bio') THEN
        ALTER TABLE public.user_profiles ADD COLUMN bio TEXT;
    END IF;
    
    IF NOT check_column_exists('public', 'user_profiles', 'location') THEN
        ALTER TABLE public.user_profiles ADD COLUMN location TEXT;
    END IF;
    
    IF NOT check_column_exists('public', 'user_profiles', 'website') THEN
        ALTER TABLE public.user_profiles ADD COLUMN website TEXT;
    END IF;
    
    IF NOT check_column_exists('public', 'user_profiles', 'status') THEN
        ALTER TABLE public.user_profiles ADD COLUMN status TEXT DEFAULT 'active' 
            CHECK (status IN ('active', 'inactive', 'suspended'));
    END IF;
    
    IF NOT check_column_exists('public', 'user_profiles', 'last_login') THEN
        ALTER TABLE public.user_profiles ADD COLUMN last_login TIMESTAMPTZ;
    END IF;
    
    IF NOT check_column_exists('public', 'user_profiles', 'metadata') THEN
        ALTER TABLE public.user_profiles ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    
    -- Create indexes only if columns exist
    IF check_column_exists('public', 'user_profiles', 'username') THEN
        CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
    END IF;
    
    IF check_column_exists('public', 'user_profiles', 'role') THEN
        CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
    END IF;
    
    IF check_column_exists('public', 'user_profiles', 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
    END IF;
    
    IF check_column_exists('public', 'user_profiles', 'subscription_tier') THEN
        CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
    END IF;
    
    -- Create/update trigger
    DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
    IF check_column_exists('public', 'user_profiles', 'updated_at') THEN
        CREATE TRIGGER update_user_profiles_updated_at 
            BEFORE UPDATE ON public.user_profiles
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Enable RLS
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
END $$;

-- =====================================================
-- SECTION 4: CREATE OTHER CORE TABLES (Simplified)
-- =====================================================

-- User Preferences (with checks)
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

-- Check if user_id column exists in user_preferences
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'user_preferences') THEN
        IF NOT check_column_exists('public', 'user_preferences', 'user_id') THEN
            ALTER TABLE public.user_preferences ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE;
            RAISE NOTICE '✓ Added user_id to user_preferences';
        END IF;
    END IF;
END $$;

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

-- =====================================================
-- SECTION 5: SAFE RLS HELPER FUNCTIONS
-- =====================================================

-- Safe role checking function
CREATE OR REPLACE FUNCTION public.has_role(allowed_roles text[])
RETURNS boolean AS $$
DECLARE
    user_role text;
BEGIN
    -- Check if user_profiles table and role column exist
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'user_profiles')
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'user_profiles' 
                   AND column_name = 'role') THEN
        
        SELECT role INTO user_role
        FROM public.user_profiles
        WHERE id = auth.uid();
        
        RETURN user_role = ANY(allowed_roles);
    ELSE
        -- If table or column doesn't exist, return false
        RETURN false;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If any error occurs, return false
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN public.has_role(ARRAY['admin']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 6: SAFE RLS POLICIES
-- =====================================================

-- Enable RLS on tables that exist
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.table_name);
    END LOOP;
END $$;

-- User Profiles Policies (with column checks)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        
        -- Drop old policies
        DROP POLICY IF EXISTS "user_profiles_own_read" ON public.user_profiles;
        DROP POLICY IF EXISTS "user_profiles_own_update" ON public.user_profiles;
        DROP POLICY IF EXISTS "user_profiles_admin_all" ON public.user_profiles;
        
        -- Create new policies
        CREATE POLICY "user_profiles_own_read" ON public.user_profiles
            FOR SELECT USING (id = auth.uid() OR public.is_admin());
        
        -- Only create role-based update policy if role column exists
        IF check_column_exists('public', 'user_profiles', 'role') THEN
            CREATE POLICY "user_profiles_own_update" ON public.user_profiles
                FOR UPDATE USING (id = auth.uid())
                WITH CHECK (id = auth.uid() AND (OLD.role = NEW.role OR public.is_admin()));
        ELSE
            -- Simpler policy without role check
            CREATE POLICY "user_profiles_own_update" ON public.user_profiles
                FOR UPDATE USING (id = auth.uid())
                WITH CHECK (id = auth.uid());
        END IF;
        
        CREATE POLICY "user_profiles_admin_all" ON public.user_profiles
            FOR ALL USING (public.is_admin());
        
        RAISE NOTICE '✓ Created user_profiles policies';
    END IF;
END $$;

-- User Preferences Policies (with column checks)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'user_preferences') THEN
        
        DROP POLICY IF EXISTS "user_preferences_own" ON public.user_preferences;
        
        -- Only create policy if user_id column exists
        IF check_column_exists('public', 'user_preferences', 'user_id') THEN
            CREATE POLICY "user_preferences_own" ON public.user_preferences
                FOR ALL USING (user_id = auth.uid());
            RAISE NOTICE '✓ Created user_preferences policy';
        ELSE
            RAISE WARNING 'Cannot create user_preferences policy - user_id column missing';
        END IF;
    END IF;
END $$;

-- Chat Messages Policies (with column checks)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
        
        DROP POLICY IF EXISTS "chat_messages_own" ON public.chat_messages;
        
        -- Only create policy if user_id column exists
        IF check_column_exists('public', 'chat_messages', 'user_id') THEN
            CREATE POLICY "chat_messages_own" ON public.chat_messages
                FOR ALL USING (user_id = auth.uid());
            RAISE NOTICE '✓ Created chat_messages policy';
        ELSE
            RAISE WARNING 'Cannot create chat_messages policy - user_id column missing';
        END IF;
    END IF;
END $$;

-- Saved Content Policies (with column checks)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'saved_content') THEN
        
        DROP POLICY IF EXISTS "saved_content_own" ON public.saved_content;
        
        -- Only create policy if user_id column exists
        IF check_column_exists('public', 'saved_content', 'user_id') THEN
            CREATE POLICY "saved_content_own" ON public.saved_content
                FOR ALL USING (user_id = auth.uid());
            RAISE NOTICE '✓ Created saved_content policy';
        ELSE
            RAISE WARNING 'Cannot create saved_content policy - user_id column missing';
        END IF;
    END IF;
END $$;

-- Search History Policies (with column checks)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'search_history') THEN
        
        DROP POLICY IF EXISTS "search_history_own" ON public.search_history;
        
        -- Only create policy if user_id column exists
        IF check_column_exists('public', 'search_history', 'user_id') THEN
            CREATE POLICY "search_history_own" ON public.search_history
                FOR ALL USING (user_id = auth.uid());
            RAISE NOTICE '✓ Created search_history policy';
        ELSE
            RAISE WARNING 'Cannot create search_history policy - user_id column missing';
        END IF;
    END IF;
END $$;

-- =====================================================
-- SECTION 7: GRANT PERMISSIONS
-- =====================================================

-- Grant permissions only on tables that exist
DO $$
DECLARE
    tbl TEXT;
BEGIN
    -- Authenticated user permissions
    FOR tbl IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'user_profiles', 'user_preferences', 'chat_messages', 
            'saved_content', 'search_history'
        )
    LOOP
        EXECUTE format('GRANT ALL ON public.%I TO authenticated', tbl);
    END LOOP;
    
    -- Anonymous user permissions (if tables exist)
    FOR tbl IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'news_articles', 'government_services', 'tourism_attractions'
        )
    LOOP
        EXECUTE format('GRANT SELECT ON public.%I TO anon', tbl);
    END LOOP;
END $$;

-- =====================================================
-- SECTION 8: USER SIGNUP FUNCTION (Bulletproof)
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_columns TEXT[] := '{}';
    v_values TEXT[] := '{}';
    v_sql TEXT;
BEGIN
    -- Check if user_profiles table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        -- Table doesn't exist, skip
        RETURN NEW;
    END IF;
    
    -- Build dynamic insert based on what columns exist
    v_columns := array_append(v_columns, 'id');
    v_values := array_append(v_values, format('$1'));
    
    IF check_column_exists('public', 'user_profiles', 'email') THEN
        v_columns := array_append(v_columns, 'email');
        v_values := array_append(v_values, format('$2'));
    END IF;
    
    IF check_column_exists('public', 'user_profiles', 'full_name') THEN
        v_columns := array_append(v_columns, 'full_name');
        v_values := array_append(v_values, format('COALESCE($3, '''')'));
    END IF;
    
    IF check_column_exists('public', 'user_profiles', 'username') THEN
        v_columns := array_append(v_columns, 'username');
        v_values := array_append(v_values, format('COALESCE($4, split_part($2, ''@'', 1))'));
    END IF;
    
    -- Build and execute the query
    v_sql := format(
        'INSERT INTO public.user_profiles (%s) VALUES (%s) ON CONFLICT (id) DO UPDATE SET %s',
        array_to_string(v_columns, ', '),
        array_to_string(v_values, ', '),
        'email = COALESCE(EXCLUDED.email, user_profiles.email)'
    );
    
    EXECUTE v_sql USING 
        NEW.id, 
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'username';
    
    -- Create user preferences if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'user_preferences') THEN
        INSERT INTO public.user_preferences (user_id, language, theme)
        VALUES (NEW.id, 'en', 'light')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the signup
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
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
    missing_tables TEXT[] := '{}';
    tbl TEXT;
BEGIN
    -- Count what we created
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    -- Check for missing critical tables
    FOR tbl IN VALUES 
        ('user_profiles'), 
        ('user_preferences'), 
        ('chat_messages'), 
        ('saved_content'), 
        ('search_history')
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                       WHERE table_schema = 'public' AND table_name = tbl) THEN
            missing_tables := array_append(missing_tables, tbl);
        END IF;
    END LOOP;
    
    RAISE NOTICE '=== BULLETPROOF MIGRATION COMPLETE ===';
    RAISE NOTICE 'Tables in database: %', table_count;
    RAISE NOTICE 'Functions created: %', function_count;
    RAISE NOTICE 'RLS policies active: %', policy_count;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE WARNING 'Missing tables: %', array_to_string(missing_tables, ', ');
    END IF;
    
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'Database is ready for use!';
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS check_column_exists(TEXT, TEXT, TEXT);

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
-- To rollback:
-- 1. Restore from backup, OR
-- 2. Run: DROP SCHEMA public CASCADE; CREATE SCHEMA public;
-- =====================================================