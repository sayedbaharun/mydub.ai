# MyDub.AI Complete Database Schema

## Overview
This document outlines the complete database schema required for MyDub.AI, including existing migrations and missing tables that need to be created.

## Existing Tables (Already Migrated)

### 1. Chat Tables (from 20240115_chatbot_tables.sql)
- ✅ `chat_sessions` - User chat sessions with AI
- ✅ `chat_messages` - Individual messages in chat sessions

### 2. Dashboard Tables (from 20240116_dashboard_tables.sql)
- ✅ `content` - Content management for all types
- ✅ `approval_requests` - Content approval workflow
- ✅ `activity_logs` - User activity tracking
- ✅ `profiles` - Extended user profiles (modified)

## Missing Tables (Need to Create)

### Core Tables

#### 1. News Tables
```sql
-- news_sources table
CREATE TABLE public.news_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    logo TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT true,
    credibility_score INTEGER DEFAULT 5 CHECK (credibility_score >= 1 AND credibility_score <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- news_articles table
CREATE TABLE public.news_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    title_ar TEXT,
    summary TEXT NOT NULL,
    summary_ar TEXT,
    content TEXT NOT NULL,
    content_ar TEXT,
    source_id UUID REFERENCES public.news_sources(id),
    category TEXT NOT NULL,
    author TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    url TEXT UNIQUE,
    image_url TEXT,
    video_url TEXT,
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    read_time INTEGER,
    ai_summary TEXT,
    ai_summary_ar TEXT,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    is_breaking BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    has_video BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. Government Services Tables
```sql
-- government_departments table
CREATE TABLE public.government_departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    logo TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    address_ar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- government_services table
CREATE TABLE public.government_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID REFERENCES public.government_departments(id),
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    category TEXT NOT NULL,
    url TEXT,
    requirements TEXT[],
    requirements_ar TEXT[],
    documents TEXT[],
    documents_ar TEXT[],
    fees DECIMAL(10,2),
    processing_time TEXT,
    processing_time_ar TEXT,
    is_online BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. Tourism Tables
```sql
-- tourism_attractions table
CREATE TABLE public.tourism_attractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    category TEXT NOT NULL,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    address TEXT,
    address_ar TEXT,
    opening_hours JSONB,
    admission_fee DECIMAL(10,2),
    contact_phone TEXT,
    contact_email TEXT,
    website TEXT,
    images TEXT[],
    rating DECIMAL(2,1),
    review_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- tourism_events table
CREATE TABLE public.tourism_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    category TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    location_ar TEXT NOT NULL,
    venue TEXT,
    venue_ar TEXT,
    organizer TEXT,
    organizer_ar TEXT,
    ticket_price DECIMAL(10,2),
    ticket_url TEXT,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. User Interaction Tables
```sql
-- user_favorites table
CREATE TABLE public.user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_type, content_id)
);

-- user_preferences table
CREATE TABLE public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language TEXT DEFAULT 'en',
    categories TEXT[],
    notification_email BOOLEAN DEFAULT true,
    notification_push BOOLEAN DEFAULT true,
    notification_sms BOOLEAN DEFAULT false,
    theme TEXT DEFAULT 'light',
    font_size TEXT DEFAULT 'medium',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    title_ar TEXT,
    message TEXT NOT NULL,
    message_ar TEXT,
    type TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. Search & Analytics Tables
```sql
-- search_history table
CREATE TABLE public.search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INTEGER,
    clicked_result TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- page_views table
CREATE TABLE public.page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    page_path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    session_id TEXT,
    duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- feedback table
CREATE TABLE public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'content', 'other')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. Email & Communication Tables
```sql
-- email_logs table
CREATE TABLE public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    template TEXT,
    status TEXT NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- email_subscriptions table
CREATE TABLE public.email_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    daily_digest BOOLEAN DEFAULT false,
    weekly_digest BOOLEAN DEFAULT true,
    news_alerts BOOLEAN DEFAULT true,
    event_alerts BOOLEAN DEFAULT true,
    unsubscribe_token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Indexes for Performance

```sql
-- News indexes
CREATE INDEX idx_news_articles_published ON public.news_articles(published_at DESC);
CREATE INDEX idx_news_articles_category ON public.news_articles(category);
CREATE INDEX idx_news_articles_source ON public.news_articles(source_id);
CREATE INDEX idx_news_articles_featured ON public.news_articles(is_featured) WHERE is_featured = true;

-- Government indexes
CREATE INDEX idx_gov_services_department ON public.government_services(department_id);
CREATE INDEX idx_gov_services_category ON public.government_services(category);
CREATE INDEX idx_gov_services_active ON public.government_services(is_active) WHERE is_active = true;

-- Tourism indexes
CREATE INDEX idx_tourism_attractions_category ON public.tourism_attractions(category);
CREATE INDEX idx_tourism_attractions_featured ON public.tourism_attractions(is_featured) WHERE is_featured = true;
CREATE INDEX idx_tourism_events_dates ON public.tourism_events(start_date, end_date);

-- User interaction indexes
CREATE INDEX idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_search_history_user ON public.search_history(user_id);
CREATE INDEX idx_search_history_created ON public.search_history(created_at DESC);

-- Analytics indexes
CREATE INDEX idx_page_views_path ON public.page_views(page_path);
CREATE INDEX idx_page_views_created ON public.page_views(created_at DESC);
CREATE INDEX idx_feedback_status ON public.feedback(status) WHERE status != 'closed';
```

## Row Level Security (RLS) Policies

### News Tables RLS
```sql
-- news_articles: Anyone can read published articles
CREATE POLICY "Public can view news articles" ON public.news_articles
    FOR SELECT USING (true);

-- news_sources: Anyone can view active sources
CREATE POLICY "Public can view active news sources" ON public.news_sources
    FOR SELECT USING (is_active = true);
```

### Government Services RLS
```sql
-- government_services: Anyone can view active services
CREATE POLICY "Public can view active government services" ON public.government_services
    FOR SELECT USING (is_active = true);

-- government_departments: Anyone can view active departments
CREATE POLICY "Public can view active departments" ON public.government_departments
    FOR SELECT USING (is_active = true);
```

### User Data RLS
```sql
-- user_favorites: Users can manage their own favorites
CREATE POLICY "Users can view own favorites" ON public.user_favorites
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own favorites" ON public.user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- user_preferences: Users can manage their own preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- notifications: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);
```

## Functions and Triggers

### Update Timestamps
```sql
-- Generic update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_news_articles_updated_at BEFORE UPDATE ON public.news_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_government_services_updated_at BEFORE UPDATE ON public.government_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (apply to all tables with updated_at column)
```

### View Count Increment
```sql
CREATE OR REPLACE FUNCTION increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.news_articles 
    SET view_count = view_count + 1 
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

## Migration Order

1. Create core tables (news, government, tourism)
2. Create user interaction tables
3. Create analytics tables
4. Create indexes
5. Enable RLS on all tables
6. Create RLS policies
7. Create functions and triggers
8. Grant permissions to authenticated users

## Next Steps

1. Create migration files for missing tables
2. Run migrations in Supabase
3. Seed initial data
4. Test RLS policies
5. Verify indexes performance
6. Set up database backups