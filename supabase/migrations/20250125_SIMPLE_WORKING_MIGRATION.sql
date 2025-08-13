-- =====================================================
-- SIMPLE WORKING MIGRATION - NO MORE MISTAKES
-- =====================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- STEP 1: Basic Functions
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 2: Handle user_profiles table
-- =====================================================
DO $$
BEGIN
    -- Rename if needed
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'profiles') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables 
                       WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        ALTER TABLE public.profiles RENAME TO user_profiles;
    END IF;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Create other tables WITH user_id column
-- =====================================================

-- User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Simple RLS Functions
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 5: Create policies ONLY after checking columns
-- =====================================================

-- User Profiles Policies
DO $$
BEGIN
    -- Only create policies if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;
        DROP POLICY IF EXISTS "user_profiles_update" ON public.user_profiles;
        
        -- Simple select policy
        CREATE POLICY "user_profiles_select" ON public.user_profiles
            FOR SELECT USING (true);
        
        -- Simple update policy
        CREATE POLICY "user_profiles_update" ON public.user_profiles
            FOR UPDATE USING (id = auth.uid());
    END IF;
END $$;

-- User Preferences Policies
DO $$
BEGIN
    -- Check if table AND user_id column exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'user_preferences'
               AND column_name = 'user_id') THEN
        
        DROP POLICY IF EXISTS "user_preferences_all" ON public.user_preferences;
        
        CREATE POLICY "user_preferences_all" ON public.user_preferences
            FOR ALL USING (user_id = auth.uid());
    END IF;
END $$;

-- =====================================================
-- STEP 6: Permissions
-- =====================================================
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_preferences TO authenticated;

-- =====================================================
-- STEP 7: Basic signup function
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- DONE - That's it. Simple and working.
-- =====================================================