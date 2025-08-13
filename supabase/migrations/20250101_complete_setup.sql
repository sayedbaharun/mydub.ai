-- =====================================================
-- COMPLETE DATABASE SETUP FOR MYDUB.AI
-- =====================================================
-- This consolidated migration sets up the entire database
-- Safe to run multiple times (idempotent)
-- =====================================================

-- =====================================================
-- 1. CORE FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. PROFILES TABLE
-- =====================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    phone TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT false,
    theme TEXT DEFAULT 'light',
    ai_features_enabled BOOLEAN DEFAULT true,
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists
DO $$
BEGIN
    -- Add columns that might be missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_public') THEN
        ALTER TABLE profiles ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'theme') THEN
        ALTER TABLE profiles ADD COLUMN theme TEXT DEFAULT 'light';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'ai_features_enabled') THEN
        ALTER TABLE profiles ADD COLUMN ai_features_enabled BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'notifications_enabled') THEN
        ALTER TABLE profiles ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'email_notifications') THEN
        ALTER TABLE profiles ADD COLUMN email_notifications BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Update role constraint to only allow user/admin
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'admin'));
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore if constraint doesn't exist
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Create trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. BOOKMARKS TABLES
-- =====================================================

-- Create bookmark collections table
CREATE TABLE IF NOT EXISTS bookmark_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'event', 'place', 'dining', 'service')),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  url TEXT,
  collection_id UUID REFERENCES bookmark_collections(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Create indexes for bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_content_id ON bookmarks(content_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_content_type ON bookmarks(content_type);
CREATE INDEX IF NOT EXISTS idx_bookmarks_collection_id ON bookmarks(collection_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_collections_user_id ON bookmark_collections(user_id);

-- Function to update bookmark timestamp
CREATE OR REPLACE FUNCTION update_bookmark_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for bookmarks updated_at
DROP TRIGGER IF EXISTS update_bookmarks_updated_at ON bookmarks;
CREATE TRIGGER update_bookmarks_updated_at
  BEFORE UPDATE ON bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_bookmark_timestamp();

DROP TRIGGER IF EXISTS update_bookmark_collections_updated_at ON bookmark_collections;
CREATE TRIGGER update_bookmark_collections_updated_at
  BEFORE UPDATE ON bookmark_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_bookmark_timestamp();

-- Function to create default collection for new users
CREATE OR REPLACE FUNCTION create_default_bookmark_collection()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO bookmark_collections (user_id, name, is_default)
  VALUES (NEW.id, 'My Bookmarks', TRUE)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default collection when user signs up
DROP TRIGGER IF EXISTS create_user_default_collection ON auth.users;
CREATE TRIGGER create_user_default_collection
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_bookmark_collection();

-- Enable RLS for bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_collections ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. ADMIN ROLE SYSTEM
-- =====================================================

-- Create admin emails table
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email TEXT PRIMARY KEY,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Insert default admin emails
INSERT INTO public.admin_emails (email, notes) 
VALUES 
  ('admin@mydub.ai', 'Default system admin'),
  ('sayedmbaharun@gmail.com', 'Site owner')
ON CONFLICT (email) DO NOTHING;

-- Function to check if email is admin (uses admin_emails table)
CREATE OR REPLACE FUNCTION public.is_admin_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_emails 
    WHERE LOWER(admin_emails.email) = LOWER(is_admin_email.email)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to automatically set role based on email
CREATE OR REPLACE FUNCTION public.set_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF public.is_admin_email(NEW.email) THEN
    NEW.role := 'admin';
  ELSIF NEW.role IS NULL THEN
    NEW.role := 'user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for admin role enforcement
DROP TRIGGER IF EXISTS set_role_on_profile_insert ON public.profiles;
CREATE TRIGGER set_role_on_profile_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_role();

DROP TRIGGER IF EXISTS enforce_admin_role_on_update ON public.profiles;
CREATE TRIGGER enforce_admin_role_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.set_user_role();

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin management functions
CREATE OR REPLACE FUNCTION public.add_admin_email(
  new_email TEXT,
  notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Only admins can add new admin emails';
  END IF;
  
  INSERT INTO public.admin_emails (email, added_by, notes)
  VALUES (LOWER(new_email), auth.uid(), notes);
  
  UPDATE public.profiles
  SET role = 'admin'
  WHERE LOWER(email) = LOWER(new_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.remove_admin_email(email_to_remove TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Only admins can remove admin emails';
  END IF;
  
  IF (SELECT COUNT(*) FROM public.admin_emails) <= 1 THEN
    RAISE EXCEPTION 'Cannot remove last admin email';
  END IF;
  
  DELETE FROM public.admin_emails 
  WHERE LOWER(email) = LOWER(email_to_remove);
  
  UPDATE public.profiles
  SET role = 'user'
  WHERE LOWER(email) = LOWER(email_to_remove);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin users view
CREATE OR REPLACE VIEW public.admin_users AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  ae.notes as admin_notes,
  ae.added_at as admin_since
FROM public.profiles p
INNER JOIN public.admin_emails ae ON LOWER(p.email) = LOWER(ae.email)
WHERE p.role = 'admin';

-- Update existing users to have correct admin roles
UPDATE public.profiles
SET role = 'admin'
WHERE public.is_admin_email(email);

-- =====================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Drop ALL existing policies to avoid conflicts
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- PROFILES TABLE POLICIES
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      -- Users cannot change their own role unless they are admin
      (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
      OR public.is_current_user_admin()
    )
  );

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_current_user_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Public profiles viewable by all"
  ON public.profiles
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Authenticated users view non-public profiles"
  ON public.profiles
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_public = false);

CREATE POLICY "Service role full access"
  ON public.profiles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- BOOKMARKS TABLE POLICIES
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- BOOKMARK COLLECTIONS TABLE POLICIES
CREATE POLICY "Users can view their own collections"
  ON bookmark_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
  ON bookmark_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON bookmark_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON bookmark_collections FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. PERMISSIONS
-- =====================================================

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.admin_emails TO authenticated;
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON bookmarks TO authenticated;
GRANT ALL ON bookmark_collections TO authenticated;

-- =====================================================
-- 7. FINAL SETUP CHECK
-- =====================================================

DO $$
DECLARE
  admin_count INTEGER;
  table_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'bookmarks', 'bookmark_collections', 'admin_emails');
  
  -- Count admins
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles
  WHERE role = 'admin';
  
  -- Log results
  RAISE NOTICE 'Database setup complete!';
  RAISE NOTICE 'Tables created: %', table_count;
  RAISE NOTICE 'Admin users: %', admin_count;
END $$;