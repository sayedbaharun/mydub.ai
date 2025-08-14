#!/bin/bash

# Script to organize and consolidate database migrations
# This creates a backup and then consolidates migrations for cleaner deployment

set -e

echo "🔧 Organizing Database Migrations..."

# Create backup directory
BACKUP_DIR="supabase/migrations/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup existing migrations
echo "📦 Backing up existing migrations to $BACKUP_DIR"
cp -r supabase/migrations/*.sql "$BACKUP_DIR/" 2>/dev/null || true
cp -r supabase/migrations/*.md "$BACKUP_DIR/" 2>/dev/null || true

# Create consolidated migration
echo "✨ Creating consolidated migration..."

cat > supabase/migrations/20250814_consolidated_production.sql << 'EOF'
-- =====================================================================
-- MyDub.AI Production Database Schema - Consolidated Migration
-- Generated: 2025-08-14
-- =====================================================================

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    -- Drop all RLS policies
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                       r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- =====================================================================
-- Core Tables
-- =====================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'editor', 'moderator')),
    age_verified BOOLEAN DEFAULT false,
    parental_consent_date TIMESTAMP WITH TIME ZONE,
    parent_email TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Articles table
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'published', 'rejected', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    reading_time INTEGER,
    tags TEXT[],
    featured_image TEXT,
    image_caption TEXT,
    image_credit TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    parent_id UUID REFERENCES public.categories(id),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    parent_id UUID REFERENCES public.comments(id),
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    collection_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, article_id)
);

-- =====================================================================
-- AI & Content Automation Tables
-- =====================================================================

-- AI Reporters table
CREATE TABLE IF NOT EXISTS public.ai_reporters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Reporter Sources table
CREATE TABLE IF NOT EXISTS public.reporter_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.ai_reporters(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    source_url TEXT,
    source_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_checked TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- AI Usage Tracking table
CREATE TABLE IF NOT EXISTS public.ai_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    feature_name TEXT NOT NULL,
    model_used TEXT,
    tokens_used INTEGER,
    cost_usd DECIMAL(10, 6),
    request_data JSONB,
    response_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================================
-- Analytics & Monitoring Tables
-- =====================================================================

-- Analytics Events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    session_id TEXT,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Performance Metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL,
    metric_value DECIMAL,
    metric_unit TEXT,
    page_url TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================================
-- User Interaction Tables
-- =====================================================================

-- User Preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    theme TEXT DEFAULT 'system',
    language TEXT DEFAULT 'en',
    notifications JSONB DEFAULT '{"email": true, "push": false}',
    privacy JSONB DEFAULT '{"analytics": true, "personalization": true}',
    content_preferences JSONB DEFAULT '{}',
    accessibility JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Newsletter Subscriptions table
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
    preferences JSONB DEFAULT '{}',
    confirmed_at TIMESTAMP WITH TIME ZONE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Push Notifications table
CREATE TABLE IF NOT EXISTS public.push_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    device_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================================
-- Content Management Tables
-- =====================================================================

-- Content Moderation table
CREATE TABLE IF NOT EXISTS public.content_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    moderator_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Editorial Workflow table
CREATE TABLE IF NOT EXISTS public.editorial_workflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.profiles(id),
    current_stage TEXT DEFAULT 'draft',
    deadline TIMESTAMP WITH TIME ZONE,
    priority TEXT DEFAULT 'normal',
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================================
-- Practical Information Tables
-- =====================================================================

-- Government Services table
CREATE TABLE IF NOT EXISTS public.government_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    requirements TEXT[],
    process_steps JSONB DEFAULT '[]',
    fees JSONB DEFAULT '{}',
    processing_time TEXT,
    contact_info JSONB DEFAULT '{}',
    useful_links JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tourism Information table
CREATE TABLE IF NOT EXISTS public.tourism_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    location JSONB DEFAULT '{}',
    opening_hours JSONB DEFAULT '{}',
    pricing JSONB DEFAULT '{}',
    contact_info JSONB DEFAULT '{}',
    images TEXT[],
    amenities TEXT[],
    tags TEXT[],
    rating DECIMAL(3,2),
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================================
-- Support Tables
-- =====================================================================

-- Cache table for API responses
CREATE TABLE IF NOT EXISTS public.cache (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Arabic Phrases table
CREATE TABLE IF NOT EXISTS public.arabic_phrases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phrase_arabic TEXT NOT NULL,
    phrase_english TEXT NOT NULL,
    transliteration TEXT,
    category TEXT,
    usage_context TEXT,
    audio_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================================
-- Indexes for Performance
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_author ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);

CREATE INDEX IF NOT EXISTS idx_comments_article ON public.comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_article ON public.bookmarks(article_id);

CREATE INDEX IF NOT EXISTS idx_analytics_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cache_expires ON public.cache(expires_at);

-- =====================================================================
-- Row Level Security (RLS)
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporter_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arabic_phrases ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Articles policies  
CREATE POLICY "Published articles are viewable by everyone" ON public.articles
    FOR SELECT USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY "Authors can create articles" ON public.articles
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own articles" ON public.articles
    FOR UPDATE USING (auth.uid() = author_id);

-- Categories policies
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (is_active = true);

-- Comments policies
CREATE POLICY "Approved comments are viewable by everyone" ON public.comments
    FOR SELECT USING (is_approved = true OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks" ON public.bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Public read policies for informational tables
CREATE POLICY "Government services are public" ON public.government_services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Tourism info is public" ON public.tourism_info
    FOR SELECT USING (is_active = true);

CREATE POLICY "Arabic phrases are public" ON public.arabic_phrases
    FOR SELECT USING (is_active = true);

-- Cache policies
CREATE POLICY "Cache is readable by everyone" ON public.cache
    FOR SELECT USING (true);

-- =====================================================================
-- Functions and Triggers
-- =====================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'updated_at'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at 
            BEFORE UPDATE ON public.%I 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column()',
            t, t);
    END LOOP;
END $$;

-- =====================================================================
-- Views
-- =====================================================================

-- Create read-only view for news articles
CREATE OR REPLACE VIEW public.news_articles AS
SELECT 
    id,
    title,
    slug,
    content,
    summary,
    category,
    author_id,
    status,
    published_at,
    view_count,
    reading_time,
    tags,
    featured_image,
    image_caption,
    image_credit,
    metadata,
    created_at,
    updated_at
FROM public.articles
WHERE status = 'published'
ORDER BY published_at DESC;

-- Grant permissions on view
GRANT SELECT ON public.news_articles TO anon, authenticated;

-- =====================================================================
-- Initial Data
-- =====================================================================

-- Insert default categories
INSERT INTO public.categories (name, slug, description, icon, color, display_order) VALUES
    ('News', 'news', 'Latest news from Dubai and UAE', 'newspaper', '#FF6B6B', 1),
    ('Government', 'government', 'Government services and updates', 'building', '#4ECDC4', 2),
    ('Tourism', 'tourism', 'Tourism and attractions', 'map-pin', '#45B7D1', 3),
    ('Lifestyle', 'lifestyle', 'Living in Dubai', 'heart', '#96CEB4', 4),
    ('Business', 'business', 'Business news and opportunities', 'briefcase', '#FECA57', 5),
    ('Events', 'events', 'Upcoming events and activities', 'calendar', '#DDA0DD', 6),
    ('Sports', 'sports', 'Sports news and updates', 'trophy', '#98D8C8', 7),
    ('Technology', 'technology', 'Tech news and innovations', 'cpu', '#667EEA', 8)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================================
-- Completion
-- =====================================================================

-- Add comment
COMMENT ON SCHEMA public IS 'MyDub.AI Production Database Schema v1.0';
EOF

echo "📝 Creating migration documentation..."

cat > supabase/migrations/MIGRATION_CONSOLIDATED.md << 'EOF'
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
EOF

# Archive old migrations
echo "📁 Archiving old migrations..."
mkdir -p supabase/migrations/archive
mv supabase/migrations/20*.sql supabase/migrations/archive/ 2>/dev/null || true

# Keep only the consolidated migration and documentation
echo "✅ Migration consolidation complete!"
echo ""
echo "Files created:"
echo "  - supabase/migrations/20250814_consolidated_production.sql"
echo "  - supabase/migrations/MIGRATION_CONSOLIDATED.md"
echo ""
echo "Old migrations backed up to: $BACKUP_DIR"
echo "Old migrations archived to: supabase/migrations/archive/"
echo ""
echo "Next steps:"
echo "1. Review the consolidated migration"
echo "2. Test on a development database"
echo "3. Run: supabase db reset && supabase db push"