# Database Deployment Guide - MyDub.AI

## Prerequisites

1. **Supabase Project**
   - Active Supabase project
   - Project URL and anon key in `.env`
   - Database connection string

2. **Access Requirements**
   - Supabase dashboard access
   - SQL editor permissions
   - RLS policy management

## Deployment Steps

### Step 1: Backup Existing Data (if any)

```sql
-- If you have existing data, create backups first
-- This is a fresh deployment, so likely not needed
```

### Step 2: Deploy Migrations

1. **Open Supabase SQL Editor**
   - Navigate to your Supabase project
   - Go to SQL Editor
   - Create a new query

2. **Copy Migration Content**
   - Open `migrations.sql`
   - Copy the entire content
   - Paste into SQL editor

3. **Execute Migration**
   - Review the SQL for any environment-specific changes
   - Click "Run" to execute
   - Monitor for any errors

### Step 3: Verify Tables Created

Run these verification queries:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected tables:
-- ai_chat_messages
-- ai_chat_sessions
-- categories
-- events
-- favorites
-- feedback
-- locations
-- news_articles
-- notifications
-- places
-- search_history
-- services
-- user_preferences
-- users

-- Check row counts (should be 0 for new deployment)
SELECT 
  'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'places', COUNT(*) FROM places
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'news_articles', COUNT(*) FROM news_articles;
```

### Step 4: Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Public read tables (no RLS needed for read)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
```

### Step 5: Create RLS Policies

```sql
-- Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- User preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Favorites
CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- Search history
CREATE POLICY "Users can manage own search history" ON search_history
  FOR ALL USING (auth.uid() = user_id);

-- Chat sessions
CREATE POLICY "Users can manage own chat sessions" ON ai_chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Chat messages
CREATE POLICY "Users can view own chat messages" ON ai_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions
      WHERE ai_chat_sessions.id = ai_chat_messages.session_id
      AND ai_chat_sessions.user_id = auth.uid()
    )
  );

-- Notifications
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Feedback
CREATE POLICY "Users can create feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Public read policies
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read places" ON places
  FOR SELECT USING (status = 'active');

CREATE POLICY "Anyone can read events" ON events
  FOR SELECT USING (status = 'published');

CREATE POLICY "Anyone can read services" ON services
  FOR SELECT USING (status = 'active');

CREATE POLICY "Anyone can read locations" ON locations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read news" ON news_articles
  FOR SELECT USING (status = 'published');
```

### Step 6: Create Database Functions

```sql
-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now());
  
  INSERT INTO public.user_preferences (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add similar triggers for other tables...
```

### Step 7: Create Indexes for Performance

```sql
-- Search performance
CREATE INDEX idx_places_name_gin ON places USING gin(to_tsvector('english', name));
CREATE INDEX idx_places_description_gin ON places USING gin(to_tsvector('english', description));
CREATE INDEX idx_events_title_gin ON events USING gin(to_tsvector('english', title));
CREATE INDEX idx_services_name_gin ON services USING gin(to_tsvector('english', name));
CREATE INDEX idx_news_title_gin ON news_articles USING gin(to_tsvector('english', title));

-- Foreign key indexes
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_chat_sessions_user_id ON ai_chat_sessions(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Status indexes
CREATE INDEX idx_places_status ON places(status);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_news_status ON news_articles(status);
```

### Step 8: Seed Initial Data

```sql
-- Insert categories
INSERT INTO categories (id, name_en, name_ar, icon, color, created_at, updated_at) VALUES
('dining', 'Dining', 'تناول الطعام', 'restaurant', '#FF6B6B', now(), now()),
('shopping', 'Shopping', 'التسوق', 'shopping-bag', '#4ECDC4', now(), now()),
('entertainment', 'Entertainment', 'ترفيه', 'film', '#45B7D1', now(), now()),
('services', 'Services', 'خدمات', 'briefcase', '#96CEB4', now(), now()),
('transport', 'Transport', 'مواصلات', 'car', '#FECA57', now(), now()),
('health', 'Health', 'صحة', 'heart', '#FF6B9D', now(), now()),
('education', 'Education', 'تعليم', 'book', '#C44569', now(), now()),
('government', 'Government', 'حكومة', 'building', '#786FA6', now(), now());

-- Insert locations
INSERT INTO locations (id, name_en, name_ar, created_at, updated_at) VALUES
('downtown', 'Downtown Dubai', 'وسط دبي', now(), now()),
('marina', 'Dubai Marina', 'دبي مارينا', now(), now()),
('jbr', 'JBR', 'جي بي آر', now(), now()),
('deira', 'Deira', 'ديرة', now(), now()),
('bur-dubai', 'Bur Dubai', 'بر دبي', now(), now()),
('jumeirah', 'Jumeirah', 'جميرا', now(), now()),
('business-bay', 'Business Bay', 'الخليج التجاري', now(), now()),
('al-barsha', 'Al Barsha', 'البرشاء', now(), now());
```

### Step 9: Test Database Connection

```typescript
// Test in your application
import { supabase } from './src/lib/supabase';

async function testConnection() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .limit(5);
    
  if (error) {
    console.error('Database connection error:', error);
  } else {
    console.log('Database connected successfully:', data);
  }
}
```

### Step 10: Create Edge Functions

Create account deletion edge function:

```typescript
// supabase/functions/delete-user-account/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) throw new Error('Invalid user')

    // Delete user data from all tables
    const tables = [
      'feedback',
      'notifications',
      'ai_chat_messages',
      'ai_chat_sessions',
      'search_history',
      'favorites',
      'user_preferences',
      'users'
    ]

    for (const table of tables) {
      if (table === 'ai_chat_messages') {
        // Delete messages through sessions
        await supabase
          .from(table)
          .delete()
          .in('session_id', 
            supabase
              .from('ai_chat_sessions')
              .select('id')
              .eq('user_id', user.id)
          )
      } else {
        await supabase
          .from(table)
          .delete()
          .eq('user_id', user.id)
      }
    }

    // Delete auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

Deploy the edge function:
```bash
supabase functions deploy delete-user-account
```

## Verification Checklist

- [ ] All tables created successfully
- [ ] RLS enabled on all tables
- [ ] RLS policies created
- [ ] Database functions created
- [ ] Indexes created
- [ ] Initial data seeded
- [ ] Connection test passed
- [ ] Edge functions deployed

## Rollback Plan

If issues occur:

```sql
-- Drop all tables (CAUTION: This will delete all data)
DROP TABLE IF EXISTS ai_chat_messages CASCADE;
DROP TABLE IF EXISTS ai_chat_sessions CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS search_history CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS news_articles CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS places CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Then re-run migrations
```

## Monitoring

After deployment:

1. **Check Supabase Dashboard**
   - Monitor API usage
   - Check error logs
   - Review slow queries

2. **Test Critical Paths**
   - User registration
   - Search functionality
   - Data retrieval

3. **Performance Metrics**
   - Query execution time
   - Index usage
   - Connection pool status

## Support

If you encounter issues:

1. Check Supabase logs
2. Verify environment variables
3. Test with Supabase CLI
4. Review RLS policies

---

**Next Steps**: After successful deployment, update `.env` with production values and test all features.