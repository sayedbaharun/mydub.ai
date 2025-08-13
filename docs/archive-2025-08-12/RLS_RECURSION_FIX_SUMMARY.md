# RLS Recursion Fix Summary

## Problem Identified

The `profiles` table was experiencing infinite recursion errors in its RLS (Row Level Security) policies. Through debugging, we identified several issues:

### Root Causes

1. **Missing Columns**: The RLS policies referenced columns that didn't exist in the current table structure:
   - `is_public` column was missing but referenced in policies
   - Several other expected columns were missing

2. **Current Table Structure**:
   ```
   Existing columns: id, full_name, avatar_url, email, role, created_at, updated_at, user_type, language
   Missing columns: is_public, phone, bio, location, website, theme, ai_features_enabled, notifications_enabled, email_notifications, metadata
   ```

3. **Policy Conflicts**: Multiple migration files created overlapping or conflicting RLS policies that could cause circular references.

## Investigation Results

### Database Queries Executed

1. **Current RLS policies on profiles table**:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
   FROM pg_policies 
   WHERE schemaname = 'public' AND tablename = 'profiles';
   ```

2. **Triggers on profiles table**:
   ```sql
   SELECT trigger_name, event_manipulation, event_object_table, action_statement
   FROM information_schema.triggers
   WHERE event_object_schema = 'public' AND event_object_table = 'profiles';
   ```

3. **Functions that reference profiles table**:
   ```sql
   SELECT routine_name, routine_definition
   FROM information_schema.routines
   WHERE routine_schema = 'public' 
   AND routine_definition LIKE '%profiles%'
   AND routine_type = 'FUNCTION';
   ```

### Key Findings

- **Table Accessibility**: The profiles table is accessible via the Supabase client
- **Column Mismatch**: Policies reference `is_public` column which doesn't exist
- **RLS Working Partially**: Basic RLS functionality works (blocks unauthorized inserts)
- **No Infinite Recursion in Basic Operations**: Simple queries work, but complex operations likely trigger the recursion

## Solution Implemented

### Migration File Created: `20250803_fix_rls_recursion.sql`

This comprehensive migration:

1. **Adds Missing Columns**:
   - `is_public BOOLEAN DEFAULT false`
   - `phone TEXT`
   - `bio TEXT`
   - `location TEXT`
   - `website TEXT`
   - `theme TEXT DEFAULT 'light'`
   - `ai_features_enabled BOOLEAN DEFAULT true`
   - `notifications_enabled BOOLEAN DEFAULT true`
   - `email_notifications BOOLEAN DEFAULT true`
   - `metadata JSONB DEFAULT '{}'::jsonb`

2. **Removes All Existing Policies**:
   - Drops all potentially conflicting RLS policies
   - Prevents any circular references

3. **Creates Safe RLS Policies**:
   ```sql
   -- Users can view their own profile
   CREATE POLICY "profiles_own_select" ON public.profiles
       FOR SELECT USING (auth.uid() = id);

   -- Users can update their own profile
   CREATE POLICY "profiles_own_update" ON public.profiles
       FOR UPDATE 
       USING (auth.uid() = id)
       WITH CHECK (auth.uid() = id);

   -- Public profiles viewable by everyone
   CREATE POLICY "profiles_public_select" ON public.profiles
       FOR SELECT USING (is_public = true);

   -- Users can insert their own profile
   CREATE POLICY "profiles_own_insert" ON public.profiles
       FOR INSERT WITH CHECK (auth.uid() = id);

   -- Service role can do everything
   CREATE POLICY "profiles_service_role_all" ON public.profiles
       FOR ALL 
       USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');
   ```

4. **Adds Constraints and Indexes**:
   - Role constraint: `CHECK (role IN ('user', 'curator', 'editor', 'admin'))`
   - Theme constraint: `CHECK (theme IN ('light', 'dark', 'system'))`
   - Performance indexes on commonly queried columns

## How to Apply the Fix

### Option 1: Via Supabase CLI (Recommended)
```bash
npx supabase db push
```

### Option 2: Manual SQL Execution
Copy and execute the contents of `supabase/migrations/20250803_fix_rls_recursion.sql` in the Supabase Dashboard SQL editor.

### Option 3: Direct SQL Commands
If you need to run the fix immediately, execute this SQL:

```sql
-- Add missing is_public column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_public BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create safe policies
CREATE POLICY "profiles_own_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_public_select" ON public.profiles
  FOR SELECT USING (is_public = true);

CREATE POLICY "profiles_own_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_service_role_all" ON public.profiles
  FOR ALL 
  USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');
```

## Verification Steps

After applying the fix:

1. **Check that policies exist**:
   ```sql
   SELECT policyname, cmd FROM pg_policies 
   WHERE schemaname = 'public' AND tablename = 'profiles';
   ```

2. **Verify columns exist**:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'profiles';
   ```

3. **Test basic operations**:
   - User profile queries should work without recursion errors
   - Insert/update operations should respect RLS policies
   - Public profile visibility should work correctly

## Prevention

To prevent similar issues in the future:

1. **Column Existence Checks**: Always check if columns exist before creating policies that reference them
2. **Simple Policies**: Avoid complex policy logic that might create circular references
3. **Migration Testing**: Test migrations in development before applying to production
4. **Policy Naming**: Use consistent, descriptive names for policies to avoid conflicts

## Files Modified

- `supabase/migrations/20250803_fix_rls_recursion.sql` (created)
- `RLS_RECURSION_FIX_SUMMARY.md` (this file)

## Next Steps

1. Apply the migration to fix the recursion issue
2. Test user authentication and profile operations
3. Monitor for any remaining RLS-related errors
4. Consider adding integration tests for RLS policies