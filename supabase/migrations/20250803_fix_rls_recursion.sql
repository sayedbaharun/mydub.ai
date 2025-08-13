-- Fix RLS infinite recursion on profiles table
-- This migration addresses the infinite recursion error by:
-- 1. Adding missing columns that policies expect
-- 2. Removing all existing policies that might cause recursion
-- 3. Creating simple, safe policies that avoid circular references

-- Add missing columns that the RLS policies expect
DO $$
BEGIN
    -- Add is_public column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_public BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_public column to profiles table';
    ELSE
        RAISE NOTICE 'is_public column already exists in profiles table';
    END IF;

    -- Add other missing columns from the expected schema
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column to profiles table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'bio'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
        RAISE NOTICE 'Added bio column to profiles table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'location'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN location TEXT;
        RAISE NOTICE 'Added location column to profiles table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'website'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN website TEXT;
        RAISE NOTICE 'Added website column to profiles table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'theme'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN theme TEXT DEFAULT 'light';
        RAISE NOTICE 'Added theme column to profiles table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'ai_features_enabled'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN ai_features_enabled BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added ai_features_enabled column to profiles table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'notifications_enabled'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added notifications_enabled column to profiles table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'email_notifications'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email_notifications BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added email_notifications column to profiles table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added metadata column to profiles table';
    END IF;
END $$;

-- Drop all existing RLS policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;

-- Any other policies that might exist
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_rec.policyname || '" ON public.profiles';
        RAISE NOTICE 'Dropped existing policy: %', policy_rec.policyname;
    END LOOP;
END $$;

-- Enable RLS on the table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, safe RLS policies that avoid recursion
-- Policy 1: Users can view their own profile (simple auth.uid() comparison)
CREATE POLICY "profiles_own_select" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (simple auth.uid() comparison)
CREATE POLICY "profiles_own_update" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Public profiles are viewable by everyone
CREATE POLICY "profiles_public_select" ON public.profiles
    FOR SELECT 
    USING (is_public = true);

-- Policy 4: Users can insert their own profile during signup
CREATE POLICY "profiles_own_insert" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy 5: Service role can do everything (for admin operations)
CREATE POLICY "profiles_service_role_all" ON public.profiles
    FOR ALL 
    USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- Update the role constraint to include all valid roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'curator', 'editor', 'admin'));

-- Update the theme constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_theme_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_theme_check 
    CHECK (theme IN ('light', 'dark', 'system'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON public.profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Grant necessary permissions
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Add table comment
COMMENT ON TABLE public.profiles IS 'User profile information with RLS policies that avoid infinite recursion';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '=== RLS RECURSION FIX COMPLETED ===';
    RAISE NOTICE 'Fixed infinite recursion in profiles table RLS policies';
    RAISE NOTICE 'Added missing columns and created safe policies';
    RAISE NOTICE '================================';
END $$;