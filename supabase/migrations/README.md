# Supabase Migrations Guide

## Migration Order and Dependencies

Run migrations in this exact order:

### Phase 1: Foundation (Required)
```sql
-- 1. Create base functions and profiles
20250101_create_profiles_table.sql

-- 2. Core content tables
20250115_core_tables.sql

-- 3. User interaction tables
20250115_user_interaction_tables.sql
```

### Phase 2: Features
```sql
-- 4. Chat functionality
20240115_chatbot_tables.sql

-- 5. Dashboard tables
20240116_dashboard_tables.sql

-- 6. Analytics
20250115_analytics_communication_tables.sql

-- 7. Traffic and weather
20250116_traffic_weather_tables.sql

-- 8. AI interactions
20241217000003_ai_agent_interactions.sql
```

### Phase 3: Media & Storage
```sql
-- 9. Storage buckets
20250116_storage_buckets.sql

-- 10. Image metadata
20250116_add_image_metadata.sql

-- 11. Article images
20250117_article_images_table.sql

-- 12. Image attribution
20250117_add_image_attribution_columns.sql
```

### Phase 4: Content & Localization
```sql
-- 13. Dashboard views
20250116_dashboard_content_view.sql

-- 14. Arabic phrases
20250123_arabic_phrases_table.sql

-- 15. Practical information (use standalone version)
20250124_create_practical_information_standalone.sql
```

### Phase 5: Security & Compliance
```sql
-- 16. Parental consent
20250123_parental_consent.sql

-- 17. AI transparency
20250124_ai_transparency_tables.sql

-- 18. Content moderation
20250124_content_moderation_tables.sql

-- 19. Data residency
20250124_data_residency_tables.sql

-- 20. Security audit tables
20250124_security_tables.sql
```

### Phase 6: RLS Policies (Run Last!)
```sql
-- 21. RLS implementation with role functions
20250124_rls_existing_tables_only_fixed.sql

-- 22. Update practical info RLS (after role functions exist)
20250124_update_practical_info_rls.sql
```

## Files to Ignore/Remove

These files are duplicates or have been superseded:

- `20250121_fix_rls_policies.sql` - Superseded by comprehensive RLS
- `20250123_comprehensive_rls_policies.sql` - Superseded by fixed version
- `20250124_create_practical_information_table.sql` - Use standalone version
- `20250124_comprehensive_rls_update.sql` - Superseded by fixed version
- `20250124_comprehensive_rls_update_fixed.sql` - Superseded by existing_tables_only
- `20250124_rls_existing_tables_only.sql` - Has syntax error, use fixed version

## Important Notes

1. **Always backup your database before running migrations**

2. **Check for existing objects**: Many migrations use `IF NOT EXISTS` but some don't

3. **RLS Dependencies**: The RLS migrations require:
   - All tables to exist first
   - The role helper functions (`has_role`, `is_admin`, etc.)
   
4. **Run in Supabase Dashboard**: Use the SQL Editor in Supabase Dashboard

5. **Order matters**: Some migrations depend on functions or tables from earlier migrations

## Quick Start

If starting fresh, run all migrations in order from Phase 1-6.

If updating existing database:
1. Check which migrations have already been applied
2. Start from the next unapplied migration
3. Always run RLS migrations last

## Troubleshooting

- **"relation does not exist"**: Table hasn't been created yet, check migration order
- **"function does not exist"**: Role functions haven't been created, run RLS fixed migration
- **"permission denied"**: Can't create functions in auth schema, use public schema
- **Syntax errors**: Use the "_fixed" versions of migrations