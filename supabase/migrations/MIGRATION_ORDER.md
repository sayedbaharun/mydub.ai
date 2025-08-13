# Migration Execution Order

Run these migrations in the Supabase Dashboard SQL Editor in this exact order:

## Pre-requisites (Run First!)
```sql
-- 1. Fix table naming and ensure user_profiles exists
20250125_00_fix_table_naming.sql

-- 2. Create missing core tables referenced by RLS
20250125_01_create_missing_core_tables.sql
```

## Phase 1: Foundation Tables
```sql
-- 3. Core content tables (news, government, tourism)
20250115_core_tables.sql

-- 4. User interaction tables (preferences, favorites, notifications)
20250115_user_interaction_tables.sql

-- 5. Analytics and communication tables
20250115_analytics_communication_tables.sql
```

## Phase 2: Feature Tables
```sql
-- 6. Chat functionality
20240115_chatbot_tables.sql

-- 7. Dashboard and content management
20240116_dashboard_tables.sql

-- 8. Traffic and weather data
20250116_traffic_weather_tables.sql

-- 9. AI agent interactions
20241217000003_ai_agent_interactions.sql
```

## Phase 3: Media & Storage
```sql
-- 10. Storage buckets configuration
20250116_storage_buckets.sql

-- 11. Image metadata columns
20250116_add_image_metadata.sql

-- 12. Article images management
20250117_article_images_table.sql

-- 13. Image attribution
20250117_add_image_attribution_columns.sql
```

## Phase 4: Content & Features
```sql
-- 14. Dashboard content view
20250116_dashboard_content_view.sql

-- 15. Arabic phrases for localization
20250123_arabic_phrases_table.sql

-- 16. Practical information system
20250124_create_practical_information_standalone.sql
```

## Phase 5: Security & Compliance
```sql
-- 17. Parental consent tracking
20250123_parental_consent.sql

-- 18. AI transparency features
20250124_ai_transparency_tables.sql

-- 19. Content moderation system
20250124_content_moderation_tables.sql

-- 20. Data residency compliance
20250124_data_residency_tables.sql

-- 21. Security audit tables
20250124_security_tables.sql
```

## Phase 6: RLS Policies (Run Last!)
```sql
-- 22. Comprehensive RLS with role functions
20250124_rls_existing_tables_only_fixed.sql

-- 23. Update practical info RLS
20250124_update_practical_info_rls.sql
```

## Important Notes

1. **Check for errors** after each migration
2. **Skip migrations** that have already been applied (check for "already exists" errors)
3. **RLS must be last** - All tables must exist before applying RLS policies
4. **User_profiles table** - Must exist before any RLS policies are applied

## Quick Check Commands

Run these to verify your database state:

```sql
-- Check if user_profiles exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
);

-- Check if role functions exist
SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'has_role' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
);

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```