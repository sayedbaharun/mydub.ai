# Consolidated Migration - Production Ready

## Overview
This consolidated migration combines all previous migrations into a single, clean production-ready migration file.

## What's Included
- Core tables (profiles, articles, categories, comments, bookmarks)
- AI and automation tables (ai_reporters, reporter_sources, ai_usage_tracking)
- Analytics and monitoring tables
- User interaction tables (preferences, newsletters, push notifications)
- Content management tables (moderation, editorial workflow)
- Practical information tables (government services, tourism)
- Support tables (cache, arabic phrases)
- Comprehensive indexes for performance
- Row Level Security policies
- Functions and triggers
- Initial data setup

## Migration Order
1. Drop existing policies (cleanup)
2. Create tables
3. Create indexes
4. Enable RLS
5. Create policies
6. Create functions and triggers
7. Create views
8. Insert initial data

## Testing
Run this migration on a test database first:
```bash
supabase db reset
supabase db push
```

## Production Deployment
1. Backup existing database
2. Run migration during maintenance window
3. Verify all tables and policies
4. Test critical paths
