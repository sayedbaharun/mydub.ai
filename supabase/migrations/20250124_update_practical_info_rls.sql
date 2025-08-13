-- Update Practical Information RLS Policies
-- Run this AFTER the RLS functions migration (20250124_rls_existing_tables_only.sql)

-- Check if the role functions exist before updating policies
DO $$ 
BEGIN
  -- Only proceed if the has_role function exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'has_role' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    
    -- Drop temporary policies
    DROP POLICY IF EXISTS "practical_info_auth_create" ON practical_information;
    DROP POLICY IF EXISTS "practical_info_update_own" ON practical_information;
    
    -- Staff can view all content
    DROP POLICY IF EXISTS "practical_info_staff_read" ON practical_information;
    CREATE POLICY "practical_info_staff_read" ON practical_information
      FOR SELECT USING (
        public.has_role(ARRAY['curator', 'editor', 'admin'])
      );

    -- Curators and above can create
    DROP POLICY IF EXISTS "practical_info_create" ON practical_information;
    CREATE POLICY "practical_info_create" ON practical_information
      FOR INSERT WITH CHECK (
        public.has_role(ARRAY['curator', 'editor', 'admin'])
        AND auth.uid() = created_by
      );

    -- Creators can update their own, editors can update any
    DROP POLICY IF EXISTS "practical_info_update" ON practical_information;
    CREATE POLICY "practical_info_update" ON practical_information
      FOR UPDATE USING (
        (created_by = auth.uid() AND public.has_role(ARRAY['curator', 'editor', 'admin']))
        OR public.has_role(ARRAY['editor', 'admin'])
      )
      WITH CHECK (
        (created_by = auth.uid() AND public.has_role(ARRAY['curator', 'editor', 'admin']))
        OR public.has_role(ARRAY['editor', 'admin'])
      );

    -- Only admins can delete
    DROP POLICY IF EXISTS "practical_info_delete" ON practical_information;
    CREATE POLICY "practical_info_delete" ON practical_information
      FOR DELETE USING (public.is_admin());

    -- Update categories policies
    DROP POLICY IF EXISTS "categories_admin_all" ON practical_info_categories;
    CREATE POLICY "categories_admin_all" ON practical_info_categories
      FOR ALL USING (public.is_admin());

    -- Update feedback policy
    DROP POLICY IF EXISTS "feedback_user_own" ON practical_info_feedback;
    CREATE POLICY "feedback_user_own" ON practical_info_feedback
      FOR ALL USING (
        user_id = auth.uid()
        OR public.has_role(ARRAY['curator', 'editor', 'admin'])
      );
    
    RAISE NOTICE 'Practical information RLS policies updated successfully';
  ELSE
    RAISE NOTICE 'Role functions not found. Run the RLS functions migration first.';
  END IF;
END $$;