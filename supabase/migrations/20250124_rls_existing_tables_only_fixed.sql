-- Comprehensive RLS Implementation for Existing Tables Only (Fixed Version)
-- This migration creates role-based access control for existing tables

-- First, create the audit_role_change function outside of any DO block
CREATE OR REPLACE FUNCTION audit_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes to audit table
  INSERT INTO public.user_role_audit (
    user_id,
    old_role,
    new_role,
    changed_by,
    reason
  ) VALUES (
    NEW.id,
    OLD.role,
    NEW.role,
    auth.uid(),
    'Admin role change'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 1: Create role helper functions in public schema
CREATE OR REPLACE FUNCTION public.has_role(allowed_roles text[])
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the user's role from user_profiles
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  -- Check if user's role is in the allowed roles
  RETURN user_role = ANY(allowed_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN public.has_role(ARRAY['admin']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's subscription status
CREATE OR REPLACE FUNCTION public.has_subscription(min_tier text DEFAULT NULL)
RETURNS boolean AS $$
DECLARE
  user_tier text;
BEGIN
  SELECT subscription_tier INTO user_tier
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  IF min_tier IS NULL THEN
    -- Just check if they have any subscription
    RETURN user_tier IS NOT NULL AND user_tier != 'free';
  ELSE
    -- Check specific tier hierarchy
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

-- Step 2: Apply RLS to existing tables
DO $$
DECLARE
  table_record RECORD;
BEGIN
  -- Enable RLS on existing tables if not already enabled
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'news_articles', 'news_sources',
      'government_services', 'government_departments',
      'tourism_attractions', 'tourism_events',
      'traffic_data', 'traffic_incidents',
      'weather_data',
      'user_profiles', 'user_preferences',
      'chat_messages', 'saved_content',
      'search_history', 'page_views'
    )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
  END LOOP;
END $$;

-- Step 3: Update RLS policies for news tables
DO $$
BEGIN
  -- News Articles - Public read, role-based write
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'news_articles' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Public can view news articles" ON public.news_articles;
    CREATE POLICY "news_articles_public_read" ON public.news_articles
      FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "news_articles_curator_create" ON public.news_articles;
    CREATE POLICY "news_articles_curator_create" ON public.news_articles
      FOR INSERT WITH CHECK (
        public.has_role(ARRAY['curator', 'editor', 'admin'])
      );
    
    DROP POLICY IF EXISTS "news_articles_editor_update" ON public.news_articles;
    CREATE POLICY "news_articles_editor_update" ON public.news_articles
      FOR UPDATE USING (
        public.has_role(ARRAY['editor', 'admin'])
      );
    
    DROP POLICY IF EXISTS "news_articles_admin_delete" ON public.news_articles;
    CREATE POLICY "news_articles_admin_delete" ON public.news_articles
      FOR DELETE USING (public.is_admin());
  END IF;

  -- News Sources - Public read active, admin all
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'news_sources' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Public can view active news sources" ON public.news_sources;
    CREATE POLICY "news_sources_public_read_active" ON public.news_sources
      FOR SELECT USING (is_active = true);
    
    DROP POLICY IF EXISTS "news_sources_admin_all" ON public.news_sources;
    CREATE POLICY "news_sources_admin_all" ON public.news_sources
      FOR ALL USING (public.is_admin());
  END IF;
END $$;

-- Step 4: Update RLS policies for government tables
DO $$
BEGIN
  -- Government Services
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'government_services' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Public can view active government services" ON public.government_services;
    CREATE POLICY "gov_services_public_read_active" ON public.government_services
      FOR SELECT USING (is_active = true);
    
    DROP POLICY IF EXISTS "gov_services_curator_manage" ON public.government_services;
    CREATE POLICY "gov_services_curator_manage" ON public.government_services
      FOR ALL USING (
        public.has_role(ARRAY['curator', 'editor', 'admin'])
      );
  END IF;

  -- Government Departments
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'government_departments' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Public can view active departments" ON public.government_departments;
    CREATE POLICY "gov_departments_public_read_active" ON public.government_departments
      FOR SELECT USING (is_active = true);
    
    DROP POLICY IF EXISTS "gov_departments_admin_manage" ON public.government_departments;
    CREATE POLICY "gov_departments_admin_manage" ON public.government_departments
      FOR ALL USING (public.is_admin());
  END IF;
END $$;

-- Step 5: Update RLS policies for tourism tables
DO $$
BEGIN
  -- Tourism Attractions
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tourism_attractions' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Public can view active attractions" ON public.tourism_attractions;
    CREATE POLICY "tourism_attractions_public_read_active" ON public.tourism_attractions
      FOR SELECT USING (is_active = true);
    
    DROP POLICY IF EXISTS "tourism_attractions_curator_manage" ON public.tourism_attractions;
    CREATE POLICY "tourism_attractions_curator_manage" ON public.tourism_attractions
      FOR ALL USING (
        public.has_role(ARRAY['curator', 'editor', 'admin'])
      );
  END IF;

  -- Tourism Events
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tourism_events' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Public can view active events" ON public.tourism_events;
    CREATE POLICY "tourism_events_public_read_active" ON public.tourism_events
      FOR SELECT USING (is_active = true);
    
    DROP POLICY IF EXISTS "tourism_events_curator_manage" ON public.tourism_events;
    CREATE POLICY "tourism_events_curator_manage" ON public.tourism_events
      FOR ALL USING (
        public.has_role(ARRAY['curator', 'editor', 'admin'])
      );
  END IF;
END $$;

-- Step 6: Update RLS policies for traffic and weather
DO $$
BEGIN
  -- Traffic Data - Public read only
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'traffic_data' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Public can view traffic data" ON public.traffic_data;
    CREATE POLICY "traffic_data_public_read" ON public.traffic_data
      FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "traffic_data_editor_manage" ON public.traffic_data;
    CREATE POLICY "traffic_data_editor_manage" ON public.traffic_data
      FOR ALL USING (
        public.has_role(ARRAY['editor', 'admin'])
      );
  END IF;

  -- Traffic Incidents
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'traffic_incidents' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Public can view traffic incidents" ON public.traffic_incidents;
    CREATE POLICY "traffic_incidents_public_read" ON public.traffic_incidents
      FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "traffic_incidents_editor_manage" ON public.traffic_incidents;
    CREATE POLICY "traffic_incidents_editor_manage" ON public.traffic_incidents
      FOR ALL USING (
        public.has_role(ARRAY['editor', 'admin'])
      );
  END IF;

  -- Weather Data
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'weather_data' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Public can view weather data" ON public.weather_data;
    CREATE POLICY "weather_data_public_read" ON public.weather_data
      FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "weather_data_editor_manage" ON public.weather_data;
    CREATE POLICY "weather_data_editor_manage" ON public.weather_data
      FOR ALL USING (
        public.has_role(ARRAY['editor', 'admin'])
      );
  END IF;
END $$;

-- Step 7: User-specific tables
DO $$
BEGIN
  -- User Profiles
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles' AND schemaname = 'public') THEN
    -- Users can read their own profile
    DROP POLICY IF EXISTS "user_profiles_own_read" ON public.user_profiles;
    CREATE POLICY "user_profiles_own_read" ON public.user_profiles
      FOR SELECT USING (
        id = auth.uid() OR public.is_admin()
      );
    
    -- Users can update their own profile (except role)
    DROP POLICY IF EXISTS "user_profiles_own_update" ON public.user_profiles;
    CREATE POLICY "user_profiles_own_update" ON public.user_profiles
      FOR UPDATE USING (id = auth.uid())
      WITH CHECK (
        id = auth.uid() 
        AND (OLD.role = NEW.role OR public.is_admin()) -- Only admin can change roles
      );
    
    -- Admin can manage all profiles
    DROP POLICY IF EXISTS "user_profiles_admin_all" ON public.user_profiles;
    CREATE POLICY "user_profiles_admin_all" ON public.user_profiles
      FOR ALL USING (public.is_admin());
  END IF;

  -- User Preferences
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_preferences' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "user_preferences_own" ON public.user_preferences;
    CREATE POLICY "user_preferences_own" ON public.user_preferences
      FOR ALL USING (user_id = auth.uid());
    
    DROP POLICY IF EXISTS "user_preferences_admin_read" ON public.user_preferences;
    CREATE POLICY "user_preferences_admin_read" ON public.user_preferences
      FOR SELECT USING (public.is_admin());
  END IF;
END $$;

-- Step 8: Chat and interaction tables
DO $$
BEGIN
  -- Chat Messages
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'chat_messages' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "chat_messages_own" ON public.chat_messages;
    CREATE POLICY "chat_messages_own" ON public.chat_messages
      FOR ALL USING (user_id = auth.uid());
    
    DROP POLICY IF EXISTS "chat_messages_admin_read" ON public.chat_messages;
    CREATE POLICY "chat_messages_admin_read" ON public.chat_messages
      FOR SELECT USING (public.is_admin());
  END IF;

  -- Saved Content
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'saved_content' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "saved_content_own" ON public.saved_content;
    CREATE POLICY "saved_content_own" ON public.saved_content
      FOR ALL USING (user_id = auth.uid());
  END IF;

  -- Search History
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'search_history' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "search_history_own" ON public.search_history;
    CREATE POLICY "search_history_own" ON public.search_history
      FOR ALL USING (user_id = auth.uid());
    
    -- Admin can view for analytics
    DROP POLICY IF EXISTS "search_history_admin_read" ON public.search_history;
    CREATE POLICY "search_history_admin_read" ON public.search_history
      FOR SELECT USING (public.is_admin());
  END IF;
END $$;

-- Step 9: Analytics tables
DO $$
BEGIN
  -- Page Views
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'page_views' AND schemaname = 'public') THEN
    -- Anyone can insert page views
    DROP POLICY IF EXISTS "page_views_insert" ON public.page_views;
    CREATE POLICY "page_views_insert" ON public.page_views
      FOR INSERT WITH CHECK (true);
    
    -- Only admins can read
    DROP POLICY IF EXISTS "page_views_admin_read" ON public.page_views;
    CREATE POLICY "page_views_admin_read" ON public.page_views
      FOR SELECT USING (public.is_admin());
  END IF;
END $$;

-- Step 10: Subscription-based access examples
-- Premium content access for tourism attractions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tourism_attractions' AND schemaname = 'public') THEN
    -- Add policy for premium attractions
    DROP POLICY IF EXISTS "tourism_attractions_premium_read" ON public.tourism_attractions;
    CREATE POLICY "tourism_attractions_premium_read" ON public.tourism_attractions
      FOR SELECT USING (
        is_active = true 
        AND (
          -- Non-premium content is public
          COALESCE((metadata->>'is_premium')::boolean, false) = false
          -- Premium content requires subscription
          OR public.has_subscription('basic')
          -- Staff can always see
          OR public.has_role(ARRAY['curator', 'editor', 'admin'])
        )
      );
  END IF;
END $$;

-- Step 11: Create audit table for role changes
CREATE TABLE IF NOT EXISTS public.user_role_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  old_role TEXT,
  new_role TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);

