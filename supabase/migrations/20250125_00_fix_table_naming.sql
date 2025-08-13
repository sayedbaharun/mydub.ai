-- Fix table naming issue: Rename profiles to user_profiles
-- This migration standardizes table naming to match RLS expectations

-- Step 1: Check if profiles table exists and user_profiles doesn't
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
  ) THEN
    
    -- Rename the table
    ALTER TABLE public.profiles RENAME TO user_profiles;
    
    -- Update any references in policies
    -- Note: Policies are automatically updated when table is renamed
    
    -- Update trigger names to match new table name
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.user_profiles;
    CREATE TRIGGER update_user_profiles_updated_at 
      BEFORE UPDATE ON public.user_profiles
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    
    -- Update indexes to have consistent naming
    DROP INDEX IF EXISTS idx_profiles_username;
    DROP INDEX IF EXISTS idx_profiles_role;
    DROP INDEX IF EXISTS idx_profiles_status;
    DROP INDEX IF EXISTS idx_profiles_subscription_tier;
    
    CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
    
    -- Update handle_new_user function to reference user_profiles
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
    
    RAISE NOTICE 'Successfully renamed profiles table to user_profiles';
    
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
  ) THEN
    -- Table already has correct name
    RAISE NOTICE 'Table user_profiles already exists with correct name';
    
    -- Ensure subscription_tier column exists
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
      
      RAISE NOTICE 'Added missing subscription_tier column to user_profiles';
    END IF;
    
  ELSE
    -- Neither table exists, create user_profiles
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
    
    -- Create indexes
    CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);
    CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
    CREATE INDEX idx_user_profiles_status ON public.user_profiles(status);
    CREATE INDEX idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
    
    -- Create trigger
    CREATE TRIGGER update_user_profiles_updated_at 
      BEFORE UPDATE ON public.user_profiles
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    
    -- Enable RLS
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create function to handle new user registration
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
    
    RAISE NOTICE 'Created user_profiles table from scratch';
  END IF;
END $$;

-- Grant permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;