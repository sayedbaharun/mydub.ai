# RLS Policy Column Dependencies Analysis

## Summary of Issues Found

### 1. **Critical Issues with `user_id` References**

Multiple policies reference `user_id` columns without checking if they exist:

#### Tables with Direct `user_id` References in Policies:
- **chat_messages** (line 832): `user_id = auth.uid()`
- **saved_content** (line 838): `user_id = auth.uid()`
- **search_history** (line 844): `user_id = auth.uid()`
- **user_preferences** (line 850): `user_id = auth.uid()`

**Problem**: These policies assume `user_id` column exists but there's no verification before creating the policy.

### 2. **Column Dependencies in RLS Policies**

#### `user_profiles` table policies:
- **Lines 772-780**: References columns:
  - `id` (assumed to exist for comparison with auth.uid())
  - `role` (used in WITH CHECK clause, line 777)
  - No column existence checks before policy creation

#### `news_articles` table policies:
- **Line 792**: No column dependencies (public read)
- **Lines 795-801**: No direct column references in USING clauses

#### `government_services` table policies:
- **Line 810**: References `is_active` column without checking existence

#### `tourism_attractions` table policies:
- **Line 821**: References `is_active` column without checking existence

#### `practical_information` table policies:
- **Line 881**: References:
  - `is_active` column
  - `published_at` column
  - No existence checks for either column

### 3. **Function Dependencies on Columns**

#### `has_role()` function (lines 708-719):
- References `user_profiles.role` column without checking if it exists
- References `user_profiles.id` column without checking if it exists

#### `has_subscription()` function (lines 730-754):
- References `user_profiles.subscription_tier` column without checking if it exists
- References `user_profiles.id` column without checking if it exists

#### `handle_new_user()` function (lines 923-991):
- Has column existence checks (good practice) but still has issues:
  - Checks for `username` and `full_name` columns (lines 930-942)
  - Always assumes `id` and `email` columns exist (lines 946-981)

### 4. **Missing Column Existence Checks Before Policy Creation**

The migration creates policies without verifying that the referenced columns exist. While tables are created with `IF NOT EXISTS`, the policies are created with simple `DROP POLICY IF EXISTS` followed by `CREATE POLICY`, assuming all columns are present.

## Recommended Fixes

### 1. **Add Column Existence Checks for All Policies**

Before creating each policy, check if the required columns exist:

```sql
DO $$
BEGIN
    -- Check if user_id column exists before creating policy
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'chat_messages' 
               AND column_name = 'user_id') THEN
        DROP POLICY IF EXISTS "chat_messages_own" ON public.chat_messages;
        CREATE POLICY "chat_messages_own" ON public.chat_messages
            FOR ALL USING (user_id = auth.uid());
    END IF;
END $$;
```

### 2. **Update Helper Functions with Column Checks**

Modify the `has_role()` and `has_subscription()` functions to handle missing columns:

```sql
CREATE OR REPLACE FUNCTION public.has_role(allowed_roles text[])
RETURNS boolean AS $$
DECLARE
    user_role text;
    role_column_exists boolean;
BEGIN
    -- Check if role column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'role'
    ) INTO role_column_exists;
    
    IF NOT role_column_exists THEN
        RETURN FALSE;
    END IF;
    
    SELECT role INTO user_role
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    RETURN user_role = ANY(allowed_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. **Complete List of Column Dependencies by Policy**

#### User Profiles Policies:
- `user_profiles_own_read`: `id`
- `user_profiles_own_update`: `id`, `role`
- `user_profiles_admin_all`: Depends on `has_role()` function which needs `id` and `role`

#### News Articles Policies:
- `news_articles_public_read`: None
- `news_articles_curator_create`: Depends on `has_role()` function
- `news_articles_editor_update`: Depends on `has_role()` function
- `news_articles_admin_delete`: Depends on `is_admin()` function

#### Government Services Policies:
- `gov_services_public_read`: `is_active`
- `gov_services_curator_manage`: Depends on `has_role()` function

#### Tourism Attractions Policies:
- `tourism_attractions_public_read`: `is_active`
- `tourism_attractions_curator_manage`: Depends on `has_role()` function

#### User Data Policies:
- `chat_messages_own`: `user_id`
- `saved_content_own`: `user_id`
- `search_history_own`: `user_id`
- `user_preferences_own`: `user_id`

#### Analytics Policies:
- `page_views_insert`: None
- `page_views_admin_read`: Depends on `is_admin()` function

#### Public Data Policies:
- `traffic_data_public_read`: None
- `weather_data_public_read`: None
- `practical_info_public_read`: `is_active`, `published_at`

### 4. **Additional Issues Found**

1. **Foreign Key Assumptions**: 
   - Many tables assume `auth.users(id)` exists (lines 88, 323, 324, 367, 368, etc.)
   - No verification that the auth schema and users table are available

2. **Trigger Dependencies**:
   - Triggers assume `updated_at` column exists in various tables
   - The migration adds columns conditionally but creates triggers unconditionally

3. **Index Creation**:
   - Indexes are created without verifying the columns exist (though there is some checking in lines 242-267)

## Priority Fixes

1. **HIGH**: Add column existence checks for all policies that reference specific columns
2. **HIGH**: Update `has_role()` and `has_subscription()` functions to handle missing columns gracefully
3. **MEDIUM**: Add checks for foreign key references to auth.users
4. **MEDIUM**: Ensure trigger creation only happens when required columns exist
5. **LOW**: Add comprehensive error handling and rollback capabilities