-- Enable RLS on audit table
ALTER TABLE public.user_role_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "role_audit_admin_only" ON public.user_role_audit
  FOR SELECT USING (public.is_admin());

-- Now create the trigger (after the function is already created)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles' AND schemaname = 'public') THEN
    DROP TRIGGER IF EXISTS audit_role_changes ON public.user_profiles;
    CREATE TRIGGER audit_role_changes
      AFTER UPDATE OF role ON public.user_profiles
      FOR EACH ROW
      WHEN (OLD.role IS DISTINCT FROM NEW.role)
      EXECUTE FUNCTION audit_role_change();
  END IF;
END $$;

-- Step 12: Grant necessary permissions
DO $$
DECLARE
  table_record RECORD;
BEGIN
  -- Grant basic permissions to authenticated users
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'news_articles', 'news_sources',
      'government_services', 'government_departments',
      'tourism_attractions', 'tourism_events',
      'traffic_data', 'traffic_incidents',
      'weather_data'
    )
  LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_record.tablename);
  END LOOP;
  
  -- Grant permissions for user-specific tables
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'user_profiles', 'user_preferences',
      'chat_messages', 'saved_content',
      'search_history'
    )
  LOOP
    EXECUTE format('GRANT ALL ON public.%I TO authenticated', table_record.tablename);
  END LOOP;
END $$;

-- Add comments for documentation
COMMENT ON FUNCTION public.has_role(text[]) IS 'Check if the current user has one of the specified roles';
COMMENT ON FUNCTION public.is_admin() IS 'Check if the current user is an admin';
COMMENT ON FUNCTION public.has_subscription(text) IS 'Check if the current user has a subscription at or above the specified tier';